"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { deleteCatalogAction, saveCatalogAction, type EntityInput } from "@/app/actions/mutations";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { CATALOG_OPTIONS, type CatalogKind } from "@/lib/constants";
import type { CatalogRow } from "@/lib/data";
import { display } from "@/lib/format";
import { cn } from "@/lib/utils";

const fieldLabels: Record<
  CatalogKind,
  { name: string; code?: string; extra?: string; note: boolean; placeholder: string }
> = {
  phong_ban: {
    name: "Tên phòng ban",
    code: "Mã phòng ban",
    note: true,
    placeholder: "Ví dụ: Văn phòng",
  },
  loai_thiet_bi: {
    name: "Tên loại thiết bị",
    code: "Mã loại",
    note: true,
    placeholder: "Ví dụ: Máy tính xách tay",
  },
  hang_model: {
    name: "Tên hãng",
    extra: "Model",
    note: true,
    placeholder: "Ví dụ: Dell",
  },
  he_dieu_hanh: {
    name: "Tên hệ điều hành",
    extra: "Phiên bản",
    note: false,
    placeholder: "Ví dụ: Windows",
  },
  phan_mem_diet_virus: {
    name: "Tên phần mềm",
    extra: "Phiên bản",
    note: false,
    placeholder: "Ví dụ: Kaspersky",
  },
  tinh_trang_thiet_bi: {
    name: "Tên tình trạng",
    code: "Mã tình trạng",
    note: true,
    placeholder: "Ví dụ: Đang sử dụng",
  },
  nguon_goc_tai_san: {
    name: "Tên nguồn gốc",
    code: "Mã nguồn gốc",
    note: true,
    placeholder: "Ví dụ: Mua sắm tập trung",
  },
};

const emptyCatalog: EntityInput = {
  ma: "",
  ten: "",
  phu: "",
  ghi_chu: "",
};

function rowToInput(row: CatalogRow): EntityInput {
  return {
    id: row.id,
    ma: row.secondary ?? "",
    ten: row.primary,
    phu: row.secondary ?? "",
    ghi_chu: row.note ?? "",
  };
}

export function CatalogClient({
  kind,
  rows,
}: {
  kind: CatalogKind;
  rows: CatalogRow[];
}) {
  const router = useRouter();
  const selected = useMemo(
    () => CATALOG_OPTIONS.find((option) => option.value === kind) ?? CATALOG_OPTIONS[0],
    [kind]
  );
  const labels = fieldLabels[kind];
  const [form, setForm] = useState<EntityInput>(emptyCatalog);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setMessage(null);
    setForm(emptyCatalog);
    setDialogOpen(true);
  }

  function openEdit(row: CatalogRow) {
    setMessage(null);
    const next = rowToInput(row);
    if (kind === "hang_model" || kind === "he_dieu_hanh" || kind === "phan_mem_diet_virus") {
      next.ma = "";
      next.phu = row.secondary ?? "";
    }
    setForm(next);
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result = await saveCatalogAction(kind, form);
      setMessage(result.message);
      if (result.ok) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function deleteSelected() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCatalogAction(kind, deleteTarget.id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <aside className="admin-panel overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-heading text-base font-semibold text-slate-950">Nhóm danh mục</h2>
          <p className="mt-1 text-sm text-slate-500">Chọn nhóm cần quản lý.</p>
        </div>
        <nav className="p-2">
          {CATALOG_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.value}
                href={`/dashboard/danh-muc?loai=${option.value}`}
                className={cn(
                  buttonVariants({ variant: option.value === kind ? "default" : "ghost", size: "lg" }),
                  "mb-1 h-auto w-full justify-start rounded-md px-3 py-2 text-left"
                )}
              >
                <Icon className="size-4" />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  <span className="block truncate text-xs font-normal opacity-80">{option.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="space-y-4">
        <section className="admin-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-slate-950">{selected.label}</h2>
              <p className="mt-1 text-sm text-slate-600">{selected.description}</p>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              Thêm danh mục
            </Button>
          </div>
        </section>

        {message ? (
          <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        ) : null}

        <section className="admin-panel overflow-hidden">
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[780px]">
                <thead>
                  <tr>
                    <th>{labels.name}</th>
                    <th>{labels.code ?? labels.extra ?? "Thông tin phụ"}</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-950">{row.primary}</td>
                      <td>{display(row.secondary)}</td>
                      <td>{display(row.note)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                            Sửa
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                            <Trash2 className="size-4" />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Chưa có danh mục"
                description="Thêm dữ liệu danh mục để sử dụng trong các màn hình thiết bị và nghiệp vụ."
              />
            </div>
          )}
        </section>
      </main>

      <Modal
        open={dialogOpen}
        title={form.id ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
        description={`Nhóm đang chọn: ${selected.label}.`}
        onClose={() => setDialogOpen(false)}
        className="max-w-xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="grid gap-4">
          {labels.code ? (
            <Field label={labels.code}>
              <Input value={String(form.ma ?? "")} onChange={(e) => setField("ma", e.target.value)} />
            </Field>
          ) : null}
          <Field label={labels.name} required>
            <Input
              value={String(form.ten ?? "")}
              onChange={(e) => setField("ten", e.target.value)}
              placeholder={labels.placeholder}
            />
          </Field>
          {labels.extra ? (
            <Field label={labels.extra}>
              <Input value={String(form.phu ?? "")} onChange={(e) => setField("phu", e.target.value)} />
            </Field>
          ) : null}
          {labels.note ? (
            <Field label="Ghi chú">
              <Textarea value={String(form.ghi_chu ?? "")} onChange={(e) => setField("ghi_chu", e.target.value)} />
            </Field>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu danh mục"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa danh mục"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.primary ?? "danh mục này"}? Thao tác có thể bị từ chối nếu đang được sử dụng.`}
        confirmLabel="Xóa danh mục"
        pending={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteSelected}
      />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
