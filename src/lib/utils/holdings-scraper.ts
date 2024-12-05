// src/lib/utils/holdings-scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { Holding } from "@/lib/types/calculations";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "sec-ch-ua":
    '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  Cookie: "", // Sometimes needed
  "Cache-Control": "max-age=0",
};

export async function scrapeHoldings(fundUrl: string) {
  try {
    const response = await axios.get(fundUrl, {
      headers: HEADERS,
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    const html = response.data;
    console.log("Received HTML:", html); // Log the entire HTML to see what we're getting

    const $ = cheerio.load(html);

    // Log what we find with the selector
    console.log("Table exists:", $("#equityTopSummaryTable").length > 0);
    console.log("Rows found:", $("#equityTopSummaryTable tbody tr").length);

    const holdings: Partial<Holding>[] = [];

    $("#equityTopSummaryTable tbody tr").each((i, element) => {
      console.log("Processing row:", i);
      console.log("Row HTML:", $(element).html());

      const companyName = $(element).find("td:first-child a").text().trim();
      const sector = $(element).find("td:nth-child(2)").text().trim();
      const percentageText = $(element).find("td:nth-child(4)").text().trim();

      console.log("Extracted data:", { companyName, sector, percentageText });

      const percentage = parseFloat(percentageText.replace("%", ""));

      if (companyName && !isNaN(percentage)) {
        holdings.push({
          companyName,
          percentage,
          sector: sector || null,
        });
      }
    });

    console.log("Total holdings found:", holdings.length);
    return holdings.slice(0, 10);
  } catch (error) {
    console.error(`Error scraping holdings for URL ${fundUrl}:`, error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response headers:", error.response?.headers);
      console.error("Response data:", error.response?.data);
    }
    return null;
  }
}
