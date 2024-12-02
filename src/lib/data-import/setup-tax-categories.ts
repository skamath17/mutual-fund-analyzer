// src/lib/data-import/setup-tax-categories.ts
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function setupTaxCategories() {
  try {
    const taxCategories = [
      {
        name: "Equity Tax",
        code: "EQUITY_TAX",
        description: "For equity-oriented funds (>65% in equity)",
        holdingPeriod: 12, // months
        taxRate: new Prisma.Decimal(10.0),
        hasIndexation: false,
      },
      {
        name: "Debt Tax",
        code: "DEBT_TAX",
        description: "For debt-oriented funds",
        holdingPeriod: 36, // months
        taxRate: new Prisma.Decimal(20.0),
        hasIndexation: true,
      },
      {
        name: "Hybrid Tax",
        code: "HYBRID_TAX",
        description: "For hybrid funds",
        holdingPeriod: 36, // months
        taxRate: new Prisma.Decimal(20.0),
        hasIndexation: true,
      },
    ];

    for (const category of taxCategories) {
      await prisma.taxCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    console.log("Tax categories setup complete");
    return { status: "success", categoriesCreated: taxCategories.length };
  } catch (error) {
    console.error("Error setting up tax categories:", error);
    throw error;
  }
}
