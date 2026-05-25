import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from "@/src/pages/Home";
import Profile from "@/src/pages/Profile";
import Spends from "@/src/pages/Spends";
import Login from "@/src/pages/Login";
import SignUp from "@/src/pages/SignUp";

export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    Home: undefined;
    Profile: undefined;
    Spends: undefined;
}


const Stack = createNativeStackNavigator<RootStackParamList>();


const AppNavigator = () => {
    return (
            <Stack.Navigator initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen
                    name="Profile"
                    component={Profile}
                    options={{
                        headerShown: true,
                        headerTitle: 'Profile',
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: 'transparent',
                        },
                    }} />
                    <Stack.Screen name = "Spends" component={Spends} />
            </Stack.Navigator>
    );
};

export default AppNavigator;