// App.js
import StockChartScreen from "@/components/StockChartScreen";
import React from "react";
import { SafeAreaView, StatusBar, View } from "react-native";
import "../global.css";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1">
        <StockChartScreen />
      </View>
    </SafeAreaView>
  );
}
