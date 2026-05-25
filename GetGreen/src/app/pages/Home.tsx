import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ExpenseTrackerGraph from "@/src/pages/ExpenseTrackerGraph";
import SpendsInsights from "@/src/pages/SpendsInsights";
import Spends from "@/src/pages/Spends";
import Nav from "@/src/pages/Nav";

const Home = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Nav />
        <View style={styles.contentContainer}>
          <View style={styles.graphContainer}>
            <ExpenseTrackerGraph />
          </View>
          <View style={styles.insightsContainer}>
            <SpendsInsights />
          </View>
        </View>
        <View style={styles.spendsContainer}>
          <Spends />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'column',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  graphContainer: {
    flex: 1,
    marginRight: 10,
  },
  insightsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  spendsContainer: {
    marginTop: 20,
  },
  text: {
    color: 'black',
    fontFamily: 'Roboto',
  },
});

export default Home;