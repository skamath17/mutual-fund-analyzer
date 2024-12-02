// src/app/api/setup-tax-categories/route.ts
import { NextResponse } from "next/server";
import { setupTaxCategories } from "@/lib/data-import/setup-tax-categories";

export async function GET() {
  try {
    const result = await setupTaxCategories();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Setup failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
