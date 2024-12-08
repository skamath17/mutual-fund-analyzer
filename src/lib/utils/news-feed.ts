// src/lib/utils/news-feed.ts
import * as xml2js from "xml2js";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function fetchMutualFundNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      "https://news.google.com/rss/search?q=mutual+funds+india&hl=en-IN&gl=IN&ceid=IN:en"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch news");
    }

    const xmlData = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const items = result.rss.channel[0].item;
    return items.map((item: any) => ({
      title: item.title[0],
      link: item.link[0],
      pubDate: item.pubDate[0],
      source: item.source[0]._,
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}
