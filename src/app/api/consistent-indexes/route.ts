// src/app/api/consistent-indexes/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface IndexMetrics {
  id: string;
  name: string;
  code: string;
  returns: number;
  sharpeRatio: number;
  consistencyScore: number;
  positiveMonthsPercentage: number;
  maxDrawdown: number;
  volatility: number;
  period: number;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch broad-based indices with their price history
    const indices = await prisma.marketIndex.findMany({
      where: {
        indexType: "BROAD_BASED",
      },
      include: {
        history: {
          orderBy: {
            date: "desc",
          },
          take: 252, // One year of trading days
        },
      },
    });

    // Calculate comprehensive metrics for each index
    const indexMetrics: IndexMetrics[] = indices
      .map((index) => {
        if (!index.history.length) {
          console.log(`No history for index ${index.name}`);
          return null;
        }

        // Transform history data into a consistent format
        const priceHistory = index.history.map((point) => ({
          date: point.date,
          value: Number(point.close),
        }));

        // Calculate monthly performance metrics
        const monthlyReturns = calculateMonthlyReturns(priceHistory);
        if (!monthlyReturns.length) return null;

        const positiveMonths = monthlyReturns.filter((r) => r > 0).length;
        const positiveMonthsPercentage =
          (positiveMonths / monthlyReturns.length) * 100;

        // Calculate overall performance metrics
        const returns = calculateTotalReturn(priceHistory);
        const volatilityMetrics = calculateVolatilityMetrics(priceHistory);
        const maxDrawdown = calculateMaxDrawdown(priceHistory);

        // Calculate comprehensive consistency score
        const consistencyScore = calculateConsistencyScore({
          sharpeRatio: volatilityMetrics.sharpeRatio,
          positiveMonthsPercentage,
          maxDrawdown,
          returns,
          volatility: volatilityMetrics.standardDeviation,
        });

        return {
          id: index.id,
          name: index.name,
          code: index.code,
          returns,
          sharpeRatio: volatilityMetrics.sharpeRatio,
          consistencyScore,
          positiveMonthsPercentage,
          maxDrawdown,
          volatility: volatilityMetrics.standardDeviation,
          period: 1,
        };
      })
      .filter((item): item is IndexMetrics => item !== null)
      // Sort by consistency score instead of just positive months
      .sort((a, b) => b.consistencyScore - a.consistencyScore);

    const mostConsistent = indexMetrics[0] || null;

    // Transform the response to match the expected format
    return NextResponse.json(
      mostConsistent
        ? {
            id: mostConsistent.id,
            name: mostConsistent.name,
            code: mostConsistent.code,
            returns: mostConsistent.returns,
            consistency: getConsistencyRating(mostConsistent.consistencyScore),
            period: mostConsistent.period,
          }
        : null
    );
  } catch (error) {
    console.error("Error fetching consistent indexes:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

function calculateMonthlyReturns(
  history: { date: Date; value: number }[]
): number[] {
  const monthlyReturns: number[] = [];
  if (history.length < 2) return monthlyReturns;

  let currentMonth = new Date(history[0].date).getMonth();
  let monthStartValue = history[0].value;

  for (let i = 1; i < history.length; i++) {
    const date = new Date(history[i].date);
    if (date.getMonth() !== currentMonth) {
      const monthEndValue = history[i - 1].value;
      const monthReturn =
        ((monthEndValue - monthStartValue) / monthStartValue) * 100;
      monthlyReturns.push(monthReturn);
      monthStartValue = history[i].value;
      currentMonth = date.getMonth();
    }
  }

  if (history.length > 0) {
    const lastValue = history[history.length - 1].value;
    monthlyReturns.push(
      ((lastValue - monthStartValue) / monthStartValue) * 100
    );
  }

  return monthlyReturns;
}

function calculateTotalReturn(
  history: { date: Date; value: number }[]
): number {
  if (history.length < 2) return 0;
  const startValue = history[history.length - 1].value;
  const endValue = history[0].value;
  return ((endValue - startValue) / startValue) * 100;
}

function calculateVolatilityMetrics(history: { date: Date; value: number }[]) {
  // Calculate daily returns
  const dailyReturns = history.slice(0, -1).map((point, index) => {
    const nextValue = history[index + 1].value;
    return ((point.value - nextValue) / nextValue) * 100;
  });

  // Calculate standard deviation
  const mean =
    dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    dailyReturns.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate annualized Sharpe ratio (assuming risk-free rate of 4%)
  const riskFreeRate = 4;
  const annualizedReturn = calculateTotalReturn(history) - riskFreeRate;
  const sharpeRatio = annualizedReturn / (standardDeviation * Math.sqrt(252));

  return { standardDeviation, sharpeRatio };
}

function calculateMaxDrawdown(
  history: { date: Date; value: number }[]
): number {
  let maxDrawdown = 0;
  let peak = history[0].value;

  history.forEach((point) => {
    if (point.value > peak) {
      peak = point.value;
    } else {
      const drawdown = ((peak - point.value) / peak) * 100;
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
  // Normalize metrics to 0-100 scale
  const normalizedSharpe = Math.min(sharpeRatio * 25, 100);
  const normalizedPositiveMonths = positiveMonthsPercentage;
  const normalizedDrawdown = Math.max(0, 100 - maxDrawdown);
  const normalizedReturns = Math.min(Math.max(returns, 0) * 5, 100);
  const normalizedVolatility = Math.max(0, 100 - volatility * 5);

  // Weighted average for final score
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
