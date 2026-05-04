import * as React from "react";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="label"
      className={cn("text-xs font-semibold text-slate-600", className)}
      {...props}
    />
  );
}

export { Label };

