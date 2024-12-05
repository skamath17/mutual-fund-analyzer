// src/app/api/test-scraper/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scrapeHoldings } from "@/lib/utils/holdings-scraper";

export async function GET() {
  try {
    const fundUrl =
      "https://www.moneycontrol.com/mutual-funds/hdfc-defence-fund-direct-plan-growth/portfolio-overview/MHDA033";

    const holdings = await scrapeHoldings(fundUrl);

    if (!holdings) {
      return NextResponse.json(
        { error: "Failed to extract holdings data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ holdings });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scrape holdings" },
      { status: 500 }
    );
  }
}
