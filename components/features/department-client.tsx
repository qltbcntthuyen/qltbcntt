"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  HardDrive,
  Plus,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

import { deleteCatalogAction, saveCatalogAction, type EntityInput } from "@/app/actions/mutations";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import type { DepartmentItem } from "@/lib/data";
import { display } from "@/lib/format";

const emptyDepartment: EntityInput = {
  ma: "",
  ten: "",
};

function rowToInput(row: DepartmentItem): EntityInput {
  return {
    id: row.id,
    ma: row.ma_phong_ban ?? "",
    ten: row.ten_phong_ban,
  };
}

export function DepartmentClient({ rows }: { rows: DepartmentItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<EntityInput>(emptyDepartment);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setMessage(null);
    setForm(emptyDepartment);
    setDialogOpen(true);
  }

  function openEdit(row: DepartmentItem) {
    setMessage(null);
    setForm(rowToInput(row));
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result = await saveCatalogAction("phong_ban", form);
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
      const result = await deleteCatalogAction("phong_ban", deleteTarget.id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Tổng phòng ban" value={rows.length} icon={Building2} />
        <SummaryCard
          label="Nhân sự đã gắn phòng ban"
          value={rows.reduce((total, row) => total + row.nhan_su_count, 0)}
          icon={UsersRound}
        />
        <SummaryCard
          label="Thiết bị theo phòng ban"
          value={rows.reduce((total, row) => total + row.thiet_bi_count, 0)}
          icon={HardDrive}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} phòng ban</p>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Thêm phòng ban
        </Button>
      </div>

      {message ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <section className="admin-panel overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Phòng ban</th>
                  <th>Mã</th>
                  <th>Nhân sự</th>
                  <th>Thiết bị</th>
                  <th>Chứng thư số</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-semibold text-slate-950">{row.ten_phong_ban}</td>
                    <td>{display(row.ma_phong_ban)}</td>
                    <td>{row.nhan_su_count}</td>
                    <td>{row.thiet_bi_count}</td>
                    <td>{row.chung_thu_count}</td>
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
              title="Chưa có phòng ban"
              description="Thêm phòng ban để phân công nhân sự, thiết bị và chứng thư số đúng đơn vị quản lý."
            />
          </div>
        )}
      </section>

      <Modal
        open={dialogOpen}
        title={form.id ? "Chỉnh sửa phòng ban" : "Thêm phòng ban"}
        description="Phòng ban dùng để nhóm nhân sự, thiết bị, bàn giao và báo cáo."
        onClose={() => setDialogOpen(false)}
        className="max-w-xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="grid gap-4">
          <Field label="Mã phòng ban">
            <Input value={String(form.ma ?? "")} onChange={(event) => setField("ma", event.target.value)} />
          </Field>
          <Field label="Tên phòng ban" required>
            <Input
              value={String(form.ten ?? "")}
              onChange={(event) => setField("ten", event.target.value)}
              placeholder="Ví dụ: Văn phòng"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu phòng ban"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa phòng ban"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.ten_phong_ban ?? "phòng ban này"}? Thao tác có thể bị từ chối nếu phòng ban đang được sử dụng.`}
        confirmLabel="Xóa phòng ban"
        pending={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteSelected}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="admin-panel flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-2 font-heading text-3xl font-bold text-slate-950">{value}</p>
      </div>
      <span className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-200">
        <Icon className="size-5" />
      </span>
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
