"use client";

import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { deletePersonAction, savePersonAction, type EntityInput } from "@/app/actions/mutations";
import { ActiveStatusBadge } from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import type { LookupData, StaffItem } from "@/lib/data";
import { display } from "@/lib/format";

type PersonnelFilters = {
  q?: string;
  phongBan?: string;
  vaiTro?: string;
  trangThai?: string;
};

const emptyPerson: EntityInput = {
  ho_ten: "",
  ten_dang_nhap: "",
  email: "",
  so_dien_thoai: "",
  phong_ban_id: "",
  vai_tro: "user",
  trang_thai: true,
  auth_user_id: "",
};

function rowToInput(row: StaffItem): EntityInput {
  return {
    id: row.id,
    ho_ten: row.ho_ten,
    ten_dang_nhap: row.ten_dang_nhap,
    email: row.email ?? "",
    so_dien_thoai: row.so_dien_thoai ?? "",
    phong_ban_id: row.phong_ban_id ?? "",
    vai_tro: row.vai_tro,
    trang_thai: row.trang_thai,
    auth_user_id: row.auth_user_id ?? "",
  };
}

export function PersonnelClient({
  rows,
  lookups,
  filters,
}: {
  rows: StaffItem[];
  lookups: LookupData;
  filters: PersonnelFilters;
}) {
  const router = useRouter();
  const [filterState, setFilterState] = useState<PersonnelFilters>({
    q: filters.q ?? "",
    phongBan: filters.phongBan ?? "",
    vaiTro: filters.vaiTro ?? "",
    trangThai: filters.trangThai ?? "all",
  });
  const [form, setForm] = useState<EntityInput>(emptyPerson);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(next: PersonnelFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    router.push(`/dashboard/nhan-su${params.size ? `?${params}` : ""}`);
  }

  function setField(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setMessage(null);
    setForm(emptyPerson);
    setDialogOpen(true);
  }

  function openEdit(row: StaffItem) {
    setMessage(null);
    setForm(rowToInput(row));
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result = await savePersonAction(form);
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
      const result = await deletePersonAction(deleteTarget.id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filterState.q ?? ""}
              onChange={(event) => setFilterState((current) => ({ ...current, q: event.target.value }))}
              placeholder="Tìm họ tên, tài khoản, email, điện thoại..."
              className="pl-9"
            />
          </div>
          <Select
            value={filterState.phongBan ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, phongBan: event.target.value }))
            }
          >
            <option value="">Phòng ban</option>
            {lookups.departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten_phong_ban}
              </option>
            ))}
          </Select>
          <Select
            value={filterState.vaiTro ?? ""}
            onChange={(event) => setFilterState((current) => ({ ...current, vaiTro: event.target.value }))}
          >
            <option value="">Vai trò</option>
            <option value="admin">Quản trị</option>
            <option value="it">IT</option>
            <option value="user">Nhân sự</option>
          </Select>
          <Select
            value={filterState.trangThai ?? "all"}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, trangThai: event.target.value }))
            }
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </Select>
          <div className="flex gap-2">
            <Button type="button" onClick={() => applyFilters(filterState)}>
              Áp dụng
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => router.push("/dashboard/nhan-su")}>
              <RotateCcw className="size-4" />
              <span className="sr-only">Đặt lại</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} hồ sơ nhân sự</p>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Thêm nhân sự
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
            <table className="admin-table min-w-[1080px]">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Tên đăng nhập</th>
                  <th>Phòng ban</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Auth user</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-950">{row.ho_ten}</td>
                    <td>{row.ten_dang_nhap}</td>
                    <td>{display(row.phong_ban?.ten_phong_ban)}</td>
                    <td>{display(row.email)}</td>
                    <td>{display(row.so_dien_thoai)}</td>
                    <td>{ROLE_LABELS[row.vai_tro] ?? row.vai_tro}</td>
                    <td>
                      <ActiveStatusBadge active={row.trang_thai} />
                    </td>
                    <td className="max-w-[160px] truncate">{display(row.auth_user_id)}</td>
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
              title="Chưa có hồ sơ nhân sự phù hợp"
              description="Thử đặt lại bộ lọc hoặc thêm hồ sơ nhân sự đầu tiên."
            />
          </div>
        )}
      </section>

      <Modal
        open={dialogOpen}
        title={form.id ? "Chỉnh sửa nhân sự" : "Thêm nhân sự"}
        description="Hồ sơ này dùng để phân công thiết bị và xác định quyền quản trị khi có auth_user_id tương ứng."
        onClose={() => setDialogOpen(false)}
        className="max-w-3xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ tên" required>
            <Input value={String(form.ho_ten ?? "")} onChange={(e) => setField("ho_ten", e.target.value)} />
          </Field>
          <Field label="Tên đăng nhập" required>
            <Input value={String(form.ten_dang_nhap ?? "")} onChange={(e) => setField("ten_dang_nhap", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={String(form.email ?? "")} onChange={(e) => setField("email", e.target.value)} />
          </Field>
          <Field label="Số điện thoại">
            <Input value={String(form.so_dien_thoai ?? "")} onChange={(e) => setField("so_dien_thoai", e.target.value)} />
          </Field>
          <Field label="Phòng ban">
            <Select value={String(form.phong_ban_id ?? "")} onChange={(e) => setField("phong_ban_id", e.target.value)}>
              <option value="">Chưa chọn</option>
              {lookups.departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ten_phong_ban}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vai trò" required>
            <Select value={String(form.vai_tro ?? "user")} onChange={(e) => setField("vai_tro", e.target.value)}>
              <option value="admin">Quản trị</option>
              <option value="it">IT</option>
              <option value="user">Nhân sự</option>
            </Select>
          </Field>
          <Field label="Auth user ID" className="md:col-span-2">
            <Input
              value={String(form.auth_user_id ?? "")}
              onChange={(e) => setField("auth_user_id", e.target.value)}
              placeholder="UUID của tài khoản Supabase Auth, nếu người này được phép đăng nhập"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.trang_thai)}
              onChange={(e) => setField("trang_thai", e.target.checked)}
            />
            Đang hoạt động
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu nhân sự"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa nhân sự"
        description={`Bạn có chắc muốn xóa hồ sơ ${deleteTarget?.ho_ten ?? "này"}? Thao tác có thể bị từ chối nếu hồ sơ đang được dùng trong thiết bị hoặc lịch sử.`}
        confirmLabel="Xóa nhân sự"
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
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
