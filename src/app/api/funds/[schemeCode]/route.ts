import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateAllPeriodReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  try {
    const { schemeCode } = await params;

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
        holdings: {
          orderBy: {
            percentage: "desc",
          },
          take: 10,
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
    const allReturns = calculateAllPeriodReturns(navHistory);
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
        returns: allReturns,
        volatility,
      },
      holdings: fund.holdings,
    });
  } catch (error) {
    console.error("Error fetching fund details:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund details" },
      { status: 500 }
    );
  }
}
