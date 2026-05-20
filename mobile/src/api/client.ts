import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";
import { logger } from "../utils/logger";

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
    return Promise.reject(error);
  },
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const method = error.config?.method?.toUpperCase() || "UNKNOWN METHOD";
      const url = error.config?.url || "UNKNOWN URL";
      logger.error(`API_URL configured as ${API_URL}`);

      logger.error(`\n=== API ERROR ===\nEndpoint: ${method} ${url}`);

      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Message: ${JSON.stringify(error.response.data)}`);
        
        Sentry.addBreadcrumb({
          type: "http",
          category: "xhr",
          data: {
            url,
            method,
            status_code: error.response.status,
          }
        });
        
        Sentry.captureException(error, {
          extra: {
            endpoint: `${method} ${url}`,
            status: error.response.status,
            response: error.response.data,
          }
        });
      } else if (error.request) {
        logger.error("Status: No response received (Network Error)");
        logger.error(
          "Check your EXPO_PUBLIC_API_URL or if the backend is running.",
        );
        Sentry.captureException(error, {
          extra: {
            endpoint: `${method} ${url}`,
            networkError: true,
          }
        });
      } else {
        logger.error(`Error Setup: ${error.message}`);
        Sentry.captureException(error, {
          extra: {
            endpoint: `${method} ${url}`,
            setupError: true,
          }
        });
      }
      logger.error("=================\n");

      // Return a safe generic error to the UI
      return Promise.reject(
        new Error("Ocurrió un error inesperado al conectar con el servidor."),
      );
    }

    logger.error("[App Error]", error);
    return Promise.reject(new Error("Ocurrió un error inesperado."));
  },
);

export default client;
