import { StyleSheet, View, } from "react-native";
import React, { useState } from "react";
import { GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import { Button } from "@gluestack-ui/themed";
import CustomBox from "@/src/Components/CustomBox";
import CustomText from "@/src/Components/CustomText";
import AsyncStorage from "@react-native-async-storage/async-storage";


const SignUp = ({ navigation }: { navigation: any }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername ] = useState("");


  const navigateToLoginScreen = async () => {

      try {
      const SERVER_BASE_URL = "http://192.168.1.3:8000";
      const response = await fetch(`${SERVER_BASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          'first_name': firstName,
          'last_name': lastName,
          'email': email,
          'phone_number': phoneNumber,
          'password': password,
          'username': username,
        }),
      });
  
      const data = await response.json();
      console.log(data);
      console.log(data["accessToken"]);
      console.log(data["token"]);
      await AsyncStorage.setItem('accessToken', data["accessToken"]);
      await AsyncStorage.setItem('refreshToken', data["token"]);
  
      navigation.navigate('Home', {name: 'Home'});
    } catch (error) {
      console.error('Error during sign up:', error);
    }
  };

  const gotLoginWithoutValiation = () => {
    navigation.navigate('Login', { name: 'Login' });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.signUpContainer}>
        <CustomBox style={signUpBox}>
          <CustomText style={styles.heading} >
            Sign Up
          </CustomText>
          <TextInput placeholder="Username"
            value={username}
            onChangeText={text => setUsername(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />
          <TextInput placeholder="First Name"
            value={firstName}
            onChangeText={text => setFirstName(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />
          <TextInput placeholder="Last Name"
            value={lastName}
            onChangeText={text => setLastName(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />
          <TextInput placeholder="Email"
            value={email}
            onChangeText={text => setEmail(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />
          <TextInput placeholder="Password"
            value={password}
            onChangeText={text => setPassword(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />
          <TextInput placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={text => setPhoneNumber(text)}
            style={styles.textInput}
            placeholderTextColor={'#888'} />


        </CustomBox>
        <Button onPressIn={() => navigateToLoginScreen()} style={styles.button}>
          <CustomBox style={buttonBox}>
            <CustomText style={{ textAlign: 'center' }}>Sign Up</CustomText>
          </CustomBox>
        </Button>
        <Button onPressIn={() => gotLoginWithoutValiation()} style={styles.button}>
          <CustomBox style={buttonBox}>
            <CustomText style={{ textAlign: 'center' }}>Login </CustomText>
          </CustomBox>
        </Button>
      </View>
    </GestureHandlerRootView>

  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf6ef",
  },
  signUpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  button: {
    marginTop: 20,
    width: '30%',
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "#f7fbf8",
    borderColor: "#b7c8bb",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17231c",
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "100%",
  },

});

const signUpBox = {
  mainBox: {
    backgroundColor: "#ffffff",
    borderColor: "#17231c",
    borderRadius: 12,
    borderWidth: 1,
    padding: 22,
  },
  shadowBox: {
    backgroundColor: "#a8cdb1",
    borderRadius: 12,
  },
};
const buttonBox = {
  mainBox: {
    backgroundColor: '#fff',
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,

  },
  shadowBox: {
    backgroundColor: 'gray',
    borderRadius: 10,
  },
};