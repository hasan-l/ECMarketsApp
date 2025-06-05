import { appColors } from "@/constants/color";
import * as React from "react";
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  type TouchableHighlightProps,
} from "react-native";

type ButtonProps = Omit<TouchableHighlightProps, "children"> & {
  title: string;
};

export const Button = ({ style, title, ...rest }: ButtonProps) => {
  return (
    <TouchableHighlight
      underlayColor={appColors.buttonUnderlayColor.light}
      {...rest}
      style={[styles.touchable, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  touchable: {
    backgroundColor: appColors.buttonBackgroundColor.light,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 1 },
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 1,
    borderColor: appColors.buttonBorderColor.light,
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  text: {
    fontWeight: "bold",
    color: appColors.text.light,
  },
});
