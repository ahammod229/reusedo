import type * as React from "react"
import { cn } from "../../lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 mb-8 text-center text-sm leading-tight text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
