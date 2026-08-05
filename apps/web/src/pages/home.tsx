import { PageContainer } from "@reusedo/ui";

export function Home() {
  return (
    <PageContainer title="Welcome to Reusedo" description="The community-driven exchange platform.">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Exchange, Donate, Connect</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join the community to exchange products you no longer need.
        </p>
      </div>
    </PageContainer>
  );
}
