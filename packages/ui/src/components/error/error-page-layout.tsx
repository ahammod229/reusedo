import { Link } from "react-router"
import { Home } from "lucide-react"
import { Button } from "../ui/button"

export interface ErrorPageLayoutProps {
  code: string | number
  title: string
  description: string
  actionText?: string
  actionHref?: string
}

export function ErrorPageLayout({
  code,
  title,
  description,
  actionText = "Back to Home",
  actionHref = "/",
}: ErrorPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-6">
        <h1 className="text-9xl font-extrabold tracking-tighter text-muted">
          {code}
        </h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[500px]">
            {description}
          </p>
        </div>
        <div className="flex justify-center pt-6">
          <Button asChild size="lg">
            <Link to={actionHref}>
              <Home className="mr-2 h-4 w-4" />
              {actionText}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
