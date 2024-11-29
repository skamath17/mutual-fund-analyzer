import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fundHouseId = searchParams.get("fundHouseId");
    const categoryId = searchParams.get("categoryId");

    const funds = await prisma.mutualFund.findMany({
      where: {
        ...(fundHouseId && { fundHouseId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        fundHouse: true,
        category: true,
        taxCategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(funds);
  } catch (error) {
    console.error("Error fetching mutual funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch mutual funds" },
      { status: 500 }
    );
  }
}
