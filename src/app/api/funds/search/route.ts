// src/app/api/funds/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateAllPeriodReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";
import {
  Prisma,
  MutualFund,
  FundHouse,
  FundCategory,
  NAVHistory,
  Holding,
} from "@prisma/client";

type FundWithRelations = MutualFund & {
  fundHouse: FundHouse;
  category: FundCategory;
  navHistory: NAVHistory[];
  holdings: Holding[];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    console.log("Search query:", query);

    const funds = (await prisma.mutualFund.findMany({
      where: query
        ? {
            OR: [
              {
                schemeName: {
                  contains: query,
                },
              },
              {
                fundHouse: {
                  name: {
                    contains: query,
                  },
                },
              },
            ],
          }
        : {},
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
      take: 20,
    })) as FundWithRelations[];

    const transformedFunds = funds.map((fund) => {
      // Process NAV history
      const navHistory = fund.navHistory.map((nh) => ({
        date: nh.date,
        nav: Number(nh.nav),
      }));

      // Calculate metrics
      const allReturns = calculateAllPeriodReturns(navHistory);
      const volatility = calculateVolatilityMetrics(navHistory);

      return {
        schemeCode: fund.schemeCode,
        basicInfo: {
          schemeName: fund.schemeName,
          fundHouse: fund.fundHouse.name,
          category: fund.category.name,
          riskLevel: fund.category.riskLevel,
        },
        metrics: {
          latestNav: navHistory[0]?.nav || 0,
          returns: allReturns,
          volatility,
        },
        holdings: fund.holdings,
      };
    });

    return NextResponse.json({
      status: "success",
      funds: transformedFunds,
      count: transformedFunds.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
