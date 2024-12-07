// src/app/api/basket/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  calculateBasketMetrics,
  filterNavHistoryByPeriod,
} from "@/lib/calculations/basket";
import { BasketNAV } from "@/lib/types/calculations";
import { Decimal } from "@prisma/client/runtime/library";

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

    const result = calculateBasketMetrics(filteredFundsData, funds);

    // Get the date range from filtered basket data
    const startDate = new Date(result.navHistory[0].date);
    const endDate = new Date(
      result.navHistory[result.navHistory.length - 1].date
    );

    // Fetch Nifty data for the same period
    const niftyData = await prisma.niftyHistory.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Normalize both datasets to base 100
    const normalizedData = normalizeDatasets(result.navHistory, niftyData);

    return NextResponse.json({
      success: true,
      metrics: result.metrics,
      navHistory: result.navHistory,
      niftyHistory: normalizedData.niftyHistory,
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

interface NiftyDataPoint {
  id: string;
  date: Date;
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: bigint | null;
  createdAt: Date;
}

function normalizeDatasets(
  basketHistory: BasketNAV[],
  niftyHistory: NiftyDataPoint[]
) {
  // Get initial values
  const initialBasketValue = basketHistory[0].nav;
  const initialNiftyValue = Number(niftyHistory[0].close);

  // Normalize both datasets to start at 100
  const normalizedBasket = basketHistory.map((point) => ({
    date: point.date,
    nav: (point.nav / initialBasketValue) * 100,
  }));

  const normalizedNifty = niftyHistory.map((point) => ({
    date: point.date,
    nav: (Number(point.close) / initialNiftyValue) * 100,
  }));

  return {
    basketHistory: normalizedBasket,
    niftyHistory: normalizedNifty,
  };
}
