import type * as React from "react";
export const Tabs = (
  props: React.ComponentProps<"div"> & { value?: string; onValueChange?: (value: string) => void },
) => <div {...props} />;
export const TabsList = (props: React.ComponentProps<"div">) => <div {...props} />;
export const TabsTrigger = (props: React.ComponentProps<"button"> & { value: string }) => (
  <button {...props} />
);
export const TabsContent = (props: React.ComponentProps<"div"> & { value: string }) => (
  <div {...props} />
);
