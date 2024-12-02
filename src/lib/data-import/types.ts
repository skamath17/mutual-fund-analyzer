// src/lib/data-import/types.ts
export interface MFAPIScheme {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  // ... any other fields from API
}

export interface NAVData {
  date: string;
  nav: string;
}

// src/lib/data-import/fetch-utils.ts
export async function fetchAllSchemes(): Promise<MFAPIScheme[]> {
  try {
    const response = await fetch("https://api.mfapi.in/mf");
    if (!response.ok) {
      throw new Error("Failed to fetch schemes");
    }
    const data = await response.json();
    return data.map((scheme: any) => ({
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
      fundHouse: scheme.fundHouse,
      schemeType: scheme.schemeType,
      schemeCategory: scheme.schemeCategory,
    }));
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
    return response.json();
  } catch (error) {
    console.error(`Error fetching scheme ${schemeCode}:`, error);
    throw error;
  }
}
