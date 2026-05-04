import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red" | "slate";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeTone };

