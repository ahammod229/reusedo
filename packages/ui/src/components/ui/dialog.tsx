import type * as React from "react"
export const Dialog = (props: React.ComponentProps<"div"> & { open?: boolean; onOpenChange?: (open: boolean) => void }) => <div {...props} />
export const DialogContent = (props: React.ComponentProps<"div">) => <div {...props} />
export const DialogHeader = (props: React.ComponentProps<"div">) => <div {...props} />
export const DialogFooter = (props: React.ComponentProps<"div">) => <div {...props} />
export const DialogTitle = (props: React.ComponentProps<"h2">) => <h2 {...props} />
export const DialogDescription = (props: React.ComponentProps<"p">) => <p {...props} />
export const DialogTrigger = (props: React.ComponentProps<"button">) => <button {...props} />
