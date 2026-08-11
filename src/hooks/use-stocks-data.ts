import { useState, useEffect, useCallback, useRef } from "react";

import originalStocksData from "../data/stocks.json";

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
}

export interface MarketSummary {
  vnIndex: MarketIndex;
  hoseIndex: MarketIndex;
  hnxIndex: MarketIndex;
  upcomIndex: MarketIndex;
}

export interface Stock {
  symbol: string;
  companyName: string;
  sector: string;
  type: "BUY" | "SELL";
  currentPrice: number;
  targetBuyPrice: string;
  targetSellPrice: number;
  stopLossPrice: number;
  riskRewardRatio: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

export interface StocksData {
  lastUpdated: string;
  marketSummary: MarketSummary;
  recommendations: Stock[];
}

export type DataSourceType =
  | "dev-mock"
  | "prod-server"
  | "user-uploaded"
  | "custom-api"
  | "fallback";

const STORAGE_KEYS = {
  USER_DATA: "alpha_pulse_user_data",
  API_URL: "alpha_pulse_api_url",
  SIMULATOR_ACTIVE: "alpha_pulse_simulator_active",
};

export function useStocksData() {
  const isDev = import.meta.env.DEV;

  const [data, setData] = useState<StocksData>(originalStocksData as StocksData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSourceType>(isDev ? "dev-mock" : "prod-server");
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(false);

  const simulatorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load production or user data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. If in development, just use mock/original data directly
    if (isDev) {
      const savedSimulator = localStorage.getItem(STORAGE_KEYS.SIMULATOR_ACTIVE) === "true";
      setIsSimulatorActive(savedSimulator);

      // Let's see if there is any cached mock state so we can preserve simulation changes
      const cachedDevData = localStorage.getItem("alpha_pulse_dev_mock_data");
      if (cachedDevData) {
        try {
          setData(JSON.parse(cachedDevData));
        } catch {
          setData(originalStocksData as StocksData);
        }
      } else {
        setData(originalStocksData as StocksData);
      }

      setSource("dev-mock");
      setLoading(false);
      return;
    }

    // 2. Production build behavior: Prioritize User Uploaded Data
    const savedUserUploaded = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (savedUserUploaded) {
      try {
        const parsed = JSON.parse(savedUserUploaded);
        if (parsed.recommendations && parsed.marketSummary) {
          setData(parsed);
          setSource("user-uploaded");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi đọc dữ liệu của người dùng:", err);
      }
    }

    // 3. Check custom API URL
    const savedApiUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
    if (savedApiUrl) {
      try {
        const response = await fetch(savedApiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const parsed = await response.json();
        if (parsed.recommendations && parsed.marketSummary) {
          setData(parsed);
          setSource("custom-api");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi fetch dữ liệu từ API tùy chỉnh:", err);
        setError("Không thể tải dữ liệu từ API của bạn. Chuyển sang dữ liệu mặc định.");
      }
    }

    // 4. Default: Fetch real data from server's public path
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const response = await fetch(`${baseUrl}data/stocks.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const parsed = await response.json();
      if (parsed.recommendations && parsed.marketSummary) {
        setData(parsed);
        setSource("prod-server");
      } else {
        throw new Error("Dữ liệu không đúng định dạng");
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu từ server:", err);
      setData(originalStocksData as StocksData);
      setSource("fallback");
      setError("Không thể kết nối đến server thực tế. Sử dụng dữ liệu dự phòng.");
    } finally {
      setLoading(false);
    }
  }, [isDev]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // DEV MODE ONLY: Simulator logic
  useEffect(() => {
    if (!isDev) return;

    if (isSimulatorActive) {
      simulatorIntervalRef.current = setInterval(() => {
        setData((prev) => {
          // Fluctuates index values slightly (+/- 0.1% to 0.3%)
          const fluctuate = (val: number) => {
            const pct = (Math.random() * 0.4 - 0.2) / 100; // -0.2% to +0.2%
            return parseFloat((val * (1 + pct)).toFixed(2));
          };

          const updatedSummary = { ...prev.marketSummary };

          Object.keys(updatedSummary).forEach((key) => {
            const indexKey = key as keyof MarketSummary;
            const index = updatedSummary[indexKey];
            const newValue = fluctuate(index.value);
            const delta = parseFloat((newValue - index.value).toFixed(2));
            const newChange = parseFloat((index.change + delta).toFixed(2));
            const newChangePercent = parseFloat(
              ((newChange / (newValue - newChange)) * 100).toFixed(2),
            );

            updatedSummary[indexKey] = {
              ...index,
              value: newValue,
              change: newChange,
              changePercent: newChangePercent,
            };
          });

          // Fluctuates stock prices slightly
          const updatedRecommendations = prev.recommendations.map((stock) => {
            if (Math.random() > 0.4) {
              // 60% chance of price change
              const changePct = (Math.random() * 0.6 - 0.3) / 100; // -0.3% to +0.3%
              const newPrice = parseFloat((stock.currentPrice * (1 + changePct)).toFixed(2));
              return {
                ...stock,
                currentPrice: newPrice,
              };
            }
            return stock;
          });

          const nextData = {
            ...prev,
            marketSummary: updatedSummary,
            recommendations: updatedRecommendations,
          };

          // Save to local state so refresh preserves it
          localStorage.setItem("alpha_pulse_dev_mock_data", JSON.stringify(nextData));
          return nextData;
        });
      }, 5000);
    } else {
      if (simulatorIntervalRef.current) {
        clearInterval(simulatorIntervalRef.current);
      }
    }

    return () => {
      if (simulatorIntervalRef.current) {
        clearInterval(simulatorIntervalRef.current);
      }
    };
  }, [isDev, isSimulatorActive]);

  // Toggle simulator
  const toggleSimulator = useCallback((active: boolean) => {
    setIsSimulatorActive(active);
    localStorage.setItem(STORAGE_KEYS.SIMULATOR_ACTIVE, String(active));
    if (!active) {
      // Clear simulation changes and restore default if stopped
      localStorage.removeItem("alpha_pulse_dev_mock_data");
      setData(originalStocksData as StocksData);
    }
  }, []);

  // DEV MODE ONLY: Add mock stock
  const addMockStock = useCallback(
    (newStock: Stock) => {
      setData((prev) => {
        const nextData = {
          ...prev,
          recommendations: [newStock, ...prev.recommendations],
        };
        if (isDev) {
          localStorage.setItem("alpha_pulse_dev_mock_data", JSON.stringify(nextData));
        }
        return nextData;
      });
    },
    [isDev],
  );

  // PROD MODE: Save custom uploaded data
  const saveUserUploadedData = useCallback((newData: StocksData) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newData));
    setData(newData);
    setSource("user-uploaded");
    setError(null);
  }, []);

  // PROD MODE: Save custom API URL
  const saveCustomApiUrl = useCallback(async (url: string) => {
    localStorage.setItem(STORAGE_KEYS.API_URL, url);
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const parsed = await response.json();
      if (parsed.recommendations && parsed.marketSummary) {
        // Also cache the API response
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(parsed));
        setData(parsed);
        setSource("custom-api");
        setError(null);
        return true;
      } else {
        throw new Error("Dữ liệu từ API không đúng định dạng.");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu từ API này.");
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear preferences
  const clearPreferences = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.API_URL);
    localStorage.removeItem(STORAGE_KEYS.SIMULATOR_ACTIVE);
    localStorage.removeItem("alpha_pulse_dev_mock_data");
    setIsSimulatorActive(false);
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    source,
    isDev,
    isSimulatorActive,
    toggleSimulator,
    addMockStock,
    saveUserUploadedData,
    saveCustomApiUrl,
    clearPreferences,
    refresh: loadData,
  };
}
