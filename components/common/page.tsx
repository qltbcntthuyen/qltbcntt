import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CERTIFICATE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statToneClasses: Record<BadgeTone, string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-normal text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: BadgeTone;
}) {
  return (
    <div className="admin-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md ring-1",
            statToneClasses[tone]
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function CertificateStatusBadge({ status }: { status?: string | null }) {
  const tone: BadgeTone =
    status === "dang_hieu_luc"
      ? "green"
      : status === "sap_het_han"
        ? "amber"
        : status === "da_gia_han" || status === "da_thay_the" || status === "da_thu_hoi"
          ? "slate"
          : status === "het_han" || status === "can_cap_moi" || status === "can_thu_hoi"
            ? "red"
            : status
              ? "red"
              : "neutral";

  return (
    <Badge tone={tone}>
      {status ? CERTIFICATE_STATUS_LABELS[status] ?? status : "Không có"}
    </Badge>
  );
}

export function ActiveStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "green" : "slate"}>
      {active ? "Đang hoạt động" : "Ngừng hoạt động"}
    </Badge>
  );
}

export function DeviceConditionBadge({ label }: { label?: string | null }) {
  const normalized = (label ?? "").toLowerCase();
  const tone: BadgeTone = normalized.includes("hỏng")
    ? "red"
    : normalized.includes("kho")
      ? "amber"
      : normalized.includes("mất")
        ? "red"
        : label
          ? "green"
          : "neutral";
  return <Badge tone={tone}>{label ?? "Chưa cập nhật"}</Badge>;
}

export function TextLinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
      {children}
    </Link>
  );
}

export function TableActionButton({
  children,
  onClick,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "neutral" | "danger";
}) {
  return (
    <Button
      type="button"
      variant={tone === "danger" ? "destructive" : "outline"}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
