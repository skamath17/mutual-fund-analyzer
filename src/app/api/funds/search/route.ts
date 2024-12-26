// src/app/api/funds/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    console.log("Search query:", query);

    const funds = await prisma.mutualFund.findMany({
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
      select: {
        schemeCode: true,
        schemeName: true,
        fundHouse: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
            riskLevel: true,
          },
        },
      },
      take: 20,
    });

    // Transform the data to match our expected format
    const transformedFunds = funds.map((fund) => ({
      schemeCode: fund.schemeCode,
      basicInfo: {
        schemeName: fund.schemeName,
        fundHouse: fund.fundHouse.name,
        category: fund.category.name,
        riskLevel: fund.category.riskLevel,
      },
    }));

    return NextResponse.json({
      status: "success",
      funds: transformedFunds,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Failed to search funds",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
