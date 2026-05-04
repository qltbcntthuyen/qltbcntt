import * as React from "react";

import { cn } from "@/lib/utils";

type PanelProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  bodyClassName?: string;
};

function Panel({
  className,
  title,
  description,
  children,
  bodyClassName,
  ...props
}: PanelProps) {
  if (!title && !description) {
    return (
      <div className={cn("admin-panel", className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("admin-panel overflow-hidden", className)} {...props}>
      <PanelHeader>
        {title ? <PanelTitle>{title}</PanelTitle> : null}
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </PanelHeader>
      <PanelBody className={bodyClassName}>{children}</PanelBody>
    </div>
  );
}

function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-border px-4 py-3", className)}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-heading text-base font-semibold text-slate-950", className)}
      {...props}
    />
  );
}

function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export { Panel, PanelBody, PanelHeader, PanelTitle };
