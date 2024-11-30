// src/app/api/fund-analytics/route.ts
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";
import { Period } from "@/lib/types/calculations";

// src/app/api/fund-analytics/route.ts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fundId = searchParams.get("fundId");
    const period = (searchParams.get("period") as Period) || "1Y";

    if (!fundId) {
      return NextResponse.json(
        { error: "Fund ID is required" },
        { status: 400 }
      );
    }

    // Get period start date
    const now = new Date();
    const startDate = new Date(now);
    switch (period) {
      case "1M":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "3Y":
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      case "5Y":
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
    }

    // Fetch NAV history only for the requested period
    const navHistory = await prisma.nAVHistory.findMany({
      where: {
        fundId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: "asc" },
    });

    const formattedNavHistory = navHistory.map((nh) => ({
      date: nh.date,
      nav: Number(nh.nav),
    }));

    const returns = calculateDetailedReturns(formattedNavHistory, period);
    const volatility = calculateVolatilityMetrics(formattedNavHistory);

    return NextResponse.json({
      returns,
      volatility,
      history: formattedNavHistory,
    });
  } catch (error) {
    console.error("Error calculating fund analytics:", error);
    return NextResponse.json(
      { error: "Failed to calculate fund analytics" },
      { status: 500 }
    );
  }
}
