/// <reference types="node" />
import axios, { type AxiosInstance } from "axios";

// This module is a generic Axios wrapper.
// The auth token interceptor will be injected by the auth package or the main app to avoid circular dependencies.

const getEnvVar = (viteKey: unknown, nodeKey?: string): string | undefined => {
  if (typeof viteKey === "string") return viteKey;
  if (typeof process !== "undefined" && process.env) {
    return process.env[nodeKey || ""];
  }
  return undefined;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getEnvVar((import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL, "VITE_API_URL") || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

export const setupAuthInterceptor = (getToken: () => Promise<string | null>) => {
  apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

export * from "axios";
export * from "./services/user.service";
export * from "./services/product.service";
export * from "./services/need.service";
export * from "./services/offer.service";
export * from "./services/exchange.service";
export * from "./services/chat.service";
export * from "./services/notification.service";
export * from "./services/trust.service";
export * from "./services/search.service";
export * from "./services/analytics.service";
export * from "./services/admin.service";
export * from "./services/shipping.service";

