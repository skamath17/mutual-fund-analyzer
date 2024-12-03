// src/app/fund/[schemeCode]/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FundChart from "./FundChart";
import { getApiUrl } from "@/lib/utils/api";

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
  params: rawParams,
}: {
  params: { schemeCode: string };
}) {
  const params = await rawParams;
  const fundDetails = await getFundDetails(params.schemeCode);
  const { basicInfo, navHistory, metrics } = fundDetails;

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
                metrics.returns.absoluteReturn >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.returns.absoluteReturn >= 0 ? "+" : ""}
              {metrics.returns.absoluteReturn.toFixed(2)}% ({period})
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
              {/* We'll add returns for different periods here */}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Standard Deviation</span>
                <span className="font-bold">
                  {metrics.volatility.standardDeviation.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sharpe Ratio</span>
                <span className="font-bold">
                  {metrics.volatility.sharpeRatio.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
