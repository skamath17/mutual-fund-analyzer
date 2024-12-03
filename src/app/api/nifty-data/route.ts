// src/app/api/nifty-data/route.ts
import { NextResponse } from "next/server";
import { fetchAndStoreNiftyData } from "@/lib/utils/nifty-data";

export async function GET() {
  try {
    await fetchAndStoreNiftyData();
    return NextResponse.json({ message: "Nifty data updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update Nifty data" },
      { status: 500 }
    );
  }
}
