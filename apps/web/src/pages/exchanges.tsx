import { EmptyState, PageContainer } from "@reusedo/ui";
import { Repeat } from "lucide-react";

export function Exchanges() {
  return (
    <PageContainer
      title="Exchanges"
      description="Track your ongoing and completed exchanges."
      breadcrumbs={[{ title: "Home", href: "/" }, { title: "Exchanges" }]}
    >
      <EmptyState
        icon={<Repeat />}
        title="No Exchanges"
        description="You have no active exchanges. Start by proposing an exchange on a product."
      />
    </PageContainer>
  );
}
