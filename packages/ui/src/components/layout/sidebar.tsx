import type * as React from "react"
import { Link, useLocation } from "react-router"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

export interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export interface SidebarProps {
  items: NavItem[]
  className?: string
}

export function Sidebar({ items, className }: SidebarProps) {
  const location = useLocation()

  return (
    <div className={cn("pb-12 w-64 hidden border-r bg-background md:block", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== "/" && location.pathname.startsWith(item.href))
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={item.href}>
                    <span className="mr-2 h-4 w-4 flex items-center justify-center">
                      {item.icon}
                    </span>
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
