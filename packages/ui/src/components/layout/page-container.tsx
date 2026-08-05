import * as React from "react"
import { Link } from "react-router"

import { cn } from "../../lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  breadcrumbs?: { title: string; href?: string }[]
  children: React.ReactNode
}

export function PageContainer({
  title,
  description,
  breadcrumbs,
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("flex flex-col p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6 pb-20 md:pb-8", className)} {...props}>
      {(breadcrumbs || title) && (
        <div className="flex flex-col space-y-2">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={item.href || item.title}>
                      <BreadcrumbItem>
                        {isLast || !item.href ? (
                          <BreadcrumbPage>{item.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.href}>{item.title}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {title && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  )
}
