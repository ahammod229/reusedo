import { EmptyState, PageContainer, Skeleton } from "@reusedo/ui";
import { Search } from "lucide-react";

export function Explore() {
  return (
    <PageContainer
      title="Explore"
      description="Discover products and needs from the community."
      breadcrumbs={[{ title: "Home", href: "/" }, { title: "Explore" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <EmptyState
        icon={<Search />}
        title="No results found"
        description="Try adjusting your search filters to find what you're looking for."
      />
    </PageContainer>
  );
}
