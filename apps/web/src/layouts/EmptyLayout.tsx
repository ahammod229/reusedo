import { LangToggle } from "@/features/feed/LangToggle";
import { useT } from "@/features/feed/i18n";
import { Footer, Header } from "@/shared/components/ui";
import { Outlet } from "react-router";

export function EmptyLayout() {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        user={null}
        actions={<LangToggle />}
        labels={{ search: t("searchPlaceholder"), login: t("login"), menu: t("menu") }}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer
        labels={{
          rights: t("footerRights"),
          about: t("footerAbout"),
          terms: t("footerTerms"),
          privacy: t("footerPrivacy"),
          contact: t("footerContact"),
          note: t("footerNote"),
        }}
      />
    </div>
  );
}
