// src/app/api/market-trend/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const niftyIndex = await prisma.marketIndex.findFirst({
      where: {
        code: "^NSEI",
      },
    });

    if (!niftyIndex) {
      throw new Error("Nifty 50 index not found");
    }

    const rawData = await prisma.indexHistory.findMany({
      where: {
        indexId: niftyIndex.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 30,
    });

    // Convert BigInt to number and format the data
    const data = rawData.map((item) => ({
      ...item,
      volume: item.volume ? Number(item.volume) : null,
      // Also convert Decimal to number if needed
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }));

    const currentValue = data[0]?.close;
    const previousValue = data[1]?.close;
    const changePercentage = previousValue
      ? ((currentValue - previousValue) / previousValue) * 100
      : null;

    return NextResponse.json({
      data,
      currentValue,
      changePercentage,
    });
  } catch (error) {
    console.error("Error fetching market trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch market trend" },
      { status: 500 }
    );
  }
}
