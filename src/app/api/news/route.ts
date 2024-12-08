import { NextResponse } from "next/server";
import { fetchMutualFundNews } from "@/lib/utils/news-feed";

export async function GET() {
  try {
    const news = await fetchMutualFundNews();

    return NextResponse.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// Add caching to prevent too many requests to Google News
export const revalidate = 3600; // Revalidate every hour
