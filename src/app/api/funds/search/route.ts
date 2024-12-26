// src/app/api/funds/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const riskLevel = searchParams.get("riskLevel");
    const minReturn = searchParams.get("minReturn");

    console.log("Search params:", { query, category, riskLevel, minReturn }); // Debug log

    // Build where clause
    const where: any = {};

    // Add search conditions
    if (query) {
      where.OR = [
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
      ];
    }

    // Add category filter
    if (category) {
      where.category = {
        name: {
          contains: category,
        },
      };
    }

    // Add risk level filter
    if (riskLevel) {
      where.category = {
        ...where.category,
        riskLevel: riskLevel,
      };
    }

    console.log("Prisma where clause:", where); // Debug log

    const funds = await prisma.mutualFund.findMany({
      where,
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

    console.log(`Found ${funds.length} funds`); // Debug log

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
