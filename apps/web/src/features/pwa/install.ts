import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Chrome/Edge/Samsung fire this when the site can be installed; it isn't in the DOM typings. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const standalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

/** iPhone/iPad Safari can't prompt: people add it from the Share menu themselves. */
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

interface InstallState {
  deferred: InstallPromptEvent | null;
  installed: boolean;
  /** When the banner was last closed, so it stays away for a while. */
  dismissedAt: number;
  dismiss: () => void;
}

export const useInstallStore = create<InstallState>()(
  persist(
    (set) => ({
      deferred: null,
      installed: false,
      dismissedAt: 0,
      dismiss: () => set({ dismissedAt: Date.now() }),
    }),
    { name: "reusedo-install", partialize: (s) => ({ dismissedAt: s.dismissedAt }) },
  ),
);

// Listen from the first moment: the event fires once, often before React mounts.
if (typeof window !== "undefined") {
  useInstallStore.setState({ installed: standalone() });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstallStore.setState({ deferred: e as InstallPromptEvent });
  });
  window.addEventListener("appinstalled", () =>
    useInstallStore.setState({ deferred: null, installed: true }),
  );
}

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

/**
 * `mode` says how this browser installs: "prompt" (one tap), "ios" (Share → Add to Home Screen),
 * or null when it's already installed or the browser can't do it.
 */
export function useInstall() {
  const { deferred, installed, dismissedAt, dismiss } = useInstallStore();
  const mode = installed ? null : deferred ? "prompt" : isIos() ? "ios" : null;
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    useInstallStore.setState({ deferred: null, installed: outcome === "accepted" });
    return outcome === "accepted";
  };
  return {
    mode,
    install,
    dismiss,
    /** Show the feed banner: installable and not closed in the last two weeks. */
    showBanner: mode !== null && Date.now() - dismissedAt > TWO_WEEKS,
  } as const;
}
