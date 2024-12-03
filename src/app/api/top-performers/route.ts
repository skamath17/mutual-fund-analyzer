// src/app/api/top-performers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";

export async function GET() {
  try {
    const funds = await prisma.mutualFund.findMany({
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
          schemeName: fund.schemeName, // Add this
          returns: returns.absoluteReturn,
        };
      })
    );

    // Sort by returns and get top performer
    const topPerformer = fundReturns.sort((a, b) => b.returns - a.returns)[0];

    return NextResponse.json({
      fundName: `${topPerformer.fundHouseName} - ${topPerformer.categoryName}`,
      schemeName: topPerformer.schemeName, // Include in response
      fundHouse: topPerformer.fundHouseName, // Include fund house separately
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
