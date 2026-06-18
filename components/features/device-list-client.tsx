"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Download,
  FileText,
  HardDrive,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  deleteDeviceAction,
  importDevicesAction,
  saveDeviceAction,
  type EntityInput,
} from "@/app/actions/mutations";
import {
  DeviceConditionBadge,
  StatCard,
  TextLinkButton,
} from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { NHOM_CDS_LABELS, NHOM_CDS_OPTIONS } from "@/lib/constants";
import type { DeviceListItem, LookupData } from "@/lib/data";
import { display } from "@/lib/format";

type DeviceFilters = {
  q?: string;
  loai?: string;
  phongBan?: string;
  tinhTrang?: string;
  nguoiDung?: string;
};

type ImportPreviewRow = {
  index: number;
  payload: EntityInput;
  ma: string;
  ten: string;
  loai: string;
  status: "ready" | "review";
  note: string;
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
  dap_ung_cds: false,
  nhom_cds: "",
  ghi_chu: "",
  mainboard: "",
  cpu: "",
  ram: "",
  o_cung: "",
  man_hinh: "",
  he_dieu_hanh_id: "",
  phan_mem_diet_virus_id: "",
  ghi_chu_ky_thuat: "",
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
    dap_ung_cds: Boolean(row.dap_ung_cds),
    nhom_cds: row.nhom_cds ?? "",
    ghi_chu: row.ghi_chu ?? "",
    mainboard: row.cau_hinh?.mainboard ?? "",
    cpu: row.cau_hinh?.cpu ?? "",
    ram: row.cau_hinh?.ram ?? "",
    o_cung: row.cau_hinh?.o_cung ?? "",
    man_hinh: row.cau_hinh?.man_hinh ?? "",
    he_dieu_hanh_id: row.cau_hinh?.he_dieu_hanh_id ?? "",
    phan_mem_diet_virus_id: row.cau_hinh?.phan_mem_diet_virus_id ?? "",
    ghi_chu_ky_thuat: row.cau_hinh?.ghi_chu ?? "",
  };
}

function summarizeTech(row: DeviceListItem) {
  const parts: string[] = [];
  if (row.cau_hinh?.cpu) parts.push(`CPU: ${row.cau_hinh.cpu}`);
  if (row.cau_hinh?.ram) parts.push(`RAM: ${row.cau_hinh.ram}`);
  if (row.cau_hinh?.o_cung) parts.push(`Ổ: ${row.cau_hinh.o_cung}`);
  return parts.length ? parts.join(" · ") : "—";
}

const TEMPLATE_HEADERS = [
  "ma_thiet_bi",
  "ten_thiet_bi",
  "loai_thiet_bi",
  "hang_model",
  "serial",
  "nam_trang_bi",
  "ngay_tiep_nhan",
  "nguon_goc",
  "tinh_trang",
  "phong_ban",
  "nguoi_su_dung",
  "thiet_bi_mat",
  "dap_ung_cds",
  "nhom_cds",
  "ghi_chu",
];

const TEMPLATE_HEADER_LABELS: Record<string, string> = {
  ma_thiet_bi: "Mã thiết bị (bỏ trống để tự sinh)",
  ten_thiet_bi: "Tên thiết bị (bắt buộc)",
  loai_thiet_bi: "Loại thiết bị (bắt buộc - khớp danh mục)",
  hang_model: "Hãng/Model",
  serial: "Serial",
  nam_trang_bi: "Năm trang bị",
  ngay_tiep_nhan: "Ngày tiếp nhận (YYYY-MM-DD)",
  nguon_goc: "Nguồn gốc",
  tinh_trang: "Tình trạng",
  phong_ban: "Phòng ban",
  nguoi_su_dung: "Người sử dụng (email/họ tên)",
  thiet_bi_mat: "Thiết bị mật (true/false)",
  dap_ung_cds: "Đáp ứng CĐS (true/false)",
  nhom_cds: "Nhóm CĐS (may_tinh_de_ban, laptop, may_in...)",
  ghi_chu: "Ghi chú",
};

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
  });
  const [form, setForm] = useState<EntityInput>(emptyDevice);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceListItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignedCount = rows.filter((row) => row.nguoi_su_dung_id != null).length;
  const unassignedCount = rows.filter((row) => row.nguoi_su_dung_id == null).length;
  const cdsCount = rows.filter((row) => row.dap_ung_cds).length;

  const pageRows = useMemo(() => paginate(rows, page, pageSize), [rows, page, pageSize]);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const baseIndex = pageSize > 0 ? (safePage - 1) * pageSize : 0;

  function applyFilters(next: DeviceFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    setPage(1);
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

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const data = [TEMPLATE_HEADERS.map((key) => TEMPLATE_HEADER_LABELS[key] ?? key)];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = TEMPLATE_HEADERS.map((key) => ({
      wch: Math.max((TEMPLATE_HEADER_LABELS[key] ?? key).length + 4, 20),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau import thiet bi");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau-import-thiet-bi.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    const mapped: ImportPreviewRow[] = data.map((raw, index) => {
      const get = (...keys: string[]) => {
        for (const key of keys) {
          const value = raw[key];
          if (value !== null && value !== undefined && String(value).trim()) {
            return String(value).trim();
          }
        }
        return "";
      };
      const ma = get(
        "ma_thiet_bi",
        "Mã thiết bị (bỏ trống để tự sinh)",
        "Mã thiết bị (bắt buộc)",
        "Mã thiết bị",
        "Ma thiet bi"
      );
      const ten = get(
        "ten_thiet_bi",
        "Tên thiết bị (bắt buộc)",
        "Tên thiết bị",
        "Ten thiet bi"
      );
      const loai = get(
        "loai_thiet_bi",
        "Loại thiết bị (bắt buộc - khớp danh mục)",
        "Loại thiết bị",
        "Loai thiet bi"
      );
      const truthy = (value: string) =>
        ["true", "1", "x", "yes", "co", "có"].includes(value.toLowerCase());
      const payload: EntityInput = {
        ma_thiet_bi: ma,
        ten_thiet_bi: ten,
        loai_thiet_bi: loai,
        hang_model: get("hang_model", "Hãng/Model"),
        serial: get("serial", "Serial"),
        nam_trang_bi: get("nam_trang_bi", "Năm trang bị"),
        ngay_tiep_nhan: get("ngay_tiep_nhan", "Ngày tiếp nhận", "Ngày tiếp nhận (YYYY-MM-DD)"),
        nguon_goc: get("nguon_goc", "Nguồn gốc"),
        tinh_trang: get("tinh_trang", "Tình trạng"),
        phong_ban: get("phong_ban", "Phòng ban"),
        nguoi_su_dung: get("nguoi_su_dung", "Người sử dụng (email/họ tên)", "Người sử dụng"),
        thiet_bi_mat: truthy(get("thiet_bi_mat", "Thiết bị mật", "Thiết bị mật (true/false)")),
        dap_ung_cds: truthy(get("dap_ung_cds", "Đáp ứng CĐS", "Đáp ứng CĐS (true/false)")),
        nhom_cds: get("nhom_cds", "Nhóm CĐS", "Nhóm CĐS (may_tinh_de_ban, laptop, may_in...)"),
        ghi_chu: get("ghi_chu", "Ghi chú"),
      };
      const ready = Boolean(ten && loai);
      return {
        index: index + 1,
        payload,
        ma,
        ten,
        loai,
        status: ready ? "ready" : "review",
        note: ready ? (ma ? "Sẵn sàng" : "Sẽ tự sinh mã") : "Thiếu tên/loại thiết bị",
      };
    });

    setImportRows(mapped);
    setImportOpen(true);
    setImportMessage(`Đã đọc ${mapped.length} dòng từ file ${file.name}.`);
  }

  function commitImport() {
    const ready = importRows.filter((row) => row.status === "ready").map((row) => row.payload);
    if (!ready.length) {
      setImportMessage("Không có dòng nào sẵn sàng để import.");
      return;
    }
    startTransition(async () => {
      const result = await importDevicesAction(ready);
      setImportMessage(result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Thiết bị đang hiển thị" value={rows.length} icon={HardDrive} tone="blue" />
        <StatCard label="Đã phân công" value={assignedCount} icon={Building2} tone="green" />
        <StatCard label="Chưa phân công" value={unassignedCount} icon={RotateCcw} tone="amber" />
        <StatCard label="Đáp ứng CĐS" value={cdsCount} icon={BadgeCheck} tone="slate" />
      </section>

      <section className="admin-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(140px,180px))_auto]">
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
                setPage(1);
                router.push("/dashboard/thiet-bi");
              }}
            >
              <RotateCcw className="size-4" />
              <span className="sr-only">Đặt lại</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} thiết bị</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <FileText className="size-4" />
            File mẫu Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setImportRows([]);
              setImportMessage(null);
              setImportOpen(true);
            }}
          >
            <Upload className="size-4" />
            Import Excel
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm thiết bị
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <section className="admin-panel overflow-hidden">
        {pageRows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1280px]">
              <thead>
                <tr>
                  <th className="w-12">STT</th>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Loại</th>
                  <th>Hãng/model</th>
                  <th>Phòng ban</th>
                  <th>Người sử dụng</th>
                  <th>Tình trạng</th>
                  <th>Thông tin kỹ thuật</th>
                  <th>Đáp ứng CĐS</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="text-slate-500">{baseIndex + index + 1}</td>
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
                    <td className="max-w-[260px] text-xs text-slate-600">
                      {summarizeTech(row)}
                      {row.cau_hinh?.ghi_chu ? (
                        <p className="mt-1 italic text-slate-500">{row.cau_hinh.ghi_chu}</p>
                      ) : null}
                    </td>
                    <td>
                      {row.dap_ung_cds ? (
                        <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Có
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                      {row.nhom_cds ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {NHOM_CDS_LABELS[row.nhom_cds] ?? row.nhom_cds}
                        </p>
                      ) : null}
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
            <Field label="Mã thiết bị">
              <Input
                value={String(form.ma_thiet_bi ?? "")}
                readOnly
                disabled
                placeholder={form.id ? "" : "Tự sinh dạng TB001 khi lưu"}
                className="font-mono"
              />
              <p className="mt-1 text-xs text-slate-500">
                {form.id
                  ? "Mã thiết bị là duy nhất và không sửa được sau khi tạo."
                  : "Hệ thống tự sinh mã thiết bị tăng dần (TB001, TB002...) khi lưu."}
              </p>
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
            <Field label="Ghi chú thiết bị" className="md:col-span-2">
              <Input value={String(form.ghi_chu ?? "")} onChange={(e) => setField("ghi_chu", e.target.value)} />
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
            <div className="flex flex-wrap items-center gap-5 pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.la_thiet_bi_dung_chung)} onChange={(e) => setField("la_thiet_bi_dung_chung", e.target.checked)} />
                Thiết bị dùng chung
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.thiet_bi_mat)} onChange={(e) => setField("thiet_bi_mat", e.target.checked)} />
                Thiết bị mật
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.dap_ung_cds)} onChange={(e) => setField("dap_ung_cds", e.target.checked)} />
                Đáp ứng yêu cầu chuyển đổi số
              </label>
            </div>
            <Field label="Nhóm CĐS" className="md:col-span-2">
              <Select value={String(form.nhom_cds ?? "")} onChange={(e) => setField("nhom_cds", e.target.value)}>
                <option value="">Chưa phân nhóm</option>
                {NHOM_CDS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
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
            <Field label="Ghi chú kỹ thuật" className="md:col-span-2">
              <Input
                value={String(form.ghi_chu_ky_thuat ?? "")}
                onChange={(e) => setField("ghi_chu_ky_thuat", e.target.value)}
                placeholder="Cấu hình bổ sung, lưu ý cài đặt..."
              />
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

      <Modal
        open={importOpen}
        title="Import Excel thiết bị"
        description="Tải lên file Excel theo mẫu. Các dòng thiếu mã/tên/loại sẽ bị bỏ qua."
        onClose={() => setImportOpen(false)}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              <Download className="size-4" />
              Tải file mẫu
            </Button>
            <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Upload className="size-4" />
              Chọn file Excel
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                onChange={(event) => handleImportFile(event.target.files?.[0] ?? null)}
              />
            </Label>
          </div>
          {importMessage ? <p className="text-sm text-slate-600">{importMessage}</p> : null}
          {importRows.length ? (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Mã thiết bị</th>
                    <th>Tên thiết bị</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row) => (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td>{display(row.ma)}</td>
                      <td>{display(row.ten)}</td>
                      <td>{display(row.loai)}</td>
                      <td>
                        {row.status === "ready" ? (
                          <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            Sẵn sàng
                          </span>
                        ) : (
                          <span className="rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Cần rà soát
                          </span>
                        )}
                      </td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Chưa có dữ liệu preview"
              description="Tải file Excel theo đúng mẫu để xem dữ liệu trước khi import."
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              onClick={commitImport}
              disabled={isPending || !importRows.some((row) => row.status === "ready")}
            >
              Ghi dữ liệu
            </Button>
          </div>
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
