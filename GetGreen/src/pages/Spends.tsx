import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import CustomBox from '@/src/Components/CustomBox'
import CustomText from '@/src/Components/CustomText'
import Expense from "@/src/Components/Expense";
import Heading from '@/src/Components/Heading'
import {ExpenseDto} from "@/src/pages/dto/ExpenseDto";

const Spends = () => {

    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [isLoading, setIsLoadind] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, []);


    const fetchExpenses = async () => {
        try {
            const SERVER_BASE_URL = "http://192.168.1.3:8000";
            const accessToken = await AsyncStorage.getItem('accessToken');


            if (!accessToken) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${SERVER_BASE_URL}//expense/v1/getExpense`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log('Token is:', accessToken);

            if (!response.ok) {
                throw new Error(`Failed to fetch expenses. Status: ${response.status}`);
            }


            const data = await response.json();
            console.log('Expense fetched:', data);

            const transformedExpense: ExpenseDto[] = data.map((expenses: any, index: number) => ({

                key: index + 1,
                amount: expenses['amount'],
                merchant: expenses['merchant'],
                currency: expenses['currency'],
                createdAt: new Date(expenses['createdAt']),
            }));
            console.log("Transformed expenses:", transformedExpense);
            
            setExpenses(transformedExpense);
            setIsLoadind(false);
            setError(null);
        }
        catch(err)
        {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error fetching expenses:', err);
            setIsLoadind(false);
        }
    };



    if(isLoading)
    {
        return (
            <View>
                <Heading heading="Spends" />
                <CustomBox style={headingBox}>
                    <CustomText style={{}}> Loading Expense ...... </CustomText>
                </CustomBox>
            </View>
        );
    }
    
    if (error)
    {
        return (
            <View>
                <Heading heading="Spends" />
                <CustomBox style={headingBox}>
                    <CustomText style={{}}> Error : {error} </CustomText>
                </CustomBox>
            </View>
        );

    }


    return (
        <View>
            <Heading heading="Spends" />
            <CustomBox style={headingBox}>
                <View style={styles.expenses}>
                    {expenses.map(expenses => (<Expense key = {expenses.key} props={expenses} />
                ))}
                </View>
            </CustomBox>
        </View>
    );
};

export default Spends

const styles = StyleSheet.create({
    expenses: {
        marginTop: 20,
    },

});


const headingBox = {
    mainBox: {
        Background: 'white',
        borderColor: 'black',
    },
    ShadowBox: {
        Background: 'grey',
    },
    styles: {
        marginTop: 20,
    },
};
