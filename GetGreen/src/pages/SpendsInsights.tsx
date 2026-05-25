import { StyleSheet, View } from 'react-native'
import React from 'react'
import CustomText from "@/src/Components/CustomText";



const SpendsInsights = () => {

    const insightData = [
        { id: '1', label: 'Status', value: 'At Risk' },
        { id: '2', label: 'Amount Limit', value: '10000 Rs' },
        { id: '3', label: 'Most Spend Category', value: 'Shopping' },
    ];

    return (
        <View style={styles.spendingStatusContainer}>
            {insightData.map((insight) => (
                <View key={insight.id}>
                    <CustomText style={{}}> {insight.id}. {insight.label} : {insight.value} </CustomText>
                </View>
            ))}
        </View>
    )
}

export default SpendsInsights

const styles = StyleSheet.create({
    spendingStatusContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10
    }
})