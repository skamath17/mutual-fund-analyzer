// src/app/api/insert-holdings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const fundId = "6b6d10c1-09fd-460d-abc4-a84e6f8284ef";

  const holdings = [
    {
      companyName: "Sun Pharmaceutical Industries Ltd.",
      percentage: 14.02,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Cipla Ltd.",
      percentage: 8.17,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Divis Laboratories Ltd.",
      percentage: 7.91,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Lupin Ltd.",
      percentage: 6.25,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Ipca Laboratories Ltd.",
      percentage: 4.08,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Gland Pharma Ltd.",
      percentage: 4.0,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Aurobindo Pharma Ltd.",
      percentage: 3.44,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "PIRAMAL PHARMA LTD",
      percentage: 3.41,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Dr Reddys Laboratories Ltd.",
      percentage: 3.32,
      sector: "Pharmaceuticals",
    },
    {
      companyName: "Eris Lifesciences Ltd",
      percentage: 3.27,
      sector: "Pharmaceuticals",
    },
  ];

  try {
    // First clear existing holdings for this fund
    await prisma.holding.deleteMany({
      where: { fundId },
    });

    // Insert new holdings
    const insertedHoldings = await Promise.all(
      holdings.map((holding) =>
        prisma.holding.create({
          data: {
            fundId,
            companyName: holding.companyName,
            percentage: holding.percentage,
            sector: holding.sector,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Successfully inserted holdings for pharma fund",
      count: insertedHoldings.length,
    });
  } catch (error) {
    console.error("Error inserting holdings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to insert holdings" },
      { status: 500 }
    );
  }
}
