// src/lib/utils/nifty-data.ts
import prisma from "@/lib/prisma";

export async function fetchAndStoreNiftyData() {
  try {
    console.log("Fetching Nifty data...");
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=5y"
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch Nifty data: ${response.status} - ${response.statusText}`
      );
      console.error("Response:", await response.text());
      throw new Error("Failed to fetch Nifty data");
    }

    console.log("Parsing response...");
    const data = await response.json();
    const timestamps = data.chart.result[0].timestamp;
    const quotes = data.chart.result[0].indicators.quote[0];

    console.log(`Found ${timestamps.length} days of data`);

    // Store each day's data
    let processedCount = 0;
    for (let i = 0; i < timestamps.length; i++) {
      // Skip if any required value is null
      if (
        !quotes.open[i] ||
        !quotes.high[i] ||
        !quotes.low[i] ||
        !quotes.close[i]
      ) {
        console.log(`Skipping record ${i} due to missing data`);
        continue;
      }

      const date = new Date(timestamps[i] * 1000);

      // Log every 100th record
      if (i % 100 === 0) {
        console.log(`Processing record ${i} out of ${timestamps.length}`);
        console.log("Sample data point:", {
          date,
          open: quotes.open[i],
          close: quotes.close[i],
        });
      }

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
      processedCount++;
    }

    console.log(`Successfully processed ${processedCount} records`);
  } catch (error: any) {
    console.error("Detailed error information:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw error;
  }
}
