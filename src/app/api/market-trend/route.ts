// src/app/api/market-trend/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all market indexes
    const marketIndexes = await prisma.marketIndex.findMany();

    if (!marketIndexes || marketIndexes.length === 0) {
      throw new Error("No market indexes found");
    }

    // Fetch the latest close value and change percentage for each index
    const indexData = await Promise.all(
      marketIndexes.map(async (index) => {
        const rawData = await prisma.indexHistory.findMany({
          where: {
            indexId: index.id,
          },
          orderBy: {
            date: "desc",
          },
          take: 2, // Fetch the last two records to calculate change percentage
        });

        if (rawData.length < 2) {
          return {
            id: index.id,
            name: index.name,
            value: null,
            change: null,
          };
        }

        const currentValue = Number(rawData[0].close);
        const previousValue = Number(rawData[1].close);
        const changePercentage =
          previousValue !== 0
            ? ((currentValue - previousValue) / previousValue) * 100
            : 0;

        return {
          id: index.id,
          name: index.name,
          value: currentValue.toFixed(2), // Format the value to 2 decimal places
          change: changePercentage.toFixed(2), // Format the percentage
        };
      })
    );

    return NextResponse.json(indexData);
  } catch (error) {
    console.error("Error fetching market trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch market indexes" },
      { status: 500 }
    );
  }
}
