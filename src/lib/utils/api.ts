// src/lib/utils/api.ts
export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("API URL not configured");
  }
  return `${baseUrl}${path}`;
}
