// src/app/api/market-live/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Define the structure we expect from yahoo-finance2
interface YahooQuoteResponse {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
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
  category: string;
}

export async function GET() {
  try {
    const indexData = [
      { symbol: "^NSEI", name: "NIFTY 50", category: "broad" },
      { symbol: "^NSEBANK", name: "BANK NIFTY", category: "sectoral" },
      { symbol: "^CNXIT", name: "NIFTY IT", category: "sectoral" },
      { symbol: "^CNXAUTO", name: "NIFTY AUTO", category: "sectoral" },
      { symbol: "^CNXPHARMA", name: "NIFTY PHARMA", category: "sectoral" },
      { symbol: "^CNXFMCG", name: "NIFTY FMCG", category: "sectoral" },
      { symbol: "NIFTYMIDCAP150.NS", name: "NIFTY MIDCAP", category: "broad" },
      {
        symbol: "NIFTYSMLCAP250.NS",
        name: "NIFTY SMALLCAP",
        category: "broad",
      },
    ];

    const marketData = await Promise.all(
      indexData.map(async (index): Promise<MarketData> => {
        try {
          // Explicitly type the quote response
          const quoteResponse = await Promise.race([
            yahooFinance.quote(index.symbol),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Timeout fetching ${index.symbol}`)),
                5000
              )
            ),
          ]);

          // Type assertion to use our interface
          const quote = quoteResponse as YahooQuoteResponse;

          // Ensure we have numeric values by providing defaults
          const lastPrice =
            typeof quote.regularMarketPrice === "number"
              ? quote.regularMarketPrice
              : 0;
          const previousClose =
            typeof quote.regularMarketPreviousClose === "number"
              ? quote.regularMarketPreviousClose
              : lastPrice;

          // Calculate the change percentage
          const changePercent =
            previousClose !== 0
              ? ((lastPrice - previousClose) / previousClose) * 100
              : 0;

          // Handle the timestamp conversion safely
          const timestamp =
            typeof quote.regularMarketTime === "number"
              ? quote.regularMarketTime * 1000 // Convert seconds to milliseconds
              : Date.now(); // Use current time as fallback

          return {
            symbol: index.symbol,
            name: index.name,
            lastPrice,
            previousClose,
            change: changePercent.toFixed(2),
            dayHigh:
              typeof quote.regularMarketDayHigh === "number"
                ? quote.regularMarketDayHigh
                : lastPrice,
            dayLow:
              typeof quote.regularMarketDayLow === "number"
                ? quote.regularMarketDayLow
                : lastPrice,
            volume:
              typeof quote.regularMarketVolume === "number"
                ? quote.regularMarketVolume
                : 0,
            marketTime: new Date(timestamp),
            category: index.category,
          };
        } catch (err) {
          console.error(`Error fetching data for ${index.symbol}:`, err);
          // Return a placeholder for failed fetches
          return {
            symbol: index.symbol,
            name: index.name,
            lastPrice: 0,
            previousClose: 0,
            change: "0.00",
            dayHigh: 0,
            dayLow: 0,
            volume: 0,
            marketTime: new Date(),
            category: index.category,
          };
        }
      })
    );

    // Filter out any failed fetches
    const validMarketData = marketData.filter((data) => data.lastPrice > 0);

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
