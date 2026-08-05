import { EmptyState, PageContainer } from "@reusedo/ui";
import { MessageSquareOff } from "lucide-react";

export function Messages() {
  return (
    <PageContainer
      title="Messages"
      description="Communicate with other users about products and exchanges."
      breadcrumbs={[{ title: "Home", href: "/" }, { title: "Messages" }]}
    >
      <EmptyState
        icon={<MessageSquareOff />}
        title="No Messages"
        description="You don't have any messages yet."
      />
    </PageContainer>
  );
}
