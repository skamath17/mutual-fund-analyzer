// src/app/api/market-live/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

interface YahooQuoteResponse {
  regularMarketPrice: number | null;
  regularMarketPreviousClose: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketVolume: number | null;
  regularMarketTime: number | null;
}

interface MarketData {
  symbol: string;
  name: string;
  lastPrice: number;
  previousClose: number;
  change: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketTime: Date;
}

export async function GET() {
  try {
    const symbols = ["^NSEI", "^NSEBANK"];

    const marketData = await Promise.all(
      symbols.map(async (symbol): Promise<MarketData> => {
        // Fetch the quote data
        const quote = await yahooFinance.quote(symbol);

        // Ensure we have numeric values by providing defaults
        const lastPrice = Number(quote.regularMarketPrice) || 0;
        const previousClose =
          Number(quote.regularMarketPreviousClose) || lastPrice;

        // Calculate the change percentage
        const changePercent =
          previousClose !== 0
            ? ((lastPrice - previousClose) / previousClose) * 100
            : 0;

        // Handle the timestamp conversion safely
        const timestamp = quote.regularMarketTime
          ? Number(quote.regularMarketTime) * 1000 // Convert seconds to milliseconds
          : Date.now(); // Use current time as fallback

        return {
          symbol,
          name: symbol === "^NSEI" ? "NIFTY 50" : "BANK NIFTY",
          lastPrice,
          previousClose,
          change: changePercent.toFixed(2),
          dayHigh: Number(quote.regularMarketDayHigh) || lastPrice,
          dayLow: Number(quote.regularMarketDayLow) || lastPrice,
          volume: Number(quote.regularMarketVolume) || 0,
          marketTime: new Date(timestamp),
        };
      })
    );

    // Validate the results
    const validMarketData = marketData.filter(
      (data) => data.lastPrice > 0 && data.previousClose > 0
    );

    if (validMarketData.length === 0) {
      throw new Error("No valid market data received");
    }

    return NextResponse.json(validMarketData);
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
