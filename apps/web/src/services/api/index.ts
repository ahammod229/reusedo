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
  baseURL:
    getEnvVar(
      (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL,
      "VITE_API_URL",
    ) || "http://localhost:8080/api",
  // No fixed Content-Type: axios sends JSON for objects and the right multipart boundary
  // for FormData. A fixed "application/json" made axios turn photo uploads into JSON.
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
