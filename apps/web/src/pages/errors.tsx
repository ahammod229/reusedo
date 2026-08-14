import { ErrorPageLayout } from "@/shared/components/ui";

export function NotFound() {
  return (
    <ErrorPageLayout
      code={404}
      title="Page not found"
      description="Sorry, we couldn't find the page you're looking for."
    />
  );
}

export function Unauthorized() {
  return (
    <ErrorPageLayout
      code={401}
      title="Unauthorized"
      description="Please log in to access this page."
      actionText="Go to Login"
      actionHref="/login"
    />
  );
}

export function Forbidden() {
  return (
    <ErrorPageLayout
      code={403}
      title="Access Denied"
      description="You don't have permission to view this page."
    />
  );
}

export function ServerError() {
  return (
    <ErrorPageLayout
      code={500}
      title="Server Error"
      description="Something went wrong on our end. Please try again later."
    />
  );
}
