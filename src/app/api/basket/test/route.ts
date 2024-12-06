// src/app/api/basket/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  calculateBasketMetrics,
  filterNavHistoryByPeriod,
} from "@/lib/calculations/basket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funds, period = "1Y" } = body; // Get period from request

    // Fetch NAV history for all funds
    const fundsData = await Promise.all(
      funds.map(async (fund: { fundId: string }) => {
        const data = await prisma.mutualFund.findUnique({
          where: { id: fund.fundId },
          include: {
            navHistory: {
              orderBy: { date: "asc" },
            },
          },
        });
        return data;
      })
    );

    // Filter NAV history based on period before calculations
    const filteredFundsData = fundsData.map((fund) => ({
      ...fund,
      navHistory: filterNavHistoryByPeriod(fund.navHistory, period),
    }));

    const metrics = calculateBasketMetrics(filteredFundsData, funds);

    return NextResponse.json({
      success: true,
      metrics,
      period,
    });
  } catch (error) {
    console.error("Error analyzing basket:", error);
    return NextResponse.json(
      { error: "Failed to analyze basket" },
      { status: 500 }
    );
  }
}
