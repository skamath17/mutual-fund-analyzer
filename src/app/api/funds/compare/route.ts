// src/app/api/funds/compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";
import { NAVData } from "@/lib/types/calculations";

interface NAVHistory {
  date: Date;
  nav: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundIds } = body; // These will be schemeCodes now

    console.log("Comparing funds with IDs:", fundIds);

    // Fetch data for all funds
    const fundsData = await Promise.all(
      fundIds.map(async (schemeCode: string) => {
        const fund = await prisma.mutualFund.findUnique({
          where: { schemeCode }, // Changed from id to schemeCode
          include: {
            fundHouse: true,
            category: true,
            navHistory: {
              orderBy: { date: "asc" },
            },
            holdings: {
              take: 10,
              orderBy: { percentage: "desc" },
            },
          },
        });
        if (!fund) {
          console.log(`Fund not found for schemeCode: ${schemeCode}`);
        }
        return fund;
      })
    );

    // Filter out any null funds and validate NAV history
    const validFunds = fundsData.filter(
      (fund): fund is NonNullable<typeof fund> => {
        if (!fund) return false;
        if (!fund.navHistory?.length) {
          console.log(`No NAV history for fund ${fund.schemeCode}`);
          return false;
        }
        return true;
      }
    );

    if (validFunds.length === 0) {
      return NextResponse.json(
        { error: "No valid funds found for comparison" },
        { status: 404 }
      );
    }

    // Calculate metrics for each fund
    const comparisonData = validFunds.map((fund) => {
      const navHistory: NAVData[] = fund.navHistory.map((nh: NAVHistory) => ({
        date: nh.date,
        nav: Number(nh.nav),
      }));

      const returns = {
        "1Y": calculateDetailedReturns(navHistory, "1Y"),
        "3Y": calculateDetailedReturns(navHistory, "3Y"),
        "5Y": calculateDetailedReturns(navHistory, "5Y"),
      };

      const volatility = calculateVolatilityMetrics(navHistory);

      return {
        fundId: fund.schemeCode, // Changed from id to schemeCode
        fundName: fund.schemeName,
        fundHouse: fund.fundHouse.name,
        category: fund.category.name,
        metrics: {
          returns,
          volatility,
          holdings: fund.holdings,
        },
        navHistory,
      };
    });

    console.log(`Successfully processed ${comparisonData.length} funds`);

    return NextResponse.json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    console.error("Error comparing funds:", error);
    return NextResponse.json(
      {
        error: "Failed to compare funds",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
