import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}

export { Input };

