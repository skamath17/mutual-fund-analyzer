// src/app/api/market-trend/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get the latest 252 trading days (1 year) of Nifty data
    const niftyData = await prisma.niftyHistory.findMany({
      orderBy: {
        date: "desc",
      },
      take: 246,
    });

    // Calculate current value and change
    const latestValue = Number(niftyData[0].close);
    const previousValue = Number(niftyData[1].close);
    const changePercentage =
      ((latestValue - previousValue) / previousValue) * 100;

    return NextResponse.json({
      data: niftyData.map((d) => ({
        date: d.date,
        nav: Number(d.close), // Using 'nav' to maintain compatibility with existing component
      })),
      currentValue: latestValue,
      changePercentage: changePercentage,
    });
  } catch (error) {
    console.error("Error in market trend API:", error);
    return NextResponse.json(
      { error: "Failed to fetch market trend data" },
      { status: 500 }
    );
  }
}
