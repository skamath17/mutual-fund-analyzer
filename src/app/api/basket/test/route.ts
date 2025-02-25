import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NAVData } from "@/lib/types/calculations";

interface NavPoint {
  date: Date;
  nav: number;
}

interface FundInput {
  fundId: string; // This is schemeCode from the frontend
  allocation: number;
}

interface ProcessedFund {
  fundId: string;
  allocation: number;
  navHistory: NAVData[];
  hasData: Record<"1Y" | "3Y" | "5Y", boolean>; // Track data availability per period
}

interface ApiResponse {
  status: "success" | "error";
  data?: {
    navHistory: NAVData[];
    niftyHistory: NAVData[];
    missingFunds: Record<"1Y" | "3Y" | "5Y", string[]>; // Funds missing data per period
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funds }: { funds: FundInput[] } = body;

    // Fetch funds with NAV history (up to 5Y)
    const fundsData = await prisma.mutualFund.findMany({
      where: {
        schemeCode: { in: funds.map((f) => f.fundId) },
      },
      include: {
        navHistory: {
          where: {
            date: {
              gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 5)
              ),
            },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    const processedFunds = fundsData.map((fund) => {
      // First deduplicate the NAV history by date (ignoring time)
      const uniqueNavHistory = Array.from(
        new Map(
          fund.navHistory.map((nh) => [
            nh.date.toISOString().split("T")[0], // Use date as key, ignoring time
            {
              date: new Date(nh.date.toISOString().split("T")[0]), // Store date without time
              nav: Number(nh.nav),
            },
          ])
        ).values()
      ).sort((a, b) => a.date.getTime() - b.date.getTime());

      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const threeYearsAgo = new Date(now);
      threeYearsAgo.setFullYear(now.getFullYear() - 3);

      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setFullYear(now.getFullYear() - 5);

      const requiredPoints = {
        "1Y": 240,
        "3Y": 720,
        "5Y": 1200,
      };

      // Check data points using deduplicated history
      const hasData = {
        "1Y":
          uniqueNavHistory.filter((p) => p.date >= oneYearAgo).length >=
          requiredPoints["1Y"],
        "3Y":
          uniqueNavHistory.filter((p) => p.date >= threeYearsAgo).length >=
          requiredPoints["3Y"],
        "5Y":
          uniqueNavHistory.filter((p) => p.date >= fiveYearsAgo).length >=
          requiredPoints["5Y"],
      };

      // Add debug logging
      console.log(`Fund ${fund.schemeCode} analysis:`, {
        originalPoints: fund.navHistory.length,
        uniquePoints: uniqueNavHistory.length,
        pointsByPeriod: {
          "1Y": uniqueNavHistory.filter((p) => p.date >= oneYearAgo).length,
          "3Y": uniqueNavHistory.filter((p) => p.date >= threeYearsAgo).length,
          "5Y": uniqueNavHistory.filter((p) => p.date >= fiveYearsAgo).length,
        },
        hasData,
      });

      return {
        fundId: fund.schemeCode,
        allocation:
          funds.find((f) => f.fundId === fund.schemeCode)?.allocation || 0,
        navHistory: uniqueNavHistory,
        hasData,
      };
    });

    const validFunds = processedFunds.filter((f) => f.navHistory.length > 0);
    console.log(
      "Processed Funds:",
      processedFunds.map((f) => ({
        fundId: f.fundId,
        navCount: f.navHistory.length,
        hasData: f.hasData,
      }))
    );

    if (validFunds.length === 0) {
      return NextResponse.json(
        { error: "No funds with NAV history found" },
        { status: 404 }
      ) as NextResponse<ApiResponse>;
    }

    const combinedNavHistory = calculateCombinedNavHistory(validFunds);

    if (combinedNavHistory.length < 2) {
      return NextResponse.json(
        { error: "Insufficient data for analysis" },
        { status: 400 }
      ) as NextResponse<ApiResponse>;
    }

    const niftyHistory = await prisma.indexHistory
      .findMany({
        where: {
          index: { code: "256265" },
          date: {
            gte: new Date(new Date().setFullYear(new Date().getFullYear() - 5)),
          },
        },
        orderBy: { date: "asc" },
        select: { date: true, close: true },
      })
      .then((data) =>
        data.map((d) => ({ date: d.date, nav: Number(d.close) }))
      );

    // Check for funds missing data per period (require sufficient points from period start)
    const missingFunds: Record<"1Y" | "3Y" | "5Y", string[]> = {
      "1Y": processedFunds.filter((f) => !f.hasData["1Y"]).map((f) => f.fundId),
      "3Y": processedFunds.filter((f) => !f.hasData["3Y"]).map((f) => f.fundId),
      "5Y": processedFunds.filter((f) => !f.hasData["5Y"]).map((f) => f.fundId),
    };

    return NextResponse.json({
      status: "success",
      data: {
        navHistory: combinedNavHistory,
        niftyHistory,
        missingFunds,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error analyzing basket:", error);
    return NextResponse.json(
      { error: "Failed to analyze basket" },
      { status: 500 }
    ) as NextResponse<ApiResponse>;
  }
}

function calculateCombinedNavHistory(funds: ProcessedFund[]): NAVData[] {
  if (funds.length === 0) return [];

  const totalAllocation = funds.reduce((sum, fund) => sum + fund.allocation, 0);
  const normalizedFunds = funds.map((fund) => ({
    ...fund,
    allocation: fund.allocation / totalAllocation,
  }));

  const dateSet = new Set<string>();
  normalizedFunds.forEach((fund) => {
    fund.navHistory.forEach((nav) =>
      dateSet.add(nav.date.toISOString().split("T")[0])
    );
  });

  const sortedDates = Array.from(dateSet).sort();
  const combinedHistory: NAVData[] = [];
  let firstValidPoint = true;
  let initialValue = 100;

  for (const dateStr of sortedDates) {
    let dailyNav = 0;
    let allFundsHaveData = true;

    for (const fund of normalizedFunds) {
      const navPoint = fund.navHistory.find(
        (n) => n.date.toISOString().split("T")[0] === dateStr
      );
      if (!navPoint) {
        allFundsHaveData = false;
        break;
      }
      dailyNav += navPoint.nav * fund.allocation;
    }

    if (allFundsHaveData) {
      if (firstValidPoint) {
        initialValue = dailyNav;
        firstValidPoint = false;
      }
      combinedHistory.push({
        date: new Date(dateStr),
        nav: (dailyNav / initialValue) * 100,
      });
    }
  }

  return combinedHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
}
