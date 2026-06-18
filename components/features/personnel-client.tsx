"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { deletePersonAction, savePersonAction, type EntityInput } from "@/app/actions/mutations";
import {
  ActiveStatusBadge,
  CertificateStatusBadge,
  DeviceConditionBadge,
  TextLinkButton,
} from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import type { LookupData, StaffItem } from "@/lib/data";
import { display, formatDate } from "@/lib/format";
import { runTransitionAction } from "@/lib/utils";

type PersonnelFilters = {
  q?: string;
  phongBan?: string;
  vaiTro?: string;
  trangThai?: string;
  taiKhoan?: string;
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
    taiKhoan: filters.taiKhoan ?? "all",
  });
  const [form, setForm] = useState<EntityInput>(emptyPerson);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffItem | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<StaffItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isPending, startTransition] = useTransition();

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => paginate(rows, safePage, pageSize),
    [rows, safePage, pageSize]
  );
  const baseIndex = pageSize > 0 ? (safePage - 1) * pageSize : 0;

  useEffect(() => {
    setFilterState({
      q: filters.q ?? "",
      phongBan: filters.phongBan ?? "",
      vaiTro: filters.vaiTro ?? "",
      trangThai: filters.trangThai ?? "all",
      taiKhoan: filters.taiKhoan ?? "all",
    });
    setPage(1);
  }, [filters.q, filters.phongBan, filters.vaiTro, filters.trangThai, filters.taiKhoan]);

  function applyFilters(next: PersonnelFilters) {
    setPage(1);
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
    setSelectedPerson(null);
    setDialogOpen(true);
  }

  function openEdit(row: StaffItem) {
    setMessage(null);
    setForm(rowToInput(row));
    setSelectedPerson(null);
    setDialogOpen(true);
  }

  function openPersonDetail(row: StaffItem) {
    setDialogOpen(false);
    setDeleteTarget(null);
    setSelectedPerson(row);
  }

  function submitForm() {
    runTransitionAction(startTransition, async () => {
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
    runTransitionAction(startTransition, async () => {
      const result = await deletePersonAction(deleteTarget.id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_170px_150px_170px_170px_auto]">
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
          <Select
            value={filterState.taiKhoan ?? "all"}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, taiKhoan: event.target.value }))
            }
          >
            <option value="all">Quyền đăng nhập</option>
            <option value="with_account">Đã cấp quyền</option>
            <option value="without_account">Chưa cấp quyền</option>
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
        {pageRows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1080px]">
              <thead>
                <tr>
                  <th className="w-12">STT</th>
                  <th>Họ tên</th>
                  <th>Mã hồ sơ</th>
                  <th>Phòng ban</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th>Quyền đăng nhập</th>
                  <th>Trạng thái</th>
                  <th>Thiết bị</th>
                  <th>Chứng thư</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={row.id} className="cursor-pointer" onClick={() => openPersonDetail(row)}>
                    <td className="text-slate-500">{baseIndex + index + 1}</td>
                    <td className="font-medium text-slate-950">
                      <button
                        type="button"
                        className="text-left font-semibold text-slate-950 hover:text-primary hover:underline"
                        onClick={() => openPersonDetail(row)}
                      >
                        {row.ho_ten}
                      </button>
                    </td>
                    <td className="font-mono text-slate-700">{row.ten_dang_nhap}</td>
                    <td>{display(row.phong_ban?.ten_phong_ban)}</td>
                    <td>
                      <div className="space-y-1">
                        <p>{display(row.email)}</p>
                        <p className="text-xs text-slate-500">{display(row.so_dien_thoai)}</p>
                      </div>
                    </td>
                    <td>{ROLE_LABELS[row.vai_tro] ?? row.vai_tro}</td>
                    <td>{row.co_tai_khoan ? "Đã cấp quyền" : "Chưa cấp quyền"}</td>
                    <td>
                      <ActiveStatusBadge active={row.trang_thai} />
                    </td>
                    <td>{row.thiet_bi_count}</td>
                    <td>{row.chung_thu_count}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(row);
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTarget(row);
                          }}
                        >
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

      <Pagination
        total={rows.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <Modal
        open={dialogOpen}
        title={form.id ? "Chỉnh sửa nhân sự" : "Thêm nhân sự"}
        description="Hồ sơ này dùng để phân công thiết bị, chứng thư số và theo dõi nhân sự nội bộ."
        onClose={() => setDialogOpen(false)}
        className="max-w-3xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ tên" required>
            <Input value={String(form.ho_ten ?? "")} onChange={(e) => setField("ho_ten", e.target.value)} />
          </Field>
          <Field label="Mã hồ sơ">
            <Input
              value={String(form.ten_dang_nhap ?? "")}
              readOnly
              disabled
              placeholder={form.id ? "" : "NS0001"}
              className="font-mono"
            />
          </Field>
          <Field label="Email">
            <Input type="email" value={String(form.email ?? "")} onChange={(e) => setField("email", e.target.value)} />
          </Field>
          <Field label="Số điện thoại">
            <Input value={String(form.so_dien_thoai ?? "")} onChange={(e) => setField("so_dien_thoai", e.target.value)} />
          </Field>
          <Field label="Phòng ban">
            <div className="space-y-2">
              <Select value={String(form.phong_ban_id ?? "")} onChange={(e) => setField("phong_ban_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.ten_phong_ban}
                  </option>
                ))}
              </Select>
              <TextLinkButton href="/dashboard/phong-ban" className="w-fit">Thêm phòng ban</TextLinkButton>
            </div>
          </Field>
          <Field label="Vai trò" required>
            <Select value={String(form.vai_tro ?? "user")} onChange={(e) => setField("vai_tro", e.target.value)}>
              <option value="admin">Quản trị</option>
              <option value="it">IT</option>
              <option value="user">Nhân sự</option>
            </Select>
          </Field>
          <details className="md:col-span-2 rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Quyền đăng nhập
            </summary>
            <div className="mt-3">
              <Field label="Mã liên kết tài khoản">
                <Input
                  value={String(form.auth_user_id ?? "")}
                  onChange={(e) => setField("auth_user_id", e.target.value)}
                  placeholder="UUID tài khoản đăng nhập, chỉ dùng cho admin/IT"
                />
              </Field>
            </div>
          </details>
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

      <PersonDetailDrawer person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </div>
  );
}

function PersonDetailDrawer({
  person,
  onClose,
}: {
  person: StaffItem | null;
  onClose: () => void;
}) {
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-label="Đóng chi tiết nhân sự"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-blue-700">Hồ sơ nhân sự</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-slate-950">{person.ho_ten}</h2>
            <p className="mt-1 text-sm text-slate-500">Mã hồ sơ: {display(person.ten_dang_nhap)}</p>
          </div>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-md border border-border text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">Đóng</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-md border border-border p-4">
            <h3 className="font-heading text-base font-semibold text-slate-950">Thông tin chính</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <InfoTerm label="Phòng ban" value={display(person.phong_ban?.ten_phong_ban)} />
              <InfoTerm label="Vai trò" value={ROLE_LABELS[person.vai_tro] ?? person.vai_tro} />
              <InfoTerm label="Email" value={display(person.email)} />
              <InfoTerm label="Số điện thoại" value={display(person.so_dien_thoai)} />
              <InfoTerm label="Quyền đăng nhập" value={person.co_tai_khoan ? "Đã cấp quyền" : "Chưa cấp quyền"} />
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt>
                <dd className="mt-1">
                  <ActiveStatusBadge active={person.trang_thai} />
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-base font-semibold text-slate-950">
                Thiết bị đang sử dụng
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
                {person.assignedDevices.length}
              </span>
            </div>
            {person.assignedDevices.length ? (
              <div className="mt-3 divide-y divide-border">
                {person.assignedDevices.map((device) => (
                  <Link
                    key={device.id}
                    href={`/dashboard/thiet-bi/${device.id}`}
                    className="block py-3 hover:text-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{device.ma_thiet_bi}</p>
                        <p className="mt-1 text-sm text-slate-600">{device.ten_thiet_bi}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {display(device.loai_thiet_bi?.ten_loai)} · {display(device.phong_ban?.ten_phong_ban)}
                        </p>
                      </div>
                      <DeviceConditionBadge label={device.tinh_trang?.ten_tinh_trang} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Nhân sự này chưa được gắn thiết bị.</p>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-base font-semibold text-slate-950">Chứng thư số</h3>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
                {person.certificates.length}
              </span>
            </div>
            {person.certificates.length ? (
              <div className="mt-3 divide-y divide-border">
                {person.certificates.map((certificate) => (
                  <div
                    key={certificate.thiet_bi_chung_thu_so_id ?? `${certificate.so_hieu_chung_thu_so}-${certificate.thiet_bi_id}`}
                    className="py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">
                          {display(certificate.so_hieu_chung_thu_so)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {display(certificate.so_hieu_thiet_bi)} · hết hạn {formatDate(certificate.ngay_het_hieu_luc)}
                        </p>
                      </div>
                      <CertificateStatusBadge status={certificate.trang_thai} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Nhân sự này chưa có chứng thư số.</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function InfoTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
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
