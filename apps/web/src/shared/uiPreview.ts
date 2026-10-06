/**
 * Dev-only switch for reviewing screens without Firebase or a backend:
 *   VITE_UI_PREVIEW=true pnpm --filter web dev
 * Route guards let everyone through and Firebase gets a placeholder key.
 * `import.meta.env.DEV` is false in production builds, so this can never be on there.
 */
export const UI_PREVIEW = import.meta.env.DEV && import.meta.env.VITE_UI_PREVIEW === "true";
