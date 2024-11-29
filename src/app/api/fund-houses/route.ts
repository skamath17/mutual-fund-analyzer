import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const fundHouses = await prisma.fundHouse.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(fundHouses);
  } catch (error) {
    console.error("Error fetching fund houses:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund houses" },
      { status: 500 }
    );
  }
}
