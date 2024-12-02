// src/app/api/import-fund-data/route.ts
import { NextResponse } from "next/server";
import { fetchAndSaveFundData } from "@/lib/data-import/fetch-fund-data";

export async function GET() {
  try {
    const result = await fetchAndSaveFundData();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Import failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
