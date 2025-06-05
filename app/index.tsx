// App.js
import StockChartScreen from "@/components/StockChartScreen";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { SafeAreaView, StatusBar, View } from "react-native";
import "../global.css";

export default function App() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1">
        <StockChartScreen />
      </View>
    </SafeAreaView>
  );
}
