import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";

export async function GET(
  request: NextRequest,
  context: { params: { schemeCode: string } }
): Promise<Response> {
  const { schemeCode } = context.params;

  try {
    const fund = await prisma.mutualFund.findUnique({
      where: {
        schemeCode,
      },
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

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // Process NAV history
    const navHistory = fund.navHistory.map((nh) => ({
      date: nh.date,
      nav: Number(nh.nav),
    }));

    // Calculate metrics
    const returns = calculateDetailedReturns(navHistory, "1Y");
    const volatility = calculateVolatilityMetrics(navHistory);

    return NextResponse.json({
      basicInfo: {
        schemeName: fund.schemeName,
        fundHouse: fund.fundHouse.name,
        category: fund.category.name,
        riskLevel: fund.category.riskLevel,
      },
      navHistory: navHistory,
      metrics: {
        latestNav: navHistory[0]?.nav || 0,
        returns,
        volatility,
      },
    });
  } catch (error) {
    console.error("Error fetching fund details:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund details" },
      { status: 500 }
    );
  }
}
