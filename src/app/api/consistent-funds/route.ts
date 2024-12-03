import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDetailedReturns } from "@/lib/calculations/returns";
import { calculateVolatilityMetrics } from "@/lib/calculations/volatility";

export async function GET() {
  try {
    const funds = await prisma.mutualFund.findMany({
      include: {
        fundHouse: true,
        category: true,
        navHistory: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0); // Normalize time to 00:00:00

    // Calculate consistency metrics for each fund
    const fundMetrics = await Promise.allSettled(
      funds.map(async (fund) => {
        try {
          const navHistory = fund.navHistory
            .filter((nh) => {
              const navDate = new Date(nh.date); // Convert database date to JS Date
              navDate.setHours(0, 0, 0, 0); // Normalize time to 00:00:00
              return navDate >= oneYearAgo; // Compare normalized dates
            })
            .map((nh) => ({ date: nh.date, nav: Number(nh.nav) }));

          console.log(`Filtered NAV records: ${navHistory.length}`);

          if (navHistory.length < 240) {
            console.warn(`Insufficient NAV data for fund: ${fund.schemeName}`);
            return null;
          }

          const returns = calculateDetailedReturns(navHistory, "1Y");
          const volatility = calculateVolatilityMetrics(navHistory);

          return {
            fundId: fund.id,
            fundHouseName: fund.fundHouse.name,
            categoryName: fund.category.name,
            schemeName: fund.schemeName,
            returns: returns.absoluteReturn,
            sharpeRatio: volatility.sharpeRatio,
            consistency: getConsistencyRating(volatility.sharpeRatio),
          };
        } catch (err) {
          console.error(`Error processing fund ${fund.schemeName}:`, err);
          return null; // Skip this fund
        }
      })
    );

    const validFunds = fundMetrics
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          fundId: string;
          fundHouseName: string;
          categoryName: string;
          schemeName: string;
          returns: number;
          sharpeRatio: number | undefined;
          consistency: string;
        }> => result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    // Sort by Sharpe ratio and get most consistent fund
    const mostConsistent = validFunds
      .filter(
        (fund): fund is typeof fund & { sharpeRatio: number } =>
          fund.sharpeRatio !== undefined
      )
      .sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0];

    if (!mostConsistent) {
      return NextResponse.json({
        schemeName: "N/A",
        fundHouse: "N/A",
        returns: 0,
        consistency: "N/A",
      });
    }

    return NextResponse.json({
      schemeName: mostConsistent.schemeName,
      fundHouse: mostConsistent.fundHouseName,
      returns: mostConsistent.returns,
      consistency: mostConsistent.consistency,
    });
  } catch (error) {
    console.error("Error fetching consistent funds:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch consistent funds",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getConsistencyRating(sharpeRatio: number | undefined): string {
  const ratio = sharpeRatio ?? 0;

  if (ratio > 2) return "Very High";
  if (ratio > 1) return "High";
  if (ratio > 0.5) return "Moderate";
  if (ratio > 0) return "Low";
  return "Very Low";
}
