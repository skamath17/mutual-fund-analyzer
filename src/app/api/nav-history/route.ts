import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fundId = searchParams.get("fundId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!fundId) {
      return NextResponse.json(
        { error: "Fund ID is required" },
        { status: 400 }
      );
    }

    const navHistory = await prisma.NAVHistory.findMany({
      where: {
        fundId: fundId,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      },
      include: {
        fund: {
          include: {
            fundHouse: true,
            category: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(navHistory);
  } catch (error) {
    console.error("Error fetching NAV history:", error);
    return NextResponse.json(
      { error: "Failed to fetch NAV history" },
      { status: 500 }
    );
  }
}
