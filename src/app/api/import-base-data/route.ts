// src/app/api/import-base-data/route.ts
import { NextResponse } from "next/server";
import { extractAndSaveBaseData } from "@/lib/data-import/extract-base-data";

export async function GET() {
  try {
    const result = await extractAndSaveBaseData();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      {
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
