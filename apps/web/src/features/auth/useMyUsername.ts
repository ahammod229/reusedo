import { USE_MOCK } from "@/features/data/source";
import { DEMO_USERNAME } from "@/features/feed/me";
import { useProfile } from "./useProfile";

/** The signed-in person's username ("" while loading). Sample data uses a fixed demo account in local development. */
export function useMyUsername(): string {
  const { data } = useProfile();
  return USE_MOCK ? DEMO_USERNAME : (data?.username ?? "");
}
