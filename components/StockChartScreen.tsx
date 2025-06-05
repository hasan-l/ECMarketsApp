// import SpaceMono from "@/assets/fonts/SpaceMono-Regular.ttf";
import {
  multiply4,
  scale,
  translate,
  useFont,
} from "@shopify/react-native-skia";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  CartesianChart,
  getTransformComponents,
  Line,
  setScale,
  setTranslate,
  useChartTransformState,
} from "victory-native";
import inter from "../assets/fonts/inter-medium.ttf";

export const PanZoom = () => {};

import { Button } from "@/components/Button";

const API_URL =
  "https://mock.apidog.com/m1/892843-874692-default/marketdata/history/AAPL";

export default function StockChartScreen() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const { state } = useChartTransformState();
  const font = useFont(inter, 12);

  // State for API data
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();

        const apiDataPoints =
          jsonResponse.data && Array.isArray(jsonResponse.data)
            ? jsonResponse.data.reverse() // Assuming newest first, so reverse for chronological
            : [];

        const transformedData = apiDataPoints.map((item: any) => ({
          timestamp: item.timestamp * 1000, // Convert to milliseconds
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

  useAnimatedReaction(
    () => {
      return state.panActive.value || state.zoomActive.value;
    },
    (cv, pv) => {
      if (!cv && pv) {
        const vals = getTransformComponents(state.matrix.value);
        k.value = vals.scaleX;
        tx.value = vals.translateX;
        ty.value = vals.translateY;

        k.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
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
  console.log("stock Chart screen");

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <ActivityIndicator size="large" color="#4F46E5" /> {/* Indigo color */}
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

  if (chartData.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <Text className="text-gray-500 dark:text-gray-400">
          No data available to display the chart.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-800">
      {/* Chart Container */}
      {/* Using h-[400px] for a fixed height as maxHeight with flex:1 can be tricky for the chart's parent */}
      <View className="h-[400px] p-4 md:p-8">
        <CartesianChart
          data={chartData} // Use fetched API data
          xKey="timestamp" // X-axis uses the 'timestamp' field (in milliseconds)
          yKeys={["close"]} // Y-axis plots the 'close' price
          // domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }} // Optional padding

          yAxis={[
            {
              font: font,
              enableRescaling: true,
            },
          ]}
          xAxis={{
            enableRescaling: true,
            font: font,
          }}
          transformState={state}
          onChartBoundsChange={({ top, left, right, bottom }) => {
            setWidth(right - left);
            setHeight(bottom - top);
          }}
        >
          {({ points }) => {
            return (
              <>
                <Line
                  points={points.close}
                  color="red"
                  strokeWidth={3}
                  curveType="natural"
                />
              </>
            );
          }}
        </CartesianChart>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
      >
        <View className="px-5 space-y-3 mt-4">
          {" "}
          {/* Horizontal padding for content, vertical space between button groups */}
          {/* Pan Buttons */}
          <View className="flex-row gap-4">
            {" "}
            {/* Using gap utility for spacing between buttons */}
            <Button
              title={"Pan Left"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  translate(10, 0)
                );
              }}
            />
            <Button
              title={"Pan Right"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  translate(-10, 0, 0)
                );
              }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Button
              title={"Pan Up"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  translate(0, 10)
                );
              }}
            />
            <Button
              title={"Pan Down"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  translate(0, -10)
                );
              }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Button
              title={"Zoom In"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  scale(1.25, 1.25, 1, { x: width / 2, y: height / 2 })
                );
              }}
            />
            <Button
              title={"Zoom Out"}
              style={{ flex: 1 }}
              onPress={() => {
                state.matrix.value = multiply4(
                  state.matrix.value,
                  scale(0.75, 0.75, 1, { x: width / 2, y: height / 2 })
                );
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const DATA = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 30 * Math.random(),
}));

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
  },
});
