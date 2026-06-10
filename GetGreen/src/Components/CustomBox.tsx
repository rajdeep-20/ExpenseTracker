import React, { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

type BoxStyles = {
  container?: StyleProp<ViewStyle>;
  mainBox?: StyleProp<ViewStyle>;
  shadowBox?: StyleProp<ViewStyle>;
};

type CustomBoxProps = PropsWithChildren<
  ViewProps & {
    style?: BoxStyles;
  }
>;

const CustomBox = ({ style, children, ...props }: CustomBoxProps) => {
  return (
    <View style={[styles.wrapper, style?.container]} {...props}>
      <View style={[styles.shadowContainer, style?.shadowBox]} />
      <View style={[styles.mainContainer, style?.mainBox]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: "100%",
  },
  mainContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#17231c",
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    zIndex: 1,
  },
  shadowContainer: {
    position: "absolute",
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: "#88a892",
    borderRadius: 10,
  },
});

export default CustomBox;
