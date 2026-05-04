"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePlus,
  BadgeCheck,
  CalendarClock,
  FilePenLine,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  deleteCertificateAction,
  revokeCertificateAction,
  saveCertificateAction,
  type EntityInput,
} from "@/app/actions/mutations";
import { CertificateStatusBadge, StatCard } from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { CERTIFICATE_STATUS_OPTIONS } from "@/lib/constants";
import type { Certificate, CertificateReportRow, LookupData } from "@/lib/data";
import { display, formatDate } from "@/lib/format";

type CertificateFilters = {
  q?: string;
  trangThai?: string;
  phongBan?: string;
};

const emptyCertificate: EntityInput = {
  thiet_bi_id: "",
  nguoi_su_dung_id: "",
  so_hieu_chung_thu_so: "",
  ngay_hieu_luc: "",
  ngay_het_hieu_luc: "",
  han_gia_han_lan_dau: "",
  loai_su_kien: "cap_moi",
};

function recordToInput(record: Certificate): EntityInput {
  return {
    id: record.id,
    thiet_bi_id: record.thiet_bi_id,
    nguoi_su_dung_id: record.nguoi_su_dung_id,
    so_hieu_chung_thu_so: record.so_hieu_chung_thu_so,
    ngay_hieu_luc: record.ngay_hieu_luc,
    ngay_het_hieu_luc: record.ngay_het_hieu_luc,
    han_gia_han_lan_dau: record.han_gia_han_lan_dau ?? "",
    loai_su_kien: "thay_doi_thong_tin",
  };
}

export function CertificateListClient({
  rows,
  records,
  lookups,
  filters,
}: {
  rows: CertificateReportRow[];
  records: Certificate[];
  lookups: LookupData;
  filters: CertificateFilters;
}) {
  const router = useRouter();
  const recordMap = useMemo(() => new Map(records.map((item) => [item.id, item])), [records]);
  const typeMap = useMemo(
    () => new Map(lookups.deviceTypes.map((item) => [item.id, item])),
    [lookups.deviceTypes]
  );
  const certificateDevices = useMemo(
    () =>
      lookups.devices.filter((device) => {
        const type = typeMap.get(device.loai_thiet_bi_id);
        const haystack = `${type?.ma_loai ?? ""} ${type?.ten_loai ?? ""}`.toLowerCase();
        return haystack.includes("token") || haystack.includes("sim pki") || haystack.includes("sim_pki");
      }),
    [lookups.devices, typeMap]
  );
  const stats = {
    active: rows.filter((row) => row.trang_thai === "dang_hieu_luc").length,
    expiring: rows.filter((row) => row.trang_thai === "sap_het_han").length,
    renew: rows.filter((row) => row.trang_thai === "het_han_cho_gia_han").length,
    revoke: rows.filter((row) => row.trang_thai === "can_thu_hoi").length,
  };
  const [filterState, setFilterState] = useState<CertificateFilters>({
    q: filters.q ?? "",
    trangThai: filters.trangThai ?? "all",
    phongBan: filters.phongBan ?? "",
  });
  const [form, setForm] = useState<EntityInput>(emptyCertificate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CertificateReportRow | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<CertificateReportRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(next: CertificateFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    router.push(`/dashboard/chung-thu-so${params.size ? `?${params}` : ""}`);
  }

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectDevice(value: string) {
    const device = certificateDevices.find((item) => String(item.id) === value);
    setForm((current) => ({
      ...current,
      thiet_bi_id: value,
      nguoi_su_dung_id: device?.nguoi_su_dung_id ?? current.nguoi_su_dung_id ?? "",
    }));
  }

  function openCreate() {
    setMessage(null);
    setForm(emptyCertificate);
    setDialogOpen(true);
  }

  function openEdit(row: CertificateReportRow, eventType: "gia_han" | "thay_doi_thong_tin") {
    const id = row.thiet_bi_chung_thu_so_id;
    const record = id ? recordMap.get(id) : null;
    if (!record) {
      setMessage("Không tìm thấy bản ghi chứng thư cần chỉnh sửa.");
      return;
    }
    setMessage(null);
    setForm({ ...recordToInput(record), loai_su_kien: eventType });
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result = await saveCertificateAction(form);
      setMessage(result.message);
      if (result.ok) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function revokeSelected() {
    const id = revokeTarget?.thiet_bi_chung_thu_so_id;
    if (!id) return;
    startTransition(async () => {
      const result = await revokeCertificateAction(id);
      setMessage(result.message);
      setRevokeTarget(null);
      if (result.ok) router.refresh();
    });
  }

  function deleteSelected() {
    const id = deleteTarget?.thiet_bi_chung_thu_so_id;
    if (!id) return;
    startTransition(async () => {
      const result = await deleteCertificateAction(id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đang hiệu lực" value={stats.active} icon={BadgeCheck} tone="green" />
        <StatCard label="Sắp hết hạn" value={stats.expiring} icon={CalendarClock} tone="amber" />
        <StatCard label="Cần gia hạn" value={stats.renew} icon={RefreshCcw} tone="red" />
        <StatCard label="Cần thu hồi" value={stats.revoke} icon={ShieldAlert} tone="red" />
      </section>

      <section className="admin-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filterState.q ?? ""}
              onChange={(event) => setFilterState((current) => ({ ...current, q: event.target.value }))}
              placeholder="Tìm số hiệu, thiết bị, người sử dụng..."
              className="pl-9"
            />
          </div>
          <Select
            value={filterState.trangThai ?? "all"}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, trangThai: event.target.value }))
            }
          >
            {CERTIFICATE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
          <div className="flex gap-2">
            <Button type="button" onClick={() => applyFilters(filterState)}>
              Áp dụng
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setFilterState({ trangThai: "all" });
                router.push("/dashboard/chung-thu-so");
              }}
            >
              <RotateCcw className="size-4" />
              <span className="sr-only">Đặt lại</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} chứng thư số</p>
        <Button type="button" onClick={openCreate}>
          <BadgePlus className="size-4" />
          Cấp mới
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
            <table className="admin-table min-w-[1180px]">
              <thead>
                <tr>
                  <th>Số hiệu chứng thư</th>
                  <th>Thiết bị</th>
                  <th>Người sử dụng</th>
                  <th>Phòng ban</th>
                  <th>Hiệu lực</th>
                  <th>Hạn gia hạn lần đầu</th>
                  <th>Còn lại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.thiet_bi_chung_thu_so_id}-${row.thiet_bi_id}`}>
                    <td className="font-medium text-slate-950">
                      {display(row.so_hieu_chung_thu_so)}
                    </td>
                    <td>
                      {row.thiet_bi_id ? (
                        <Link href={`/dashboard/thiet-bi/${row.thiet_bi_id}`} className="font-medium text-primary hover:underline">
                          {display(row.so_hieu_thiet_bi)} - {display(row.ten_thiet_bi)}
                        </Link>
                      ) : (
                        display(row.ten_thiet_bi)
                      )}
                    </td>
                    <td>{display(row.nguoi_su_dung)}</td>
                    <td>{display(row.ten_phong_ban)}</td>
                    <td>
                      <div className="space-y-1">
                        <p>{formatDate(row.ngay_hieu_luc)}</p>
                        <p className="text-xs text-slate-500">đến {formatDate(row.ngay_het_hieu_luc)}</p>
                      </div>
                    </td>
                    <td>{formatDate(row.han_gia_han_lan_dau)}</td>
                    <td>
                      {row.so_ngay_con_lai == null ? "Không có dữ liệu" : `${row.so_ngay_con_lai} ngày`}
                    </td>
                    <td>
                      <CertificateStatusBadge status={row.trang_thai} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row, "gia_han")}>
                          <RefreshCcw className="size-4" />
                          Gia hạn
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row, "thay_doi_thong_tin")}>
                          <FilePenLine className="size-4" />
                          Đổi thông tin
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRevokeTarget(row)}
                          disabled={row.trang_thai === "da_thu_hoi"}
                        >
                          <ShieldAlert className="size-4" />
                          Thu hồi
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(row)}
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
              title="Chưa có chứng thư phù hợp"
              description="Thử đặt lại bộ lọc hoặc thêm chứng thư số mới cho thiết bị."
            />
          </div>
        )}
      </section>

      <Modal
        open={dialogOpen}
        title={
          form.id
            ? form.loai_su_kien === "gia_han"
              ? "Gia hạn chứng thư số"
              : "Thay đổi thông tin chứng thư"
            : "Cấp mới chứng thư số"
        }
        description="Chứng thư chỉ gắn với thiết bị loại Sim PKI, Token hoặc Token mật. Khi chọn thiết bị, hệ thống tự điền người sử dụng nếu thiết bị đã được phân công."
        onClose={() => setDialogOpen(false)}
        className="max-w-3xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Thiết bị" required>
            <Select value={String(form.thiet_bi_id ?? "")} onChange={(e) => selectDevice(e.target.value)}>
              <option value="">Chọn thiết bị</option>
              {certificateDevices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ma_thiet_bi} - {item.ten_thiet_bi}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Người sử dụng" required>
            <Select value={String(form.nguoi_su_dung_id ?? "")} onChange={(e) => setField("nguoi_su_dung_id", e.target.value)}>
              <option value="">Chọn người sử dụng</option>
              {lookups.staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ho_ten}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Số hiệu chứng thư" required>
            <Input
              value={String(form.so_hieu_chung_thu_so ?? "")}
              onChange={(e) => setField("so_hieu_chung_thu_so", e.target.value)}
            />
          </Field>
          <Field label="Loại cập nhật">
            <Select
              value={String(form.loai_su_kien ?? "thay_doi_thong_tin")}
              onChange={(e) => setField("loai_su_kien", e.target.value)}
              disabled={!form.id}
            >
              <option value="cap_moi">Cấp mới</option>
              <option value="thay_doi_thong_tin">Thay đổi thông tin</option>
              <option value="gia_han">Gia hạn</option>
            </Select>
          </Field>
          <Field label="Ngày hiệu lực" required>
            <Input type="date" value={String(form.ngay_hieu_luc ?? "")} onChange={(e) => setField("ngay_hieu_luc", e.target.value)} />
          </Field>
          <Field label="Ngày hết hiệu lực" required>
            <Input type="date" value={String(form.ngay_het_hieu_luc ?? "")} onChange={(e) => setField("ngay_het_hieu_luc", e.target.value)} />
          </Field>
          <Field label="Hạn gia hạn lần đầu">
            <Input type="date" value={String(form.han_gia_han_lan_dau ?? "")} onChange={(e) => setField("han_gia_han_lan_dau", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu chứng thư"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Xác nhận thu hồi chứng thư"
        description={`Bạn có chắc muốn ghi nhận thu hồi chứng thư ${revokeTarget?.so_hieu_chung_thu_so ?? "này"}?`}
        confirmLabel="Thu hồi chứng thư"
        pending={isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={revokeSelected}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa chứng thư"
        description={`Bạn có chắc muốn xóa chứng thư ${deleteTarget?.so_hieu_chung_thu_so ?? "này"}? Thao tác có thể bị từ chối nếu còn lịch sử liên quan.`}
        confirmLabel="Xóa chứng thư"
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
