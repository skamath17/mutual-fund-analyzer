// src/lib/utils/nifty-data.ts
import prisma from "@/lib/prisma";

export async function fetchAndStoreNiftyData() {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1y"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch Nifty data");
    }

    const data = await response.json();
    const timestamps = data.chart.result[0].timestamp;
    const quotes = data.chart.result[0].indicators.quote[0];

    // Store each day's data
    for (let i = 0; i < timestamps.length; i++) {
      const date = new Date(timestamps[i] * 1000);
      await prisma.niftyHistory.upsert({
        where: {
          date: date,
        },
        update: {
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || null,
        },
        create: {
          date: date,
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || null,
        },
      });
    }

    console.log("Nifty data stored successfully");
  } catch (error) {
    console.error("Error storing Nifty data:", error);
    throw error;
  }
}
