import { useFont } from "@shopify/react-native-skia";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import {
  CartesianChart,
  getTransformComponents,
  Line,
  setScale,
  setTranslate,
  useChartTransformState,
} from "victory-native";
import inter from "../assets/fonts/inter-medium.ttf";

const LINE_COLORS = {
  open: "#3B82F6", // blue-500
  high: "#F43F5E", // rose-500 (Pinkish)
  low: "#06B6D4", // cyan-500 (Teal/Aqua)
  close: "#6366F1", // indigo-500 (Purple)
};

const CheckboxItem = ({ label, value, onValueChange, activeColor }) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    className="flex-row items-center py-1.5"
    activeOpacity={0.7}
  >
    <View
      className={`w-5 h-5 border-2 rounded-sm mr-3 flex items-center justify-center ${
        value
          ? "border-transparent"
          : "border-neutral-500 dark:border-neutral-600"
      }`}
      style={value ? { backgroundColor: activeColor || LINE_COLORS.open } : {}}
    >
      {value && <Text className="text-white text-xs font-bold">✓</Text>}
    </View>
    <Text className="text-neutral-700 dark:text-neutral-300 text-sm">
      {label}
    </Text>
  </TouchableOpacity>
);

const SeriesToggleComponent = ({
  seriesVisibility,
  onToggleSeries,
  lineColors,
}) => {
  const seriesOrder = ["open", "close", "low", "high"]; // Order from mockup
  return (
    <View className="space-y-1">
      {seriesOrder.map((key) => (
        <CheckboxItem
          key={key}
          label={key.charAt(0).toUpperCase() + key.slice(1)}
          value={seriesVisibility[key]}
          onValueChange={() => onToggleSeries(key)}
          activeColor={lineColors[key]}
        />
      ))}
    </View>
  );
};
const API_URL =
  "https://mock.apidog.com/m1/892843-874692-default/marketdata/history/AAPL";

export default function StockChartScreen() {
  const { state } = useChartTransformState();
  const font = useFont(inter, 12);

  const [chartData, setChartData] = useState<
    Array<{
      timestamp: number;
      close: number;
      high: number;
      low: number;
      open: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const [seriesVisibility, setSeriesVisibility] = useState({
    open: true,
    close: true,
    low: false,
    high: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const jsonResponse = await response.json();
        const apiDataPoints =
          jsonResponse.data && Array.isArray(jsonResponse.data)
            ? jsonResponse.data.reverse()
            : [];
        const transformedData = apiDataPoints.map((item: any) => ({
          timestamp: item.timestamp * 1000,
          close: parseFloat(item.close),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          open: parseFloat(item.open),
        }));

        setChartData(transformedData);
      } catch (e: any) {
        console.error("Failed to fetch chart data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initialChartDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return undefined;
    }

    const numPointsToShow = 4;
    const displayData = chartData.slice(
      Math.max(0, chartData.length - numPointsToShow)
    );

    if (displayData.length === 0) {
      const xValuesAll = chartData.map((p) => p.timestamp);
      const yMinAll = Math.min(...chartData.map((p) => p.low)); // Use low for min
      const yMaxAll = Math.max(...chartData.map((p) => p.high)); // Use high for max
      if (xValuesAll.length === 0) return undefined;

      const xMinAllTs = Math.min(...xValuesAll);
      const xMaxAllTs = Math.max(...xValuesAll);
      const yRangeAllRaw = yMaxAll - yMinAll || 1;
      const yPaddingAll = yRangeAllRaw * 0.1;
      return {
        x: [xMinAllTs, xMaxAllTs] as [number, number],
        y: [Math.max(0, yMinAll - yPaddingAll), yMaxAll + yPaddingAll] as [
          number,
          number
        ],
      };
    }

    const xValues = displayData.map((p) => p.timestamp);

    const yMinDisplayRaw = Math.min(...displayData.map((p) => p.low));
    const yMaxDisplayRaw = Math.max(...displayData.map((p) => p.high));

    const xMinDisplay = Math.min(...xValues);
    const xMaxDisplay = Math.max(...xValues);

    const yRangeDisplayRaw = yMaxDisplayRaw - yMinDisplayRaw || 1;
    const yPaddingDisplay = yRangeDisplayRaw * 0.1;

    return {
      x: [xMinDisplay, xMaxDisplay] as [number, number],
      y: [
        Math.max(0, yMinDisplayRaw - yPaddingDisplay),
        yMaxDisplayRaw + yPaddingDisplay,
      ] as [number, number],
    };
  }, [chartData]);

  // Reaction 1: After a gesture ends, update shared values k, tx, ty from the chart's matrix.
  // This allows other UI (like buttons if they were to read k, tx, ty) to know the current state.
  useAnimatedReaction(
    () => state.panActive.value || state.zoomActive.value,
    (cv, pv) => {
      if (!cv && pv) {
        // Preserve current transform values (no snapping back)
        const vals = getTransformComponents(state.matrix.value);
        k.value = vals.scaleX;
        tx.value = vals.translateX;
        ty.value = vals.translateY;
      }
    }
  );

  useAnimatedReaction(
    () => {
      return { k: k.value, tx: tx.value, ty: ty.value };
    },
    ({ k, tx, ty }) => {
      const m = setTranslate(state.matrix.value, tx, ty);
      state.matrix.value = setScale(m, k);
    }
  );

  const handleResetZoom = () => {
    // Reset shared values to their defaults.
    // This will trigger the second useAnimatedReaction to reconstruct the matrix
    // to an identity-like transform, making the chart show its initial `domain`.
    k.value = 1;
    tx.value = 0;
    ty.value = 0;
  };

  const toggleSeriesVisibility = (seriesKey: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          Loading chart data...
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-red-50 dark:bg-red-900 p-4">
        <Text className="text-red-700 dark:text-red-300 text-lg font-semibold">
          Error Loading Data
        </Text>
        <Text className="mt-1 text-red-600 dark:text-red-400 text-center">
          {error}
        </Text>
      </View>
    );
  }
  if (chartData.length === 0 && !loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <Text className="text-gray-500 dark:text-gray-400">
          No data available to display the chart.
        </Text>
      </View>
    );
  }

  // Prepare yKeys for CartesianChart based on visibility state
  const activeYKeys = Object.entries(seriesVisibility)
    .filter(([key, value]) => value)
    .map(([key]) => key);

  // Legend items based on mockup order (Open, High, Low, Close)
  const legendItems = [
    { key: "open", label: "Open", color: LINE_COLORS.open },
    { key: "high", label: "High", color: LINE_COLORS.high },
    { key: "low", label: "Low", color: LINE_COLORS.low },
    { key: "close", label: "Close", color: LINE_COLORS.close },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-center py-5 space-x-3">
        <Text className="text-black text-2xl font-bold">AAPL Market Data</Text>
      </View>

      {/* Chart Card */}
      <View className="bg-neutral-200 rounded-xl shadow-lg mx-4 my-2 p-4">
        {/* Legend */}
        <View className="flex-row justify-around items-center mb-3 px-2">
          {legendItems.map((item) => (
            <View key={item.key} className="flex-row items-center space-x-1.5">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-neutral-400 text-xs">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View className="h-[300px]">
          <CartesianChart
            data={chartData}
            domain={initialChartDomain}
            xKey="timestamp"
            yKeys={activeYKeys.length > 0 ? [...activeYKeys] : ["close"]}
            yAxis={[
              {
                font: font,
                enableRescaling: true,
                formatYLabel: (value) => `$${Number(value).toFixed(0)}`,
                tickCount: 5,
                lineColor: "rgba(156, 163, 175, 0.2)",
                labelColor: "rgb(156, 163, 175)",
                gridLineColor: "rgba(156, 163, 175, 0.2)",
                gridStrokeDasharray: "4, 4",
              },
            ]}
            xAxis={{
              font: font,
              enableRescaling: true,
              formatXLabel: (value) => {
                // MM/DD/YY format
                const date = new Date(Number(value));
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = String(date.getFullYear()).slice(-2);
                return `${month}/${day}/${year}`;
              },
              tickCount: 4,
              lineColor: "rgba(156, 163, 175, 0.2)",
              labelColor: "rgb(156, 163, 175)",
            }}
            transformState={state}
          >
            {({ points }) => (
              <>
                {seriesVisibility.open && points.open && (
                  <Line
                    points={points.open}
                    color={LINE_COLORS.open}
                    strokeWidth={2}
                    curveType="natural"
                  />
                )}
                {seriesVisibility.high && points.high && (
                  <Line
                    points={points.high}
                    color={LINE_COLORS.high}
                    strokeWidth={2}
                    curveType="natural"
                  />
                )}
                {seriesVisibility.low && points.low && (
                  <Line
                    points={points.low}
                    color={LINE_COLORS.low}
                    strokeWidth={2}
                    curveType="natural"
                  />
                )}
                {seriesVisibility.close && points.close && (
                  <Line
                    points={points.close}
                    color={LINE_COLORS.close}
                    strokeWidth={2}
                    curveType="natural"
                  />
                )}
              </>
            )}
          </CartesianChart>
        </View>
      </View>

      {/* Controls Section */}
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="px-6 mt-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-black font-semibold text-lg">Display</Text>
            <TouchableOpacity
              onPress={handleResetZoom}
              className="bg-neutral-700 py-1.5 px-4 rounded-md"
            >
              <Text className="text-white text-xs font-semibold">
                Reset Zoom
              </Text>
            </TouchableOpacity>
          </View>
          <SeriesToggleComponent
            seriesVisibility={seriesVisibility}
            onToggleSeries={toggleSeriesVisibility}
            lineColors={LINE_COLORS}
          />
        </View>
      </ScrollView>
    </View>
  );
}
