import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateAllPeriodReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";
import { IndexHistory, NAVHistory } from "@prisma/client";
import { NAVData } from "@/lib/types/calculations";

interface NavPoint {
  date: Date;
  nav: number;
}

function filterNavHistoryByPeriod(
  navHistory: NavPoint[],
  period: string
): NavPoint[] {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1Y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case "3Y":
      startDate.setFullYear(endDate.getFullYear() - 3);
      break;
    case "5Y":
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    default:
      startDate.setFullYear(endDate.getFullYear() - 1); // Default to 1Y
  }

  return navHistory.filter((point) => {
    const pointDate = new Date(point.date);
    return pointDate >= startDate && pointDate <= endDate;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funds, period = "1Y" } = body;

    console.log("Testing basket for funds:", funds);

    // Fetch all funds with their NAV histories
    const fundsData = await Promise.all(
      funds.map(async (fund: { fundId: string; allocation: number }) => {
        const fundData = await prisma.mutualFund.findUnique({
          where: {
            schemeCode: fund.fundId,
          },
          include: {
            navHistory: {
              orderBy: {
                date: "desc",
              },
            },
          },
        });

        if (!fundData) {
          console.log(`Fund not found: ${fund.fundId}`);
          return null;
        }

        return {
          ...fundData,
          allocation: fund.allocation,
        };
      })
    );

    const validFunds = fundsData.filter(
      (fund): fund is NonNullable<typeof fund> =>
        fund !== null && fund.navHistory.length > 0
    );

    if (validFunds.length === 0) {
      return NextResponse.json(
        { error: "No valid funds found for basket analysis" },
        { status: 404 }
      );
    }

    // Process NAV histories with proper validation
    const processedFunds = validFunds.map((fund) => {
      const navHistory: NavPoint[] = fund.navHistory
        .map((nh: NAVHistory) => ({
          date: nh.date,
          nav: Number(nh.nav),
        }))
        .sort(
          (a: NavPoint, b: NavPoint) => a.date.getTime() - b.date.getTime()
        );

      return {
        fundId: fund.schemeCode,
        allocation: fund.allocation,
        navHistory,
      };
    });

    // Calculate combined NAV history
    const combinedNavHistory = calculateCombinedNavHistory(processedFunds);

    if (combinedNavHistory.length < 2) {
      return NextResponse.json(
        { error: "Insufficient data for basket analysis" },
        { status: 400 }
      );
    }

    // Filter combined history based on period
    const filteredNavHistory = filterNavHistoryByPeriod(
      combinedNavHistory,
      period
    );

    // Calculate metrics
    const returns = calculateReturns(filteredNavHistory, period);
    const volatility = calculateVolatilityMetrics(filteredNavHistory);

    const metrics = {
      returns: returns.absoluteReturn,
      annualizedReturn: returns.annualizedReturn,
      maxDrawdown: calculateMaxDrawdown(filteredNavHistory),
      sharpeRatio: volatility.sharpeRatio,
      volatility: volatility.standardDeviation,
    };

    // Fetch Nifty data
    const niftyIndex = await prisma.marketIndex.findFirst({
      where: {
        code: "256265",
      },
      include: {
        history: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    const niftyHistory =
      niftyIndex?.history.map((nh: IndexHistory) => ({
        date: nh.date,
        nav: Number(nh.close),
      })) || [];

    console.log("Nifty history points:", niftyHistory.length);

    const filteredNiftyHistory = filterNavHistoryByPeriod(niftyHistory, period);

    console.log("Filtered Nifty points:", filteredNiftyHistory.length);

    return NextResponse.json({
      status: "success",
      data: {
        metrics,
        navHistory: filteredNavHistory,
        niftyHistory: filteredNiftyHistory,
      },
    });
  } catch (error) {
    console.error("Error analyzing basket:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to analyze basket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateCombinedNavHistory(
  funds: Array<{ allocation: number; navHistory: NAVData[] }>
): NAVData[] {
  // If no funds, return empty array
  if (funds.length === 0) return [];

  const allDates = new Set(
    funds.flatMap((fund) => fund.navHistory.map((nh) => nh.date.toISOString()))
  );

  const sortedDates = Array.from(allDates).sort((a: string, b: string) =>
    a.localeCompare(b)
  );

  const combinedHistory: NavPoint[] = [];

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    let combinedNav = 0;

    // Calculate weighted NAV for this date
    for (const fund of funds) {
      const navPoint = fund.navHistory.find(
        (nh) => nh.date.toISOString() === dateStr
      );

      if (navPoint) {
        // Add weighted NAV (NAV * allocation percentage)
        combinedNav += navPoint.nav * (fund.allocation / 100);
      }
    }

    // Only add point if we have valid NAV
    if (combinedNav > 0) {
      combinedHistory.push({
        date,
        nav: combinedNav,
      });
    }
  }

  // Sort by date ascending
  return combinedHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function calculateMaxDrawdown(navHistory: NAVData[]): number {
  if (navHistory.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = navHistory[0].nav;

  for (const point of navHistory) {
    if (point.nav > peak) {
      peak = point.nav;
    }

    const drawdown = ((peak - point.nav) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

function calculateReturns(navHistory: NAVData[], period: string) {
  if (navHistory.length < 2) {
    return {
      absoluteReturn: 0,
      annualizedReturn: 0,
    };
  }

  const latestNAV = navHistory[navHistory.length - 1].nav;
  const initialNAV = navHistory[0].nav;

  const absoluteReturn = ((latestNAV - initialNAV) / initialNAV) * 100;

  // Calculate years between first and last data point
  const years =
    (navHistory[navHistory.length - 1].date.getTime() -
      navHistory[0].date.getTime()) /
    (365 * 24 * 60 * 60 * 1000);

  const annualizedReturn =
    (Math.pow(1 + absoluteReturn / 100, 1 / years) - 1) * 100;

  return {
    absoluteReturn,
    annualizedReturn,
  };
}
