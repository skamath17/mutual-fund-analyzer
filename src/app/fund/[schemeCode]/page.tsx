// src/app/fund/[schemeCode]/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FundChart from "./FundChart";
import { getApiUrl } from "@/lib/utils/api";
import { Holding } from "@/lib/types/calculations";

const period = "1Y";

async function getFundDetails(schemeCode: string) {
  const response = await fetch(getApiUrl(`/api/funds/${schemeCode}`), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch fund details");
  }
  return response.json();
}

export default async function FundDetail({
  params,
}: {
  params: Promise<{ schemeCode: string }>;
}) {
  const { schemeCode } = await params;
  const fundDetails = await getFundDetails(schemeCode);
  const { basicInfo, navHistory, metrics, holdings } = fundDetails;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{basicInfo.schemeName}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Fund House: {basicInfo.fundHouse}</span>
          <span>•</span>
          <span>Category: {basicInfo.category}</span>
          <span>•</span>
          <span>Risk: {basicInfo.riskLevel}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest NAV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{metrics.latestNav.toFixed(2)}
            </div>
            <p className="text-sm text-green-600">+1.2% (1D)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1Y Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                metrics.returns?.["1Y"]?.absoluteReturn >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.returns?.["1Y"]?.absoluteReturn >= 0 ? "+" : ""}
              {metrics.returns?.["1Y"]?.absoluteReturn.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicInfo.riskLevel}</div>
            <p className="text-sm text-gray-500">
              Sharpe: {metrics.volatility.sharpeRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#5</div>
            <p className="text-sm text-gray-500">of 125 funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Component */}
      <FundChart navHistory={navHistory} />

      {/* Performance & Risk Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Returns Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Returns Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["1M", "3M", "6M", "1Y", "3Y", "5Y"].map((period) => {
                const returnData = metrics.returns?.[period];
                if (!returnData || returnData.insufficientData) {
                  return (
                    <div key={period} className="flex items-center gap-4">
                      <span className="w-16 font-medium">{period}</span>
                      <div className="flex-grow bg-gray-100 rounded-full h-2" />
                      <span className="w-24 text-right font-medium text-gray-400">
                        N/A
                      </span>
                      {period !== "1M" &&
                        period !== "3M" &&
                        period !== "6M" && (
                          <span className="text-sm text-gray-400 w-24 text-right">
                            Insufficient data
                          </span>
                        )}
                    </div>
                  );
                }

                const { absoluteReturn, annualizedReturn } = returnData;
                const isPositive = absoluteReturn >= 0;

                return (
                  <div key={period} className="flex items-center gap-4">
                    <span className="w-16 font-medium">{period}</span>
                    <div className="flex-grow bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          isPositive ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(absoluteReturn), 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`w-24 text-right font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {absoluteReturn.toFixed(2)}%
                    </span>
                    {period !== "1M" && period !== "3M" && period !== "6M" && (
                      <span className="text-sm text-gray-500 w-24 text-right">
                        ({annualizedReturn.toFixed(2)}% ann.)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings?.map((holding: Holding) => (
                <div key={holding.id} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{holding.companyName}</span>
                    <span className="text-sm font-medium">
                      {Number(holding.percentage).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Number(holding.percentage)}%`,
                        }}
                      />
                    </div>
                    {holding.sector && (
                      <span className="text-sm text-gray-500 w-24">
                        {holding.sector}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!holdings || holdings.length === 0) && (
                <p className="text-gray-500">No holdings data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
