import { Footer, Header } from "@reusedo/ui";
import { Outlet } from "react-router";

const DUMMY_USER = null; // Logged out by default

export function EmptyLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header user={DUMMY_USER} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
