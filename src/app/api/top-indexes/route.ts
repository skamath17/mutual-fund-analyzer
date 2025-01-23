// src/app/api/top-indexes/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface IndexReturn {
  id: string;
  name: string;
  code: string;
  returns: number;
  period: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let whereClause = {};

    if (type === "equity") {
      whereClause = {
        indexType: "BROAD_BASED",
      };
    } else if (type === "sector") {
      whereClause = {
        indexType: "SECTORAL",
      };
    }

    console.log("Query params:", { type, whereClause });

    const indices = await prisma.marketIndex.findMany({
      where: whereClause,
      include: {
        history: {
          orderBy: {
            date: "desc",
          },
          take: 252,
        },
      },
    });

    console.log(`Found ${indices.length} indices`);

    // Calculate returns for each index with proper type safety
    const indexReturns: IndexReturn[] = indices
      .map((index) => {
        if (!index.history.length) {
          console.log(`No history for index ${index.name}`);
          return null;
        }

        const latestValue = index.history[0]?.close;
        const oldestValue = index.history[index.history.length - 1]?.close;

        console.log(`Processing ${index.name}:`, {
          latest: latestValue?.toString(),
          oldest: oldestValue?.toString(),
        });

        if (!latestValue || !oldestValue) {
          console.log(`Missing values for index ${index.name}`);
          return null;
        }

        const returns =
          ((Number(latestValue) - Number(oldestValue)) / Number(oldestValue)) *
          100;

        return {
          id: index.id,
          name: index.name,
          code: index.code,
          returns: parseFloat(returns.toFixed(2)),
          period: 1,
        };
      })
      .filter((item): item is IndexReturn => item !== null)
      .sort((a, b) => b.returns - a.returns);

    console.log("Calculated returns:", indexReturns);

    const topPerformer = indexReturns[0] || null;

    console.log("Top performer:", topPerformer);

    return NextResponse.json(topPerformer);
  } catch (error) {
    console.error("Error fetching top indexes:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
