// src/lib/data-import/extract-base-data.ts
import { fetchAllSchemes, fetchSchemeDetails } from "./fetch-utils";
import prisma from "@/lib/prisma";

export async function extractAndSaveBaseData() {
  try {
    console.log("Fetching all schemes...");
    const schemes = await fetchAllSchemes();
    console.log(`Found ${schemes.length} total schemes`);

    // Take a larger sample
    const sampleSchemes = schemes.slice(0, 500); // Increased sample size
    const schemeDetails = [];
    const activeSchemeCount = 100; // Increased target

    // Fetch details for each scheme until we get enough active ones
    for (const scheme of sampleSchemes) {
      if (schemeDetails.length >= activeSchemeCount) break;

      try {
        console.log(`Fetching details for scheme ${scheme.schemeCode}`);
        const details = await fetchSchemeDetails(scheme.schemeCode);
        if (details && details.meta && isValidSchemeData(details.meta)) {
          schemeDetails.push(details.meta);
          console.log(
            `Successfully processed scheme: ${details.meta.scheme_name}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between requests
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.log(`Skipping scheme ${scheme.schemeCode}: ${errorMessage}`);
        continue;
      }
    }

    // Clean and filter fund houses and categories
    const uniqueFundHouses = [
      ...new Set(
        schemeDetails
          .map((detail) => cleanFundHouseName(detail.fund_house))
          .filter((house) => isValidFundHouse(house))
      ),
    ];

    const uniqueCategories = [
      ...new Set(
        schemeDetails
          .map((detail) => cleanCategoryName(detail.scheme_category))
          .filter((category) => isValidCategory(category))
      ),
    ];

    console.log(
      `Found ${uniqueFundHouses.length} fund houses and ${uniqueCategories.length} categories`
    );

    // Save fund houses
    for (const houseName of uniqueFundHouses) {
      try {
        const code = generateFundHouseCode(houseName);
        await prisma.fundHouse.upsert({
          where: { name: houseName },
          update: {},
          create: {
            name: houseName,
            code: code,
          },
        });
        console.log(`Saved fund house: ${houseName}`);
      } catch (error) {
        console.error(`Error saving fund house ${houseName}:`, error);
      }
    }

    // Save categories
    for (const categoryName of uniqueCategories) {
      try {
        await prisma.fundCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: {
            name: categoryName,
            code: generateCategoryCode(categoryName),
            riskLevel: determineRiskLevel(categoryName),
          },
        });
        console.log(`Saved category: ${categoryName}`);
      } catch (error) {
        console.error(`Error saving category ${categoryName}:`, error);
      }
    }

    return {
      fundHouses: uniqueFundHouses,
      categories: uniqueCategories,
      processedSchemes: schemeDetails.length,
      totalSchemes: schemes.length,
    };
  } catch (error) {
    console.error("Error in data extraction:", error);
    throw error;
  }
}

// Helper functions for data validation and cleaning
function isValidSchemeData(meta: any): boolean {
  return (
    meta.fund_house &&
    meta.scheme_category &&
    !meta.scheme_category.toLowerCase().includes("formerly known as") &&
    meta.scheme_type
  );
}

function cleanFundHouseName(name: string): string {
  return (
    name.replace("Mutual Fund", "").replace(/\s+/g, " ").trim() + " Mutual Fund"
  );
}

function cleanCategoryName(category: string): string {
  return category
    .replace(/formerly known as.*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidFundHouse(name: string): boolean {
  return Boolean(
    name && name.trim().length > 0 && name.toLowerCase().includes("mutual fund")
  );
}

function isValidCategory(category: string): boolean {
  return Boolean(
    category &&
      category.trim().length > 0 &&
      (category.toLowerCase().includes("scheme") ||
        category.toLowerCase().includes("fund"))
  );
}

function generateFundHouseCode(name: string): string {
  return name
    .replace("Mutual Fund", "")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function generateCategoryCode(category: string): string {
  return category
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function determineRiskLevel(
  category: string
): "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes("liquid") || categoryLower.includes("overnight")) {
    return "VERY_LOW";
  }
  if (categoryLower.includes("debt") || categoryLower.includes("bond")) {
    return "LOW";
  }
  if (categoryLower.includes("hybrid") || categoryLower.includes("balanced")) {
    return "MODERATE";
  }
  if (categoryLower.includes("large cap") || categoryLower.includes("index")) {
    return "HIGH";
  }
  if (
    categoryLower.includes("small cap") ||
    categoryLower.includes("mid cap")
  ) {
    return "VERY_HIGH";
  }

  return "MODERATE"; // Default risk level
}

// Create an API endpoint to test this
// src/app/api/import-base-data/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await extractAndSaveBaseData();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
