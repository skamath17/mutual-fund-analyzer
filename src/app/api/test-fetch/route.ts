// src/app/api/test-fetch/route.ts
import { NextResponse } from "next/server";
import {
  fetchAllSchemes,
  fetchSchemeDetails,
} from "@/lib/data-import/fetch-utils";

export async function GET() {
  try {
    console.log("Fetching all schemes...");
    const schemes = await fetchAllSchemes();

    // Get details of just the first scheme
    const schemeDetails = await fetchSchemeDetails(schemes[0].schemeCode);

    return NextResponse.json({
      totalSchemes: schemes.length,
      firstFiveSchemes: schemes.slice(0, 5), // Show first 5 schemes
      firstSchemeDetails: schemeDetails,
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
