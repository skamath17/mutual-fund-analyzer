// src/app/api/funds/compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";
import { NAVData } from "@/lib/types/calculations";

interface NAVHistory {
  date: Date;
  nav: number | string; // Could be either as it comes from Prisma
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundIds } = body; // Array of fund IDs to compare

    // Fetch data for all funds
    const fundsData = await Promise.all(
      fundIds.map(async (fundId: string) => {
        const fund = await prisma.mutualFund.findUnique({
          where: { id: fundId },
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
        return fund;
      })
    );

    // Calculate metrics for each fund
    const comparisonData = fundsData.map((fund) => {
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
        fundId: fund.id,
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

    return NextResponse.json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    console.error("Error comparing funds:", error);
    return NextResponse.json(
      { error: "Failed to compare funds" },
      { status: 500 }
    );
  }
}
