import { QueryClient } from "@tanstack/react-query";

/** One shared client, so non-component code (sign-up helpers) can refresh cached data too. */
export const queryClient = new QueryClient();
