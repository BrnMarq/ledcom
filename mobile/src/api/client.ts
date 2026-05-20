import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const client = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to attach the JWT token
client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("user_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  },
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const method = error.config?.method?.toUpperCase() || "UNKNOWN METHOD";
      const url = error.config?.url || "UNKNOWN URL";
      const status = error.response?.status || "Network Error";
      
      console.error(API_URL);
      console.error(`\n=== API ERROR ===\nEndpoint: ${method} ${url}`);

      Sentry.withScope((scope) => {
        scope.setTag("api_method", method);
        scope.setTag("api_url", url);
        scope.setTag("api_status", status.toString());
        
        if (error.response) {
          console.error(`Status: ${status}`);
          console.error(`Message: ${JSON.stringify(error.response.data)}`);
          scope.setExtra("response_data", error.response.data);
        } else if (error.request) {
          console.error("Status: No response received (Network Error)");
          console.error(
            "Check your EXPO_PUBLIC_API_URL or if the backend is running.",
          );
        } else {
          console.error(`Error Setup: ${error.message}`);
        }
        console.error("=================\n");
        
        Sentry.captureException(error);
      });

      // Return a safe generic error to the UI
      return Promise.reject(
        new Error("Ocurrió un error inesperado al conectar con el servidor."),
      );
    }

    console.error("[App Error]", error);
    Sentry.captureException(error);
    return Promise.reject(new Error("Ocurrió un error inesperado."));
  },
);

export default client;
