// src/app/api/test-scraper/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scrapeHoldings } from "@/lib/utils/holdings-scraper";

export async function GET() {
  try {
    const fundUrl =
      "https://www.valueresearchonline.com/funds/43512/hdfc-defence-fund-direct-plan/?utm_source=direct-click&utm_medium=vro-funds&utm_content=HDFC+Defence+Fund&utm_campaign=vro-search&utm_term=hdfc+defe#fund-portfolio";

    const holdings = await scrapeHoldings(fundUrl);

    return NextResponse.json({ holdings });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scrape holdings" },
      { status: 500 }
    );
  }
}
