import prisma from "@/lib/prisma";
import { fetchAllSchemes, fetchSchemeDetails } from "./fetch-utils";
import { Prisma } from "@prisma/client";

export async function fetchAndSaveFundData() {
  try {
    // 1. Get all fund houses from our database
    const fundHouses = await prisma.fundHouse.findMany();
    console.log(`Found ${fundHouses.length} fund houses in database`);

    // 2. Get all schemes from API
    const allSchemes = await fetchAllSchemes();
    console.log(`Fetched ${allSchemes.length} total schemes from API`);

    // 3. Filter schemes for our fund houses and process them
    for (const fundHouse of fundHouses) {
      try {
        console.log(`Processing schemes for ${fundHouse.name}`);

        // Filter schemes for this fund house
        const houseSchemes = allSchemes.filter(async (scheme) => {
          const schemeName = scheme.schemeName.toLowerCase();
          const houseName = fundHouse.name
            .toLowerCase()
            .replace(" mutual fund", "");

          // Get scheme details to check category
          const details = await fetchSchemeDetails(scheme.schemeCode);
          const category = details?.meta?.scheme_category?.toLowerCase() || "";

          // Check if it's Equity or Hybrid fund
          const isEquityOrHybrid =
            category.includes("equity") ||
            category.includes("hybrid") ||
            category.includes("balanced") ||
            category.includes("large cap") ||
            category.includes("mid cap") ||
            category.includes("small cap") ||
            category.includes("flexi cap") ||
            category.includes("multi cap");

          return (
            schemeName.includes(houseName) && // Match fund house
            schemeName.includes("direct") && // Only direct plans
            !schemeName.includes("regular") &&
            !schemeName.includes("idcw") && // Skip income distribution schemes
            isEquityOrHybrid
          ); // Only Equity or Hybrid funds
        });

        console.log(
          `Found ${houseSchemes.length} schemes for ${fundHouse.name}`
        );

        // Process each scheme
        for (const scheme of houseSchemes) {
          try {
            console.log(`Processing scheme: ${scheme.schemeName}`);
            const details = await fetchSchemeDetails(scheme.schemeCode);
            if (!details || !details.meta) continue;

            // Save scheme details and NAV data
            await saveSchemeData(details, fundHouse.id);

            // Add delay between requests
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Unknown error";
            console.error(
              `Error processing scheme ${scheme.schemeCode}: ${errorMessage}`
            );
            continue;
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `Error processing fund house ${fundHouse.name}: ${errorMessage}`
        );
        continue;
      }
    }

    return { status: "success" };
  } catch (error) {
    console.error("Error in fetchAndSaveFundData:", error);
    throw error;
  }
}

async function saveSchemeData(schemeDetails: any, fundHouseId: string) {
  const { meta, data: navData } = schemeDetails;

  try {
    // Find matching category
    const category = await prisma.fundCategory.findFirst({
      where: {
        name: meta.scheme_category,
      },
    });

    if (!category) {
      console.log(`Category not found for: ${meta.scheme_category}`);
      return;
    }

    // Determine tax category based on scheme category
    const taxCategoryName = determineTaxCategory(meta.scheme_category);
    const taxCategory = await prisma.taxCategory.findFirst({
      where: {
        name: taxCategoryName,
      },
    });

    if (!taxCategory) {
      console.log(`Tax category not found for: ${taxCategoryName}`);
      return;
    }

    // Define the create data using Prisma's type
    const createData: Prisma.MutualFundCreateInput = {
      schemeCode: meta.scheme_code.toString(),
      schemeName: meta.scheme_name,
      schemeType: meta.scheme_type || "Open Ended",
      fundHouse: { connect: { id: fundHouseId } },
      category: { connect: { id: category.id } },
      taxCategory: { connect: { id: taxCategory.id } }, // Using category.id for now
    };

    // Create or update the mutual fund entry
    const fund = await prisma.mutualFund.upsert({
      where: {
        schemeCode: meta.scheme_code.toString(),
      },
      create: createData,
      update: {
        schemeName: meta.scheme_name,
        schemeType: meta.scheme_type || "Open Ended",
      },
    });

    // Save NAV history
    console.log(`Saving NAV data for ${meta.scheme_name}`);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    for (const nav of navData) {
      const [day, month, year] = nav.date.split("-").map(Number);
      const navDate = new Date(year, month - 1, day);

      // Only save NAV data from last 5 years
      if (navDate >= fiveYearsAgo) {
        try {
          await prisma.nAVHistory.upsert({
            where: {
              fundId_date: {
                // Using the compound unique constraint
                fundId: fund.id,
                date: navDate,
              },
            },
            update: {
              nav: parseFloat(nav.nav),
            },
            create: {
              fundId: fund.id,
              date: navDate,
              nav: parseFloat(nav.nav),
            },
          });
        } catch (err) {
          console.error(
            `Error saving NAV for ${meta.scheme_name} on ${navDate}: ${err}`
          );
        }
      }
    }

    console.log(`Completed processing ${meta.scheme_name}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error saving scheme data: ${errorMessage}`);
    throw err;
  }
}

function determineTaxCategory(schemeCategory: string): string {
  const category = schemeCategory.toLowerCase();

  // Equity taxation (>65% in equity)
  if (
    category.includes("equity") ||
    category.includes("elss") ||
    category.includes("large cap") ||
    category.includes("mid cap") ||
    category.includes("small cap") ||
    category.includes("multi cap") ||
    category.includes("flexi cap")
  ) {
    return "Equity Tax";
  }

  // Hybrid taxation
  if (
    category.includes("hybrid") ||
    category.includes("balanced") ||
    category.includes("aggressive") ||
    category.includes("dynamic")
  ) {
    return "Hybrid Tax";
  }

  // Everything else is treated as Debt
  return "Debt Tax";
}
