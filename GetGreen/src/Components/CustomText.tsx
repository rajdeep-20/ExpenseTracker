import React, { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

type CustomTextProps = PropsWithChildren<
  TextProps & {
    style?: StyleProp<TextStyle>;
  }
>;

const CustomText = ({ style, children, ...props }: CustomTextProps) => {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#17231c",
    fontFamily: "Helvetica",
  },
});

export default CustomText;
