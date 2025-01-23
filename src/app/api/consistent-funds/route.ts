// src/app/api/consistent-funds/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";

interface ConsistencyMetrics {
  fundId: string;
  fundHouseName: string;
  categoryName: string;
  schemeName: string;
  schemeCode: string;
  returns: number;
  sharpeRatio: number;
  consistencyScore: number;
  positiveMonthsPercentage: number;
  maxDrawdown: number;
  volatility: number;
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

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const fundMetrics = await Promise.allSettled(
      funds.map(async (fund) => {
        try {
          const navHistory = fund.navHistory
            .filter((nh) => {
              const navDate = new Date(nh.date);
              navDate.setHours(0, 0, 0, 0);
              return navDate >= oneYearAgo;
            })
            .map((nh) => ({ date: nh.date, nav: Number(nh.nav) }));

          if (navHistory.length < 240) {
            return null;
          }

          // Calculate monthly returns
          const monthlyReturns = calculateMonthlyReturns(navHistory);
          const positiveMonths = monthlyReturns.filter((r) => r > 0).length;
          const positiveMonthsPercentage =
            (positiveMonths / monthlyReturns.length) * 100;

          // Calculate overall returns and risk metrics
          const returns = calculateDetailedReturns(navHistory, "1Y");
          const volatility = calculateVolatilityMetrics(navHistory);
          const maxDrawdown = calculateMaxDrawdown(navHistory);

          // Calculate consistency score (weighted average of multiple factors)
          const consistencyScore = calculateConsistencyScore({
            sharpeRatio: volatility.sharpeRatio || 0,
            positiveMonthsPercentage,
            maxDrawdown,
            returns: returns.absoluteReturn,
            volatility: volatility.standardDeviation,
          });

          return {
            fundId: fund.id,
            fundHouseName: fund.fundHouse.name,
            categoryName: fund.category.name,
            schemeName: fund.schemeName,
            schemeCode: fund.schemeCode,
            returns: returns.absoluteReturn,
            sharpeRatio: volatility.sharpeRatio || 0,
            consistencyScore,
            positiveMonthsPercentage,
            maxDrawdown,
            volatility: volatility.standardDeviation,
          };
        } catch (err) {
          console.error(`Error processing fund ${fund.schemeName}:`, err);
          return null;
        }
      })
    );

    const validFunds = fundMetrics
      .filter(
        (result): result is PromiseFulfilledResult<ConsistencyMetrics> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    // Sort by consistency score
    const mostConsistent = validFunds.sort(
      (a, b) => b.consistencyScore - a.consistencyScore
    )[0];

    if (!mostConsistent) {
      return NextResponse.json({
        schemeName: "N/A",
        schemeCode: "N/A",
        fundHouse: "N/A",
        returns: 0,
        consistency: "N/A",
      });
    }

    return NextResponse.json({
      schemeName: mostConsistent.schemeName,
      schemeCode: mostConsistent.schemeCode,
      fundHouse: mostConsistent.fundHouseName,
      returns: mostConsistent.returns,
      consistency: getConsistencyRating(mostConsistent.consistencyScore),
    });
  } catch (error) {
    console.error("Error fetching consistent funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch consistent funds" },
      { status: 500 }
    );
  }
}

function calculateMonthlyReturns(
  navHistory: { date: Date; nav: number }[]
): number[] {
  const monthlyReturns: number[] = [];
  let currentMonth = new Date(navHistory[0].date).getMonth();
  let monthStartValue = navHistory[0].nav;

  navHistory.forEach((point, index) => {
    const date = new Date(point.date);
    if (date.getMonth() !== currentMonth || index === navHistory.length - 1) {
      const monthEndValue = navHistory[index - 1]?.nav || point.nav;
      const monthReturn =
        ((monthEndValue - monthStartValue) / monthStartValue) * 100;
      monthlyReturns.push(monthReturn);
      monthStartValue = point.nav;
      currentMonth = date.getMonth();
    }
  });

  return monthlyReturns;
}

function calculateMaxDrawdown(
  navHistory: { date: Date; nav: number }[]
): number {
  let maxDrawdown = 0;
  let peak = navHistory[0].nav;

  navHistory.forEach((point) => {
    if (point.nav > peak) {
      peak = point.nav;
    } else {
      const drawdown = ((peak - point.nav) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  });

  return maxDrawdown;
}

function calculateConsistencyScore({
  sharpeRatio,
  positiveMonthsPercentage,
  maxDrawdown,
  returns,
  volatility,
}: {
  sharpeRatio: number;
  positiveMonthsPercentage: number;
  maxDrawdown: number;
  returns: number;
  volatility: number;
}): number {
  // Normalize each metric to a 0-100 scale
  const normalizedSharpe = Math.min(sharpeRatio * 25, 100); // Sharpe > 4 gets max score
  const normalizedPositiveMonths = positiveMonthsPercentage;
  const normalizedDrawdown = Math.max(0, 100 - maxDrawdown); // Lower drawdown is better
  const normalizedReturns = Math.min(Math.max(returns, 0) * 5, 100); // Returns up to 20% get proportional scores
  const normalizedVolatility = Math.max(0, 100 - volatility * 5); // Lower volatility is better

  // Weighted average of all metrics
  return (
    normalizedSharpe * 0.25 +
    normalizedPositiveMonths * 0.25 +
    normalizedDrawdown * 0.2 +
    normalizedReturns * 0.15 +
    normalizedVolatility * 0.15
  );
}

function getConsistencyRating(score: number): string {
  if (score > 80) return "Very High";
  if (score > 60) return "High";
  if (score > 40) return "Moderate";
  if (score > 20) return "Low";
  return "Very Low";
}
