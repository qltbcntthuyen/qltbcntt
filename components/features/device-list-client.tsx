"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, HardDrive, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteDeviceAction, saveDeviceAction, type EntityInput } from "@/app/actions/mutations";
import {
  CertificateStatusBadge,
  DeviceConditionBadge,
  StatCard,
  TextLinkButton,
} from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { CERTIFICATE_STATUS_OPTIONS } from "@/lib/constants";
import type { DeviceListItem, LookupData } from "@/lib/data";
import { display, formatDate } from "@/lib/format";

type DeviceFilters = {
  q?: string;
  loai?: string;
  phongBan?: string;
  tinhTrang?: string;
  nguoiDung?: string;
  chungThu?: string;
};

const emptyDevice: EntityInput = {
  ma_thiet_bi: "",
  ten_thiet_bi: "",
  loai_thiet_bi_id: "",
  hang_model_id: "",
  serial: "",
  nam_trang_bi: "",
  ngay_tiep_nhan: "",
  nguon_goc_id: "",
  tinh_trang_id: "",
  phong_ban_id: "",
  nguoi_su_dung_id: "",
  la_thiet_bi_dung_chung: false,
  thiet_bi_mat: false,
  mainboard: "",
  cpu: "",
  ram: "",
  o_cung: "",
  man_hinh: "",
  he_dieu_hanh_id: "",
  phan_mem_diet_virus_id: "",
};

function deviceToInput(row: DeviceListItem): EntityInput {
  return {
    id: row.id,
    ma_thiet_bi: row.ma_thiet_bi,
    ten_thiet_bi: row.ten_thiet_bi,
    loai_thiet_bi_id: row.loai_thiet_bi_id,
    hang_model_id: row.hang_model_id ?? "",
    serial: row.serial ?? "",
    nam_trang_bi: row.nam_trang_bi ?? "",
    ngay_tiep_nhan: row.ngay_tiep_nhan ?? "",
    nguon_goc_id: row.nguon_goc_id ?? "",
    tinh_trang_id: row.tinh_trang_id ?? "",
    phong_ban_id: row.phong_ban_id ?? "",
    nguoi_su_dung_id: row.nguoi_su_dung_id ?? "",
    la_thiet_bi_dung_chung: Boolean(row.la_thiet_bi_dung_chung),
    thiet_bi_mat: Boolean(row.thiet_bi_mat),
    mainboard: "",
    cpu: "",
    ram: "",
    o_cung: "",
    man_hinh: "",
    he_dieu_hanh_id: "",
    phan_mem_diet_virus_id: "",
  };
}

export function DeviceListClient({
  rows,
  lookups,
  filters,
}: {
  rows: DeviceListItem[];
  lookups: LookupData;
  filters: DeviceFilters;
}) {
  const router = useRouter();
  const [filterState, setFilterState] = useState<DeviceFilters>({
    q: filters.q ?? "",
    loai: filters.loai ?? "",
    phongBan: filters.phongBan ?? "",
    tinhTrang: filters.tinhTrang ?? "",
    nguoiDung: filters.nguoiDung ?? "",
    chungThu: filters.chungThu ?? "all",
  });
  const [form, setForm] = useState<EntityInput>(emptyDevice);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceListItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const assignedCount = rows.filter((row) => row.nguoi_su_dung_id != null).length;
  const unassignedCount = rows.filter((row) => row.nguoi_su_dung_id == null).length;
  const certificateCount = rows.filter((row) => row.chung_thu).length;

  function applyFilters(next: DeviceFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    router.push(`/dashboard/thiet-bi${params.size ? `?${params}` : ""}`);
  }

  function setField(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setMessage(null);
    setForm(emptyDevice);
    setDialogOpen(true);
  }

  function openEdit(row: DeviceListItem) {
    setMessage(null);
    setForm(deviceToInput(row));
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result = await saveDeviceAction(form);
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
      const result = await deleteDeviceAction(deleteTarget.id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Thiết bị đang hiển thị" value={rows.length} icon={HardDrive} tone="blue" />
        <StatCard label="Đã phân công" value={assignedCount} icon={Building2} tone="green" />
        <StatCard label="Chưa phân công" value={unassignedCount} icon={RotateCcw} tone="amber" />
        <StatCard label="Có chứng thư số" value={certificateCount} icon={BadgeCheck} tone="slate" />
      </section>

      <section className="admin-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(5,minmax(140px,180px))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filterState.q ?? ""}
              onChange={(event) =>
                setFilterState((current) => ({ ...current, q: event.target.value }))
              }
              placeholder="Tìm kiếm"
              className="pl-9"
            />
          </div>
          <Select
            value={filterState.loai ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, loai: event.target.value }))
            }
          >
            <option value="">Loại thiết bị</option>
            {lookups.deviceTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten_loai}
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
          <Select
            value={filterState.tinhTrang ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, tinhTrang: event.target.value }))
            }
          >
            <option value="">Tình trạng</option>
            {lookups.statuses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten_tinh_trang}
              </option>
            ))}
          </Select>
          <Select
            value={filterState.nguoiDung ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, nguoiDung: event.target.value }))
            }
          >
            <option value="">Người sử dụng</option>
            <option value="none">Chưa phân công</option>
            {lookups.staff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ho_ten}
              </option>
            ))}
          </Select>
          <Select
            value={filterState.chungThu ?? "all"}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, chungThu: event.target.value }))
            }
          >
            {CERTIFICATE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
                setFilterState({});
                router.push("/dashboard/thiet-bi");
              }}
            >
              <RotateCcw className="size-4" />
              <span className="sr-only">Đặt lại</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} thiết bị</p>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Thêm thiết bị
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
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Loại</th>
                  <th>Hãng/model</th>
                  <th>Phòng ban</th>
                  <th>Người sử dụng</th>
                  <th>Tình trạng</th>
                  <th>Chứng thư số</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-950">
                      <Link href={`/dashboard/thiet-bi/${row.id}`} className="hover:underline">
                        {row.ma_thiet_bi}
                      </Link>
                    </td>
                    <td>{row.ten_thiet_bi}</td>
                    <td>{display(row.loai_thiet_bi?.ten_loai)}</td>
                    <td>
                      {display(
                        [row.hang_model?.ten_hang, row.hang_model?.ten_model]
                          .filter(Boolean)
                          .join(" ")
                      )}
                    </td>
                    <td>{display(row.phong_ban?.ten_phong_ban)}</td>
                    <td>{display(row.nguoi_su_dung?.ho_ten)}</td>
                    <td>
                      <DeviceConditionBadge label={row.tinh_trang?.ten_tinh_trang} />
                    </td>
                    <td>
                      <div className="space-y-1">
                        <CertificateStatusBadge status={row.chung_thu?.trang_thai} />
                        {row.chung_thu?.ngay_het_hieu_luc ? (
                          <p className="text-xs text-slate-500">
                            Hết hạn {formatDate(row.chung_thu.ngay_het_hieu_luc)}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Sửa
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
              title="Chưa có thiết bị phù hợp"
              description="Thử đặt lại bộ lọc hoặc thêm thiết bị đầu tiên cho cơ quan."
            />
          </div>
        )}
      </section>

      <Modal
        open={dialogOpen}
        title={form.id ? "Chỉnh sửa thiết bị" : "Thêm thiết bị"}
        description="Nhập thông tin nhận diện, tình trạng và đơn vị sử dụng thiết bị."
        onClose={() => setDialogOpen(false)}
        className="max-w-4xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="space-y-5">
          <FormSection title="Thông tin nhận diện">
            <Field label="Mã thiết bị" required>
              <Input value={String(form.ma_thiet_bi ?? "")} onChange={(e) => setField("ma_thiet_bi", e.target.value)} />
            </Field>
            <Field label="Tên thiết bị" required>
              <Input value={String(form.ten_thiet_bi ?? "")} onChange={(e) => setField("ten_thiet_bi", e.target.value)} />
            </Field>
            <Field label="Loại thiết bị" required>
              <Select value={String(form.loai_thiet_bi_id ?? "")} onChange={(e) => setField("loai_thiet_bi_id", e.target.value)}>
                <option value="">Chọn loại</option>
                {lookups.deviceTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.ten_loai}</option>
                ))}
              </Select>
            </Field>
            <Field label="Hãng/model">
              <Select value={String(form.hang_model_id ?? "")} onChange={(e) => setField("hang_model_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.ten_hang, item.ten_model].filter(Boolean).join(" ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Serial">
              <Input value={String(form.serial ?? "")} onChange={(e) => setField("serial", e.target.value)} />
            </Field>
            <Field label="Năm trang bị">
              <Input type="number" value={String(form.nam_trang_bi ?? "")} onChange={(e) => setField("nam_trang_bi", e.target.value)} />
            </Field>
          </FormSection>

          <FormSection title="Phân công sử dụng">
            <Field label="Ngày tiếp nhận">
              <Input type="date" value={String(form.ngay_tiep_nhan ?? "")} onChange={(e) => setField("ngay_tiep_nhan", e.target.value)} />
            </Field>
            <Field label="Nguồn gốc">
              <Select value={String(form.nguon_goc_id ?? "")} onChange={(e) => setField("nguon_goc_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.sources.map((item) => (
                  <option key={item.id} value={item.id}>{item.ten_nguon_goc}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tình trạng">
              <Select value={String(form.tinh_trang_id ?? "")} onChange={(e) => setField("tinh_trang_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.statuses.map((item) => (
                  <option key={item.id} value={item.id}>{item.ten_tinh_trang}</option>
                ))}
              </Select>
            </Field>
            <Field label="Phòng ban">
              <div className="space-y-2">
                <Select value={String(form.phong_ban_id ?? "")} onChange={(e) => setField("phong_ban_id", e.target.value)}>
                  <option value="">Chưa chọn</option>
                  {lookups.departments.map((item) => (
                    <option key={item.id} value={item.id}>{item.ten_phong_ban}</option>
                  ))}
                </Select>
                <TextLinkButton href="/dashboard/phong-ban" className="w-fit">Thêm phòng ban</TextLinkButton>
              </div>
            </Field>
            <Field label="Người sử dụng">
              <Select value={String(form.nguoi_su_dung_id ?? "")} onChange={(e) => setField("nguoi_su_dung_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.staff.map((item) => (
                  <option key={item.id} value={item.id}>{item.ho_ten}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center gap-5 pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.la_thiet_bi_dung_chung)} onChange={(e) => setField("la_thiet_bi_dung_chung", e.target.checked)} />
                Thiết bị dùng chung
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.thiet_bi_mat)} onChange={(e) => setField("thiet_bi_mat", e.target.checked)} />
                Thiết bị mật
              </label>
            </div>
          </FormSection>

          <FormSection title="Thông tin kỹ thuật">
            <Field label="Mainboard">
              <Input value={String(form.mainboard ?? "")} onChange={(e) => setField("mainboard", e.target.value)} />
            </Field>
            <Field label="CPU">
              <Input value={String(form.cpu ?? "")} onChange={(e) => setField("cpu", e.target.value)} />
            </Field>
            <Field label="RAM">
              <Input value={String(form.ram ?? "")} onChange={(e) => setField("ram", e.target.value)} />
            </Field>
            <Field label="Ổ cứng">
              <Input value={String(form.o_cung ?? "")} onChange={(e) => setField("o_cung", e.target.value)} />
            </Field>
            <Field label="Màn hình">
              <Input value={String(form.man_hinh ?? "")} onChange={(e) => setField("man_hinh", e.target.value)} />
            </Field>
            <Field label="Hệ điều hành">
              <Select value={String(form.he_dieu_hanh_id ?? "")} onChange={(e) => setField("he_dieu_hanh_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.operatingSystems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.ten_he_dieu_hanh, item.phien_ban].filter(Boolean).join(" ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Phần mềm diệt virus">
              <Select value={String(form.phan_mem_diet_virus_id ?? "")} onChange={(e) => setField("phan_mem_diet_virus_id", e.target.value)}>
                <option value="">Chưa chọn</option>
                {lookups.antivirus.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.ten_phan_mem, item.phien_ban].filter(Boolean).join(" ")}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thiết bị"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa thiết bị"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.ma_thiet_bi ?? "thiết bị này"}? Thao tác có thể bị từ chối nếu thiết bị còn lịch sử liên quan.`}
        confirmLabel="Xóa thiết bị"
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border p-4">
      <h3 className="font-heading text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
