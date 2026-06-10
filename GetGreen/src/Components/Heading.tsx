import { StyleSheet, View } from 'react-native'
import React from 'react'
import CustomBox from "@/src/Components/CustomBox";
import CustomText from "@/src/Components/CustomText";
import {theme} from "@/src/theme/theme";


interface HeadingProps {
  heading?: string;
}

const Heading = ({ heading = "Your Recent Spends" }: HeadingProps) => {
  return (
    <View style={styles.container}>
      <CustomBox style={styles.headingBox}>
        <CustomText style={styles.headingText}>{heading}</CustomText>
      </CustomBox>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  headingBox: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  headingText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.sans,
    fontWeight: theme.typography.fontWeight.normal,
  },
});

export default Heading;