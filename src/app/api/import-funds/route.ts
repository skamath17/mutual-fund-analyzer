// src/app/api/import-funds/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveSchemeData } from "@/lib/utils/save-scheme-data";
import {
  fetchAllSchemes,
  fetchSchemeDetails,
} from "@/lib/data-import/fetch-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundHouseId, categoryId } = body;

    // Get fund house details
    const fundHouse = await prisma.fundHouse.findUnique({
      where: { id: fundHouseId },
    });

    if (!fundHouse) {
      return NextResponse.json(
        { error: "Fund house not found" },
        { status: 404 }
      );
    }

    // Fetch all schemes from API
    const allSchemes = await fetchAllSchemes();
    console.log(`Fetched ${allSchemes.length} total schemes from API`);

    // Filter schemes for selected fund house
    const houseName = fundHouse.name.toLowerCase().replace(" mutual fund", "");
    const filteredSchemes = allSchemes.filter((scheme) => {
      const schemeName = scheme.schemeName.toLowerCase();
      const matchesHouse = schemeName.includes(houseName);
      const isDirectGrowth =
        schemeName.includes("direct") &&
        schemeName.includes("growth") &&
        !schemeName.includes("regular") &&
        !schemeName.includes("idcw");

      return matchesHouse && isDirectGrowth;
    });

    console.log(`Found ${filteredSchemes.length} matching schemes`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    // Process each scheme
    for (const scheme of filteredSchemes) {
      try {
        const details = await fetchSchemeDetails(scheme.schemeCode);

        if (!details || !details.meta) {
          console.log(`Skipping inactive scheme: ${scheme.schemeCode}`);
          skipped++;
          continue;
        }

        // If category is specified, check if scheme matches
        if (categoryId) {
          const category = await prisma.fundCategory.findUnique({
            where: { id: categoryId },
          });
          if (category && details.meta.scheme_category !== category.name) {
            skipped++;
            continue;
          }
        }

        // Save scheme data
        await saveSchemeData(details, fundHouseId);
        processed++;

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing scheme ${scheme.schemeName}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: `Import completed. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`,
      stats: { processed, skipped, errors },
    });
  } catch (error) {
    console.error("Error in import:", error);
    return NextResponse.json(
      { error: "Failed to import funds" },
      { status: 500 }
    );
  }
}
