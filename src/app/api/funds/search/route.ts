// src/app/api/funds/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const funds = await prisma.mutualFund.findMany({
      where: {
        schemeName: {
          contains: query,
        },
      },
      include: {
        fundHouse: true,
        category: true,
      },
      take: 10, // Limit results
    });

    return NextResponse.json(funds);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search funds" },
      { status: 500 }
    );
  }
}
