// src/lib/data-import/fetch-utils.ts
import { MFAPIScheme } from "./types";

export async function fetchAllSchemes(): Promise<MFAPIScheme[]> {
  try {
    console.log("Starting to fetch schemes...");
    const response = await fetch("https://api.mfapi.in/mf");
    if (!response.ok) {
      throw new Error("Failed to fetch schemes");
    }
    const data = await response.json();

    // Look at the raw data structure
    console.log("First item from API:", JSON.stringify(data[0], null, 2));

    // Now we can see the exact structure and property names
    const mappedData = data.map((scheme: any) => ({
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
      fundHouse: scheme.fundHouse,
      schemeType: scheme.schemeType,
      schemeCategory: scheme.schemeCategory,
    }));

    console.log("First mapped item:", mappedData[0]);
    return mappedData;
  } catch (error) {
    console.error("Error fetching schemes:", error);
    throw error;
  }
}

export async function fetchSchemeDetails(schemeCode: number) {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch scheme ${schemeCode}`);
    }
    const data = await response.json();

    // Check if scheme has recent NAV data
    if (data.data && data.data.length > 0) {
      const latestNAV = data.data[0];
      const latestDate = new Date(
        latestNAV.date.split("-").reverse().join("-")
      );
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (latestDate >= threeMonthsAgo) {
        return data;
      }
    }
    throw new Error("Scheme appears to be inactive");
  } catch (error) {
    //console.error(`Error fetching scheme ${schemeCode}:`, error);
    return null;
  }
}
