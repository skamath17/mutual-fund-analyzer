// src/lib/data-import/test-fetch.ts
import { fetchAllSchemes, fetchSchemeDetails } from "./fetch-utils";
import { MFAPIScheme } from "./types";

async function testFetch() {
  try {
    console.log("Fetching all schemes...");
    const schemes: MFAPIScheme[] = await fetchAllSchemes();

    console.log("Total schemes found:", schemes.length);
    console.log("Sample scheme:", schemes[0]);

    // Test fetching details for first scheme
    console.log("\nFetching details for first scheme...");
    const schemeDetails = await fetchSchemeDetails(schemes[0].schemeCode);
    console.log("Scheme details:", {
      meta: schemeDetails.meta,
      navDataCount: schemeDetails.data.length,
      latestNAV: schemeDetails.data[0],
    });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testFetch();
