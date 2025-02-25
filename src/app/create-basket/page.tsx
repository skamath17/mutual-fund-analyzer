"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundSearch } from "@/components/FundSearch";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasketPerformanceCharts from "@/components/BasketPerformanceChart";
import { SelectedFund } from "@/lib/types/funds";

type Period = "1Y" | "3Y" | "5Y";

interface ChartData {
  date: Date;
  nav: number;
}

interface FundWithAllocation extends SelectedFund {
  allocation: number;
}

interface BasketMetrics {
  returns: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
}

interface ApiResponse {
  status: "success" | "error";
  data?: {
    navHistory: ChartData[];
    niftyHistory: ChartData[];
    missingFunds: Record<Period, string[]>;
  };
  error?: string;
}

export default function CreateBasket() {
  const [selectedFunds, setSelectedFunds] = useState<FundWithAllocation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState<Record<Period, BasketMetrics> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");
  const [basketNavCache, setBasketNavCache] = useState<ChartData[]>([]);
  const [niftyCache, setNiftyCache] = useState<ChartData[]>([]);
  const [missingFunds, setMissingFunds] = useState<Record<Period, string[]>>({
    "1Y": [],
    "3Y": [],
    "5Y": [],
  });
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // percentage, default to 33%
  const containerRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);

  // Mouse handlers for resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    // Add a class to body to show resize cursor everywhere while dragging
    document.body.classList.add("resizing");
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit range to between 20% and 80%
    const limitedWidth = Math.min(Math.max(newWidth, 20), 80);
    setLeftPanelWidth(limitedWidth);
  };

  const handleMouseUp = () => {
    resizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.classList.remove("resizing");
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("resizing");
    };
  }, []);

  const hasSufficientData = (period: Period): boolean => {
    const requiredPoints = {
      "1Y": 240,
      "3Y": 720,
      "5Y": 1200,
    };

    const currentDate = new Date();
    const startDate = new Date(
      currentDate.setFullYear(
        currentDate.getFullYear() - Number(period.replace("Y", ""))
      )
    );

    // Use basketNavCache from component state
    const pointsInPeriod = basketNavCache.filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate;
    }).length;

    console.log(
      `${period} data points:`,
      pointsInPeriod,
      "required:",
      requiredPoints[period]
    );

    return pointsInPeriod >= requiredPoints[period];
  };

  const handleTestBasket = async () => {
    if (selectedFunds.length < 2) return;
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/basket/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funds: selectedFunds.map((fund) => ({
            fundId: fund.schemeCode,
            allocation: fund.allocation,
          })),
          period: "5Y",
        }),
      });

      const data = (await response.json()) as ApiResponse;
      console.log("API Response:", data);
      if (!response.ok)
        throw new Error(data.error || "Failed to analyze basket");

      if (
        data.status !== "success" ||
        !data.data ||
        !data.data.navHistory ||
        !data.data.niftyHistory
      ) {
        throw new Error("Invalid response format: " + JSON.stringify(data));
      }

      setBasketNavCache(data.data.navHistory);
      setNiftyCache(data.data.niftyHistory);
      setMissingFunds(
        data.data.missingFunds || { "1Y": [], "3Y": [], "5Y": [] }
      );
      console.log("Cache Set:", {
        basketNavLength: data.data.navHistory.length,
        niftyNavLength: data.data.niftyHistory.length,
        sampleBasket: data.data.navHistory.slice(0, 3),
      });

      setMetrics({
        "1Y": calculateMetrics(data.data.navHistory, "1Y"),
        "3Y": calculateMetrics(data.data.navHistory, "3Y"),
        "5Y": calculateMetrics(data.data.navHistory, "5Y"),
      });
      setShowResults(true);
    } catch (error) {
      console.error("Error testing basket:", error);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  const calculateMetrics = (
    navHistory: ChartData[],
    period: Period
  ): BasketMetrics => {
    const days = { "1Y": 252, "3Y": 756, "5Y": 1260 }[period];
    const periodData = navHistory.slice(-days);
    if (!periodData || periodData.length < 2) {
      return {
        returns: 0,
        annualizedReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
      };
    }

    const returns =
      ((periodData[periodData.length - 1].nav - periodData[0].nav) /
        periodData[0].nav) *
      100;
    const years = days / 252;
    const annualizedReturn = (Math.pow(1 + returns / 100, 1 / years) - 1) * 100;

    const dailyReturns = periodData
      .slice(1)
      .map((d, i) => (d.nav - periodData[i].nav) / periodData[i].nav);
    const volatility =
      calculateStandardDeviation(dailyReturns) * Math.sqrt(252);
    const sharpeRatio =
      Number.isFinite(volatility) && volatility !== 0
        ? (annualizedReturn - 6) / volatility
        : 0;
    const maxDrawdown = calculateMaxDrawdown(periodData);

    return { returns, annualizedReturn, maxDrawdown, sharpeRatio, volatility };
  };

  const calculateStandardDeviation = (returns: number[]): number => {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (returns.length - 1);
    return Math.sqrt(variance);
  };

  const calculateMaxDrawdown = (data: ChartData[]): number => {
    if (data.length < 2) return 0;
    let maxDrawdown = 0;
    let peak = data[0].nav;
    data.forEach((d) => {
      if (d.nav > peak) peak = d.nav;
      else maxDrawdown = Math.max(maxDrawdown, ((peak - d.nav) / peak) * 100);
    });
    return maxDrawdown;
  };

  const chartData = useMemo(() => {
    const daysMap: Record<Period, number> = {
      "1Y": 252,
      "3Y": 756,
      "5Y": 1260,
    };
    const days = daysMap[selectedPeriod];
    const basketStart = Math.max(0, basketNavCache.length - days);
    const niftyStart = Math.max(0, niftyCache.length - days);
    const basketSlice = basketNavCache.slice(basketStart);
    const niftySlice = niftyCache.slice(niftyStart).slice(0, days);
    console.log("Chart Data:", {
      selectedPeriod,
      basketLength: basketNavCache.length,
      niftyLength: niftyCache.length,
      daysRequested: days,
      basketStart,
      niftyStart,
      basketSliceLength: basketSlice.length,
      niftySliceLength: niftySlice.length,
      sampleBasket: basketSlice.slice(0, 3),
      sampleNifty: niftySlice.slice(0, 3),
    });
    return {
      basketNavHistory: basketSlice,
      niftyHistory:
        niftySlice.length < days
          ? padNiftyData(niftySlice, days, basketSlice)
          : niftySlice,
    };
  }, [basketNavCache, niftyCache, selectedPeriod]);

  function padNiftyData(
    niftySlice: ChartData[],
    targetLength: number,
    basketSlice: ChartData[]
  ): ChartData[] {
    if (niftySlice.length >= targetLength) return niftySlice;
    const padded = [...niftySlice];
    const lastNifty = niftySlice[niftySlice.length - 1] || {
      date: basketSlice[0]?.date || new Date(),
      nav: 0,
    };
    for (let i = niftySlice.length; i < targetLength; i++) {
      const basketDate = basketSlice[i]?.date || new Date();
      padded.push({ date: basketDate, nav: lastNifty.nav });
    }
    return padded;
  }

  const hasInsufficientData = (period: Period) => {
    const days = { "1Y": 252, "3Y": 756, "5Y": 1260 }[period];
    return basketNavCache.length < days / 2;
  };

  // Log cache updates for debugging
  useEffect(() => {
    console.log("Cache Updated:", {
      basketNavLength: basketNavCache.length,
      niftyNavLength: niftyCache.length,
    });
  }, [basketNavCache, niftyCache]);

  const recalculateAllocations = (funds: FundWithAllocation[]) => {
    const totalFunds = funds.length;
    if (totalFunds === 0) return [];

    if (totalFunds <= 5) {
      const equalShare = Math.floor(100 / totalFunds);
      const remainder = 100 - equalShare * totalFunds;
      return funds.map((fund, index) => ({
        ...fund,
        allocation: equalShare + (index === 0 ? remainder : 0),
      }));
    } else {
      const lastFund = funds[funds.length - 1];
      const otherFunds = funds.slice(0, -1);
      const equalShare = Math.floor(80 / otherFunds.length);
      const remainder = 80 - equalShare * otherFunds.length;
      return [
        ...otherFunds.map((fund, index) => ({
          ...fund,
          allocation: equalShare + (index === 0 ? remainder : 0),
        })),
        { ...lastFund, allocation: 20 },
      ];
    }
  };

  const handleSelectFund = (fund: SelectedFund) => {
    if (!selectedFunds.find((f) => f.schemeCode === fund.schemeCode)) {
      const newFunds = [...selectedFunds, { ...fund, allocation: 0 }];
      setSelectedFunds(recalculateAllocations(newFunds));
    }
  };

  const handleRemoveFund = (schemeCode: string) => {
    const newFunds = selectedFunds.filter((f) => f.schemeCode !== schemeCode);
    setSelectedFunds(recalculateAllocations(newFunds));
  };

  // Render the performance analysis panel
  const renderPerformancePanel = () => {
    if (!showResults || !metrics) {
      return (
        <div className="flex flex-col h-full justify-center items-center p-8 text-center">
          <p className="text-gray-500 mb-4">
            Select at least two funds and click &quot;Test Basket
            Performance&quot; to see analysis
          </p>
        </div>
      );
    }

    return (
      <>
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 py-3">
            <CardTitle className="text-base font-medium">
              Basket Performance Analysis
            </CardTitle>
            <Tabs
              value={selectedPeriod}
              onValueChange={(value) => handlePeriodChange(value as Period)}
              className="scale-90 origin-right"
            >
              <TabsList>
                <TabsTrigger value="1Y" className="text-xs">
                  1 Year
                </TabsTrigger>
                <TabsTrigger value="3Y" className="text-xs">
                  3 Years
                </TabsTrigger>
                <TabsTrigger value="5Y" className="text-xs">
                  5 Years
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {hasInsufficientData(selectedPeriod) ||
            missingFunds[selectedPeriod]?.length > 0 ? (
              <p className="text-gray-500">
                Data not available for {selectedPeriod} for one or more funds
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="p-3 bg-gray-50 rounded-lg w-full">
                  <div className="text-sm text-gray-500 text-center">
                    Total Returns
                  </div>
                  <div
                    className={`text-base font-bold text-center ${
                      metrics[selectedPeriod].returns >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics[selectedPeriod].returns >= 0 ? "+" : ""}
                    {metrics[selectedPeriod].returns.toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg w-full">
                  <div className="text-sm text-gray-500 text-center">
                    Annualized Returns
                  </div>
                  <div
                    className={`text-base font-bold text-center ${
                      metrics[selectedPeriod].annualizedReturn >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics[selectedPeriod].annualizedReturn >= 0 ? "+" : ""}
                    {metrics[selectedPeriod].annualizedReturn.toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg w-full">
                  <div className="text-sm text-gray-500 text-center">
                    Maximum Drawdown
                  </div>
                  <div className="text-base font-bold text-red-600 text-center">
                    -{metrics[selectedPeriod].maxDrawdown.toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg w-full">
                  <div className="text-sm text-gray-500 text-center">
                    Volatility
                  </div>
                  <div className="text-base font-bold text-center">
                    {metrics[selectedPeriod].volatility.toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg w-full">
                  <div className="text-sm text-gray-500 text-center">
                    Sharpe Ratio
                  </div>
                  <div className="text-base font-bold text-center">
                    {metrics[selectedPeriod].sharpeRatio.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {chartData.basketNavHistory.length === 0 ||
        !hasSufficientData(selectedPeriod) ? (
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-gray-500">
                Insufficient historical data for {selectedPeriod} period
                analysis
              </div>
            </CardContent>
          </Card>
        ) : (
          <BasketPerformanceCharts
            navHistory={chartData.basketNavHistory}
            niftyHistory={chartData.niftyHistory}
            period={selectedPeriod}
          />
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create Fund Basket</h1>

      {/* Split Panel Layout */}
      <div
        ref={containerRef}
        className="flex flex-col lg:flex-row gap-6 relative"
        style={{ height: "calc(100vh - 150px)" }} // Fixed height for container
      >
        {/* Left Panel - Fund Selection */}
        <div
          className="lg:overflow-auto space-y-6"
          style={{
            width: "100%",
            flex: `0 0 ${leftPanelWidth}%`,
            maxHeight: "100%", // For mobile scrolling
          }}
        >
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base font-medium">
                Select Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FundSearch onSelectFund={handleSelectFund} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base font-medium">
                Selected Funds
              </CardTitle>
              {selectedFunds.length >= 2 && (
                <Button
                  onClick={handleTestBasket}
                  className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1.5"
                  disabled={isLoading}
                >
                  {isLoading ? "Calculating..." : "Test Basket Performance"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedFunds.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Search and select funds to add to your basket
                  </p>
                ) : (
                  selectedFunds.map((fund) => (
                    <div
                      key={fund.schemeCode}
                      className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-grow pr-2">
                        <div className="font-medium text-sm">
                          {fund.schemeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fund.fundHouse.name} • {fund.category.name}
                        </div>
                      </div>
                      <div className="text-sm font-medium mr-3 whitespace-nowrap">
                        {fund.allocation}%
                      </div>
                      <button
                        onClick={() => handleRemoveFund(fund.schemeCode)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        aria-label="Remove fund"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {selectedFunds.length > 0 && selectedFunds.length < 2 && (
                <p className="text-sm text-gray-500 mt-3">
                  Select at least one more fund to create a basket
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resize Handle */}
        <div
          className="hidden lg:block absolute top-0 bottom-0 w-4 bg-transparent cursor-col-resize z-10"
          style={{ left: `calc(${leftPanelWidth}% - 8px)` }}
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-12 bg-gray-300 rounded absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Right Panel - Performance Analysis */}
        <div
          className="lg:overflow-auto space-y-4 flex-1"
          style={{ maxHeight: "100%" }} // For mobile scrolling
        >
          {renderPerformancePanel()}
        </div>
      </div>
    </div>
  );
}
