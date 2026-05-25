import AsyncStorage from "@react-native-async-storage/async-storage";

class LoginService {
  constructor() {}

  async isLoggedIn() {
    const SERVER_BASE_URL ="http://192.168.1.3:8000";

    console.log("Inside Login service");
    const accessToken = await AsyncStorage.getItem("accessToken");
    console.log("Access token is " + accessToken);
    const response = await fetch(`${SERVER_BASE_URL}/auth/v1/ping`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
        Authorization: `Bearer` + accessToken,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const ResponseBody = await response.text();
    console.log("Response body in isLoggedIn is " + ResponseBody);
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        ResponseBody.trim(),
      );
    return isValidUUID;
  }
}

export default LoginService;
