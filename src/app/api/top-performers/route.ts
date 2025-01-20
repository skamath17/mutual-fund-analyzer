// src/app/api/top-performers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryType = searchParams.get("type") || "equity"; // Default to equity

    const funds = await prisma.mutualFund.findMany({
      where: {
        category: {
          name: {
            contains: categoryType === "equity" ? "Equity" : "Hybrid",
          },
        },
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

    // Calculate returns for each fund
    const fundReturns = await Promise.all(
      funds.map(async (fund) => {
        const navHistory = fund.navHistory.map((nh) => ({
          date: nh.date,
          nav: Number(nh.nav),
        }));

        const returns = calculateDetailedReturns(navHistory, "1Y");

        return {
          fundId: fund.id,
          fundHouseName: fund.fundHouse.name,
          categoryName: fund.category.name,
          schemeName: fund.schemeName,
          schemeCode: fund.schemeCode,
          returns: returns.absoluteReturn,
        };
      })
    );

    // Sort by returns and get top performer
    const topPerformer = fundReturns.sort((a, b) => b.returns - a.returns)[0];

    return NextResponse.json({
      fundName: `${topPerformer.fundHouseName} - ${topPerformer.categoryName}`,
      schemeName: topPerformer.schemeName,
      schemeCode: topPerformer.schemeCode,
      fundHouse: topPerformer.fundHouseName,
      returns: topPerformer.returns,
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performers" },
      { status: 500 }
    );
  }
}
