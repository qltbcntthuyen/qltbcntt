"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-white shadow-xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Đóng</span>
          </Button>
        </div>
        <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  pending,
  tone = "danger",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} description={description} onClose={onCancel} className="max-w-md">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Hủy
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "Đang xử lý..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

