// src/app/api/market-trend/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface DailyNav {
  date: string;
  nav: number;
}

export async function GET() {
  try {
    // Get all large cap funds
    const largecapFunds = await prisma.mutualFund.findMany({
      where: {
        category: {
          name: "Large Cap Fund",
        },
      },
      include: {
        navHistory: {
          orderBy: {
            date: "desc",
          },
          take: 30, // Last 30 days
        },
      },
    });

    // Calculate average NAV for each date
    const dailyAverages = new Map<string, number[]>();
    let latestAverage = 0;
    let previousAverage = 0;

    largecapFunds.forEach((fund) => {
      fund.navHistory.forEach((history, index) => {
        const date = history.date.toISOString().split("T")[0];
        const nav = Number(history.nav);

        if (!dailyAverages.has(date)) {
          dailyAverages.set(date, []);
        }
        dailyAverages.get(date)?.push(nav);

        // Track latest and previous day averages
        if (index === 0) latestAverage = nav;
        if (index === 1) previousAverage = nav;
      });
    });

    // Convert to array and calculate final averages
    const trendData: DailyNav[] = Array.from(dailyAverages.entries())
      .map(([date, navs]) => ({
        date,
        nav:
          navs.reduce((acc: number, curr: number) => acc + curr, 0) /
          navs.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate day's change percentage
    const changePercentage =
      ((latestAverage - previousAverage) / previousAverage) * 100;

    return NextResponse.json({
      data: trendData,
      currentValue: latestAverage,
      changePercentage,
    });
  } catch (error) {
    console.error("Error fetching market trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch market trend" },
      { status: 500 }
    );
  }
}
