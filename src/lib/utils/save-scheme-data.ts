// src/lib/utils/save-scheme-data.ts
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

async function findMatchingCategory(schemeCategory: string) {
  // Normalize the category name
  const categoryName = schemeCategory.toLowerCase();

  // Define category mappings
  const categoryMappings = {
    "index fund": "Index Funds",
    "index funds": "Index Funds",
    // Add more mappings as needed
  };

  // First try exact match
  let category = await prisma.fundCategory.findFirst({
    where: {
      name: schemeCategory,
    },
  });

  // If no exact match, try mapped categories
  if (!category) {
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (categoryName.includes(key)) {
        category = await prisma.fundCategory.findFirst({
          where: {
            name: value,
          },
        });
        if (category) break;
      }
    }
  }

  return category;
}

export async function saveSchemeData(schemeDetails: any, fundHouseId: string) {
  const { meta, data: navData } = schemeDetails;

  try {
    // Find matching category
    const category = await findMatchingCategory(meta.scheme_category);

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

    // Define the create data
    const createData: Prisma.MutualFundCreateInput = {
      schemeCode: meta.scheme_code.toString(),
      schemeName: meta.scheme_name,
      schemeType: meta.scheme_type || "Open Ended",
      fundHouse: { connect: { id: fundHouseId } },
      category: { connect: { id: category.id } },
      taxCategory: { connect: { id: taxCategory.id } },
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
    // Get latest NAV date from database
    const latestNAV = await prisma.nAVHistory.findFirst({
      where: { fundId: fund.id },
      orderBy: { date: "desc" },
    });

    // If fund exists, use latest NAV date as start date
    // If fund doesn't exist, use 5 years ago as start date
    const startDate = latestNAV
      ? latestNAV.date
      : (() => {
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
          return fiveYearsAgo;
        })();

    console.log(`Importing NAVs after: ${startDate}`);

    for (const nav of navData) {
      const [day, month, year] = nav.date.split("-").map(Number);
      const navDate = new Date(year, month - 1, day);

      // Only save NAV data from last 5 years
      if (navDate >= startDate) {
        try {
          await prisma.nAVHistory.upsert({
            where: {
              fundId_date: {
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
