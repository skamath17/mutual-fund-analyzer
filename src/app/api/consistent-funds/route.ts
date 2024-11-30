// src/app/api/consistent-funds/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";

interface FundMetric {
  fundId: string;
  fundName: string;
  returns: number;
  sharpeRatio: number; // Now explicitly defined as number
  consistency: string;
}

function getConsistencyRating(sharpeRatio: number): string {
  if (sharpeRatio > 2) return "Very High";
  if (sharpeRatio > 1) return "High";
  if (sharpeRatio > 0) return "Moderate";
  return "Low";
}

export async function GET() {
  try {
    const funds = await prisma.mutualFund.findMany({
      include: {
        fundHouse: true,
        category: true,
        navHistory: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    const fundMetrics: FundMetric[] = await Promise.all(
      funds.map(async (fund) => {
        const navHistory = fund.navHistory.map((nh) => ({
          date: nh.date,
          nav: Number(nh.nav),
        }));

        const returns = calculateDetailedReturns(navHistory, "1Y");
        const volatility = calculateVolatilityMetrics(navHistory);

        return {
          fundId: fund.id,
          fundName: `${fund.fundHouse.name} - ${fund.category.name}`,
          returns: returns.absoluteReturn,
          sharpeRatio: volatility.sharpeRatio || 0, // Ensure we always have a number
          consistency: getConsistencyRating(volatility.sharpeRatio || 0),
        };
      })
    );

    // Sort by Sharpe ratio and get most consistent fund
    const mostConsistent = fundMetrics.sort(
      (a, b) => b.sharpeRatio - a.sharpeRatio
    )[0];

    return NextResponse.json(mostConsistent);
  } catch (error) {
    console.error("Error fetching consistent funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch consistent funds" },
      { status: 500 }
    );
  }
}
