"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  Download,
  FilePenLine,
  FileText,
  FileUp,
  RefreshCcw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  deleteCertificateAction,
  importCertificatesAction,
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
import { Pagination, paginate } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { CERTIFICATE_STATUS_OPTIONS } from "@/lib/constants";
import type {
  Certificate,
  CertificateHistory,
  CertificateReportRow,
  LookupData,
} from "@/lib/data";
import { display, formatDate, formatDateTime, normalizeText, toNumberOrNull } from "@/lib/format";
import { runTransitionAction } from "@/lib/utils";

type CertificateFilters = {
  q?: string;
  trangThai?: string;
  phongBan?: string;
  hieuLucFrom?: string;
  hieuLucTo?: string;
};

type ImportPreviewRow = {
  index: number;
  payload: EntityInput;
  deviceCode: string;
  serial: string;
  deviceName: string;
  staffName: string;
  status: "ready" | "review";
  note: string;
};

const emptyCertificate: EntityInput = {
  thiet_bi_id: "",
  nguoi_su_dung_id: "",
  so_hieu_chung_thu_so: "",
  email: "",
  ten_chung_thu_so: "",
  loai_chung_thu_so: "",
  to_chuc: "",
  thong_tin_chung: "",
  id_chung_thu_so_nguon: "",
  ngay_hieu_luc: "",
  ngay_het_hieu_luc: "",
  han_gia_han_lan_dau: "",
  loai_su_kien: "cap_moi",
  da_gia_han: false,
  la_hien_hanh: true,
};

function recordToInput(record: Certificate, eventType: "cap_moi" | "gia_han" | "thay_doi_thong_tin") {
  return {
    id: record.id,
    thiet_bi_id: record.thiet_bi_id,
    nguoi_su_dung_id: record.nguoi_su_dung_id,
    so_hieu_chung_thu_so: record.so_hieu_chung_thu_so,
    email: record.email ?? "",
    ten_chung_thu_so: record.ten_chung_thu_so ?? "",
    loai_chung_thu_so: record.loai_chung_thu_so ?? "",
    to_chuc: record.to_chuc ?? "",
    thong_tin_chung: record.thong_tin_chung ?? "",
    id_chung_thu_so_nguon: record.id_chung_thu_so_nguon ?? "",
    ngay_hieu_luc: record.ngay_hieu_luc,
    ngay_het_hieu_luc: record.ngay_het_hieu_luc,
    han_gia_han_lan_dau: record.han_gia_han_lan_dau ?? "",
    loai_su_kien: eventType,
    da_gia_han: record.da_gia_han,
    la_hien_hanh: record.la_hien_hanh,
  } satisfies EntityInput;
}

function resolveCertificateRecordId(
  row: CertificateReportRow | null | undefined,
  records: Certificate[]
): number | null {
  if (!row) return null;

  const direct = toNumberOrNull(row.thiet_bi_chung_thu_so_id);
  if (direct != null) return direct;

  const serial = row.so_hieu_chung_thu_so?.trim();
  const deviceId = toNumberOrNull(row.thiet_bi_id);
  if (!serial) return null;

  const matches = records.filter((record) => record.so_hieu_chung_thu_so === serial);
  if (deviceId != null) {
    const scoped = matches.find((record) => record.thiet_bi_id === deviceId);
    if (scoped) return scoped.id;
  }

  return matches[0]?.id ?? null;
}

function findCertificateRecord(
  row: CertificateReportRow | null | undefined,
  recordMap: Map<number, Certificate>,
  records: Certificate[]
) {
  const id = resolveCertificateRecordId(row, records);
  return id != null ? recordMap.get(id) ?? records.find((record) => record.id === id) ?? null : null;
}

function toInputDate(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return trimmed;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

function pickText(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  const normalizedKeys = keys.map((key) => normalizeText(key));
  for (const [key, value] of Object.entries(row)) {
    if (!normalizedKeys.includes(normalizeText(key))) continue;
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

const TEMPLATE_HEADERS = [
  "Mã thiết bị",
  "Serial CTS",
  "Tên CTS",
  "Email",
  "Loại CTS",
  "Tổ chức",
  "Thông tin chung",
  "ID chứng thư số",
  "Hiệu lực",
  "Hết hạn",
];

export function CertificateListClient({
  rows,
  records,
  history,
  lookups,
  filters,
}: {
  rows: CertificateReportRow[];
  records: Certificate[];
  history: CertificateHistory[];
  lookups: LookupData;
  filters: CertificateFilters;
}) {
  const router = useRouter();
  const messageRef = useRef<HTMLParagraphElement>(null);
  const recordMap = useMemo(() => {
    const map = new Map<number, Certificate>();
    for (const item of records) {
      map.set(Number(item.id), item);
    }
    return map;
  }, [records]);
  const typeMap = useMemo(
    () => new Map(lookups.deviceTypes.map((item) => [item.id, item])),
    [lookups.deviceTypes]
  );
  const staffMap = useMemo(() => new Map(lookups.staff.map((item) => [item.id, item])), [lookups.staff]);
  const currentRecordsByDevice = useMemo(() => {
    const map = new Map<number, Certificate[]>();
    for (const record of records) {
      const current = map.get(record.thiet_bi_id) ?? [];
      current.push(record);
      map.set(record.thiet_bi_id, current);
    }
    return map;
  }, [records]);
  const historyByRecord = useMemo(() => {
    const map = new Map<number, CertificateHistory[]>();
    for (const item of history) {
      const recordId = toNumberOrNull(item.thiet_bi_chung_thu_so_id);
      if (recordId == null) continue;
      const current = map.get(recordId) ?? [];
      current.push(item);
      map.set(recordId, current);
    }
    return map;
  }, [history]);
  const certificateDevices = useMemo(
    () =>
      lookups.devices.filter((device) => {
        const type = typeMap.get(device.loai_thiet_bi_id);
        const haystack = `${type?.ma_loai ?? ""} ${type?.ten_loai ?? ""}`.toLowerCase();
        return (
          haystack.includes("token") ||
          haystack.includes("sim pki") ||
          haystack.includes("sim_pki") ||
          haystack.includes("ký số") ||
          haystack.includes("ky so")
        );
      }),
    [lookups.devices, typeMap]
  );
  const stats = {
    active: rows.filter((row) => row.trang_thai === "dang_hieu_luc").length,
    expiring: rows.filter((row) => row.trang_thai === "sap_het_han").length,
    renewed: rows.filter((row) => row.trang_thai === "da_gia_han").length,
    revoke: rows.filter((row) => row.trang_thai === "can_thu_hoi").length,
  };

  const [filterState, setFilterState] = useState<CertificateFilters>({
    q: filters.q ?? "",
    trangThai: filters.trangThai ?? "all",
    phongBan: filters.phongBan ?? "",
    hieuLucFrom: filters.hieuLucFrom ?? "",
    hieuLucTo: filters.hieuLucTo ?? "",
  });
  const [form, setForm] = useState<EntityInput>(emptyCertificate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"cap_moi" | "gia_han" | "thay_doi_thong_tin">("cap_moi");
  const [detailTarget, setDetailTarget] = useState<CertificateReportRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CertificateReportRow | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<CertificateReportRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeAt, setRevokeAt] = useState("");
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isPending, startTransition] = useTransition();

  const pageRows = useMemo(() => paginate(rows, page, pageSize), [rows, page, pageSize]);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const baseIndex = pageSize > 0 ? (safePage - 1) * pageSize : 0;

  function applyFilters(next: CertificateFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    setPage(1);
    router.push(`/dashboard/chung-thu-so${params.size ? `?${params}` : ""}`);
  }

  function setField(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function notify(messageText: string) {
    setMessage(messageText);
    requestAnimationFrame(() => {
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function closeOverlayPanels() {
    setDetailTarget(null);
    setImportOpen(false);
    setDialogOpen(false);
  }

  function openDetail(row: CertificateReportRow) {
    closeOverlayPanels();
    setDetailTarget(row);
  }

  function openRenew(row: CertificateReportRow) {
    closeOverlayPanels();
    const record = findCertificateRecord(row, recordMap, records);
    if (!record) {
      notify("Không tìm thấy CTS gốc để gia hạn.");
      return;
    }
    if (record.da_gia_han || record.chung_thu_goc_id) {
      notify("CTS này đã được gia hạn một lần. Hãy thu hồi để cấp serial mới.");
      return;
    }
    setMessage(null);
    setDialogMode("gia_han");
    setForm({
      ...recordToInput(record, "gia_han"),
      so_hieu_chung_thu_so: "",
      ngay_hieu_luc: "",
      ngay_het_hieu_luc: "",
    });
    setDialogOpen(true);
  }

  function openChangeInfo(row: CertificateReportRow) {
    closeOverlayPanels();
    const record = findCertificateRecord(row, recordMap, records);
    if (!record) {
      notify("Không tìm thấy CTS cần đổi thông tin.");
      return;
    }
    setMessage(null);
    setDialogMode("thay_doi_thong_tin");
    setForm({
      ...recordToInput(record, "thay_doi_thong_tin"),
      noi_dung_thay_doi: "",
    });
    setDialogOpen(true);
  }

  function selectDevice(value: string) {
    const device = certificateDevices.find((item) => String(item.id) === value);
    const staff = device?.nguoi_su_dung_id ? staffMap.get(device.nguoi_su_dung_id) : null;
    const deviceType = device ? typeMap.get(device.loai_thiet_bi_id) : null;
    setForm((current) => ({
      ...current,
      thiet_bi_id: value,
      nguoi_su_dung_id: device?.nguoi_su_dung_id ?? current.nguoi_su_dung_id ?? "",
      loai_chung_thu_so:
        current.loai_chung_thu_so ||
        (deviceType?.ten_loai && /sim/i.test(deviceType.ten_loai) ? "SIM ký số" : deviceType?.ten_loai ?? ""),
      email: current.email || staff?.email || "",
      ten_chung_thu_so: current.ten_chung_thu_so || staff?.ho_ten || "",
    }));
  }

  function selectStaff(value: string) {
    const staff = staffMap.get(Number(value));
    setForm((current) => ({
      ...current,
      nguoi_su_dung_id: value,
      ten_chung_thu_so: current.ten_chung_thu_so || staff?.ho_ten || "",
      email: current.email || staff?.email || "",
    }));
  }

  function submitForm() {
    runTransitionAction(startTransition, async () => {
      const result = await saveCertificateAction(form);
      setMessage(result.message);
      if (result.ok) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function revokeSelected() {
    const id = resolveCertificateRecordId(revokeTarget, records);
    if (!id) {
      setRevokeMessage("Không xác định được CTS cần thu hồi.");
      return;
    }

    runTransitionAction(startTransition, async () => {
      const result = await revokeCertificateAction({
        id,
        ly_do_thu_hoi: revokeReason,
        thoi_diem_thu_hoi: revokeAt,
      });
      setMessage(result.message);
      if (result.ok) {
        setRevokeTarget(null);
        setRevokeReason("");
        setRevokeAt("");
        setRevokeMessage(null);
        router.refresh();
        return;
      }
      setRevokeMessage(result.message);
    });
  }

  function deleteSelected() {
    const id = resolveCertificateRecordId(deleteTarget, records);
    if (!id) {
      notify("Không xác định được CTS cần xóa.");
      return;
    }
    runTransitionAction(startTransition, async () => {
      const result = await deleteCertificateAction(id);
      setMessage(result.message);
      setDeleteTarget(null);
      if (result.ok) router.refresh();
    });
  }

  function exportActiveDocx() {
    const ids = rows
      .filter(
        (row) => row.trang_thai === "dang_hieu_luc" || row.trang_thai === "sap_het_han"
      )
      .map((row) => row.thiet_bi_chung_thu_so_id ?? 0)
      .filter(Boolean);
    if (!ids.length) {
      setMessage("Chưa có CTS đang sử dụng để xuất.");
      return;
    }
    const url = `/api/chung-thu-so/export?mau=dang_su_dung&ids=${ids.join(",")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const data = [TEMPLATE_HEADERS];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = TEMPLATE_HEADERS.map((header) => ({ wch: Math.max(header.length + 4, 18) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau import CTS");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau-import-chung-thu-so.xlsx";
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
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });

    const mapped = data.map((row, index) => {
      const deviceCode = pickText(row, ["Mã thiết bị", "Ma thiet bi", "MÃ thiết bị"]);
      const serial = pickText(row, ["Serial CTS", "ID chứng thư số", "So hieu chung thu so"]);
      const device = lookups.devices.find((item) => normalizeText(item.ma_thiet_bi) === normalizeText(deviceCode));
      const staff = device?.nguoi_su_dung_id
        ? staffMap.get(device.nguoi_su_dung_id)
        : lookups.staff.find(
            (item) =>
              normalizeText(item.email ?? "") === normalizeText(pickText(row, ["Email"])) ||
              normalizeText(item.ho_ten) === normalizeText(pickText(row, ["Tên CTS", "Ten CTS"]))
          );
      const payload: EntityInput = {
        so_hieu_thiet_bi: deviceCode,
        thiet_bi_id: device?.id ?? "",
        nguoi_su_dung_id: staff?.id ?? "",
        so_hieu_chung_thu_so: serial,
        email: pickText(row, ["Email"]),
        ten_chung_thu_so: pickText(row, ["Tên CTS", "Ten CTS"]),
        loai_chung_thu_so: pickText(row, ["Loại CTS", "Loại chứng thư số", "Loai chung thu so"]),
        to_chuc: pickText(row, ["Tổ chức", "To chuc"]),
        thong_tin_chung: pickText(row, ["Thông tin chung", "Thong tin chung"]),
        id_chung_thu_so_nguon: pickText(row, ["ID chứng thư số", "Id chứng thư số"]),
        ngay_hieu_luc: toInputDate(pickText(row, ["Hiệu lực", "Hieu luc"])),
        ngay_het_hieu_luc: toInputDate(pickText(row, ["Hết hạn", "Het han"])),
        han_gia_han_lan_dau: "",
        loai_su_kien: "cap_moi",
      };
      const status =
        device && staff && serial && payload.ngay_hieu_luc && payload.ngay_het_hieu_luc
          ? "ready"
          : "review";
      const note =
        status === "ready"
          ? "Sẵn sàng import"
          : !device
            ? "Thiếu mã thiết bị"
            : !staff
              ? "Thiếu người sử dụng"
              : !serial
                ? "Thiếu Serial CTS"
                : "Cần rà soát";
      return {
        index: index + 1,
        payload,
        deviceCode,
        serial,
        deviceName: device?.ten_thiet_bi ?? "",
        staffName: staff?.ho_ten ?? "",
        status,
        note,
      } satisfies ImportPreviewRow;
    });

    setImportRows(mapped);
    closeOverlayPanels();
    setImportOpen(true);
    setImportMessage(`Đã đọc ${mapped.length} dòng từ file ${file.name}.`);
  }

  function commitImport() {
    const readyRows = importRows.filter((row) => row.status === "ready").map((row) => row.payload);
    if (!readyRows.length) {
      setImportMessage("Không có dòng nào sẵn sàng để import.");
      return;
    }
    runTransitionAction(startTransition, async () => {
      const result = await importCertificatesAction(readyRows);
      setImportMessage(result.message);
      if (result.ok) {
        setImportOpen(false);
        setImportRows([]);
        router.refresh();
      }
    });
  }

  const detailRecordId = resolveCertificateRecordId(detailTarget, records);
  const currentDetailHistory = detailRecordId ? historyByRecord.get(detailRecordId) ?? [] : [];
  const currentDeviceRecords =
    detailTarget?.thiet_bi_id != null ? currentRecordsByDevice.get(detailTarget.thiet_bi_id) ?? [] : [];

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đang hiệu lực" value={stats.active} icon={BadgeCheck} tone="green" />
        <StatCard label="Sắp hết hạn" value={stats.expiring} icon={CalendarClock} tone="amber" />
        <StatCard label="Đã gia hạn" value={stats.renewed} icon={RefreshCcw} tone="slate" />
        <StatCard label="Cần thu hồi" value={stats.revoke} icon={ShieldAlert} tone="red" />
      </section>

      <section className="admin-panel p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_180px_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filterState.q ?? ""}
              onChange={(event) => setFilterState((current) => ({ ...current, q: event.target.value }))}
              placeholder="Tìm Serial CTS, email, thiết bị..."
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
          <Input
            type="date"
            value={filterState.hieuLucFrom ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, hieuLucFrom: event.target.value }))
            }
            aria-label="Hết hạn từ ngày"
          />
          <Input
            type="date"
            value={filterState.hieuLucTo ?? ""}
            onChange={(event) =>
              setFilterState((current) => ({ ...current, hieuLucTo: event.target.value }))
            }
            aria-label="Hết hạn đến ngày"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => applyFilters(filterState)}>
              Áp dụng
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setFilterState({ trangThai: "all" });
                setPage(1);
                router.push("/dashboard/chung-thu-so");
              }}
              aria-label="Đặt lại"
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Bộ lọc thời hạn áp dụng theo “Ngày hết hiệu lực”.
        </p>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-600">Hiển thị {rows.length} serial CTS</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <FileText className="size-4" />
            File mẫu Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => { closeOverlayPanels(); setImportOpen(true); }}>
            <Upload className="size-4" />
            Import Excel
          </Button>
          <Button type="button" variant="outline" onClick={exportActiveDocx}>
            <FileUp className="size-4" />
            Xuất danh sách CTS đang sử dụng
          </Button>
        </div>
      </div>

      {message ? (
        <p
          ref={messageRef}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {message}
        </p>
      ) : null}

      <section className="admin-panel overflow-hidden">
        {pageRows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1500px]">
              <thead>
                <tr>
                  <th className="w-12">STT</th>
                  <th>Serial CTS</th>
                  <th>Mã thiết bị</th>
                  <th>Tên CTS</th>
                  <th>Email</th>
                  <th>Loại CTS</th>
                  <th>Tổ chức</th>
                  <th>Người sử dụng</th>
                  <th>Hiệu lực</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={`${row.thiet_bi_chung_thu_so_id}-${row.thiet_bi_id}`}>
                    <td className="text-slate-500">{baseIndex + index + 1}</td>
                    <td className="font-medium text-slate-950">
                      <button
                        type="button"
                        className="text-left font-semibold text-primary hover:underline"
                        onClick={() => openDetail(row)}
                      >
                        {display(row.so_hieu_chung_thu_so)}
                      </button>
                    </td>
                    <td>
                      {row.thiet_bi_id ? (
                        <Link
                          href={`/dashboard/thiet-bi/${row.thiet_bi_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {display(row.so_hieu_thiet_bi)}
                        </Link>
                      ) : (
                        display(row.so_hieu_thiet_bi)
                      )}
                    </td>
                    <td>{display(row.ten_chung_thu_so)}</td>
                    <td>{display(row.email)}</td>
                    <td>{display(row.loai_chung_thu_so ?? row.loai_thiet_bi)}</td>
                    <td>{display(row.to_chuc)}</td>
                    <td>{display(row.nguoi_su_dung)}</td>
                    <td>
                      <div className="space-y-1">
                        <p>{formatDate(row.ngay_hieu_luc)}</p>
                        <p className="text-xs text-slate-500">đến {formatDate(row.ngay_het_hieu_luc)}</p>
                      </div>
                    </td>
                    <td>
                      <CertificateStatusBadge status={row.trang_thai} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openRenew(row)}
                          disabled={
                            row.trang_thai === "da_thu_hoi" ||
                            row.trang_thai === "da_gia_han"
                          }
                        >
                          <RefreshCcw className="size-4" />
                          Gia hạn
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openChangeInfo(row)}
                          disabled={
                            row.trang_thai === "da_thu_hoi"
                          }
                        >
                          <FilePenLine className="size-4" />
                          Đổi thông tin
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            closeOverlayPanels();
                            setRevokeMessage(null);
                            setRevokeTarget(row);
                            setRevokeAt(new Date().toISOString().slice(0, 16));
                          }}
                          disabled={row.trang_thai === "da_thu_hoi"}
                        >
                          <ShieldAlert className="size-4" />
                          Thu hồi
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            closeOverlayPanels();
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
              title="Chưa có serial CTS phù hợp"
              description="Thử đặt lại bộ lọc hoặc thêm CTS mới qua trang chi tiết thiết bị Token/Sim."
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
        title={dialogMode === "gia_han" ? "Gia hạn CTS" : "Đổi thông tin CTS"}
        description={
          dialogMode === "gia_han"
            ? "Gia hạn sẽ tạo serial mới gắn với CTS gốc."
            : "Cập nhật hồ sơ hiện hành; ngày hiệu lực và Serial giữ nguyên trừ khi cần điều chỉnh."
        }
        onClose={() => setDialogOpen(false)}
        className="max-w-4xl"
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
            <Select value={String(form.nguoi_su_dung_id ?? "")} onChange={(e) => selectStaff(e.target.value)}>
              <option value="">Chọn người sử dụng</option>
              {lookups.staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ho_ten}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Serial CTS" required>
            <Input
              value={String(form.so_hieu_chung_thu_so ?? "")}
              onChange={(e) => setField("so_hieu_chung_thu_so", e.target.value)}
              placeholder="Nhập serial CTS"
              disabled={dialogMode === "thay_doi_thong_tin"}
            />
          </Field>
          <Field label="Tên CTS">
            <Input
              value={String(form.ten_chung_thu_so ?? "")}
              onChange={(e) => setField("ten_chung_thu_so", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <Input type="email" value={String(form.email ?? "")} onChange={(e) => setField("email", e.target.value)} />
          </Field>
          <Field label="Loại CTS">
            <Select
              value={String(form.loai_chung_thu_so ?? "")}
              onChange={(e) => setField("loai_chung_thu_so", e.target.value)}
            >
              <option value="">Chưa chọn</option>
              <option value="Token">Token</option>
              <option value="SIM ký số">SIM ký số</option>
              <option value="Token mật">Token mật</option>
            </Select>
          </Field>
          <Field label="Tổ chức">
            <Input value={String(form.to_chuc ?? "")} onChange={(e) => setField("to_chuc", e.target.value)} />
          </Field>
          <Field label="ID chứng thư nguồn">
            <Input
              value={String(form.id_chung_thu_so_nguon ?? "")}
              onChange={(e) => setField("id_chung_thu_so_nguon", e.target.value)}
            />
          </Field>
          {dialogMode === "thay_doi_thong_tin" ? (
            <Field label="Thời gian thực hiện đổi thông tin">
              <Input
                type="date"
                value={String(form.han_gia_han_lan_dau ?? "")}
                onChange={(e) => setField("han_gia_han_lan_dau", e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Ngày hiệu lực" required>
                <Input
                  type="date"
                  value={String(form.ngay_hieu_luc ?? "")}
                  onChange={(e) => setField("ngay_hieu_luc", e.target.value)}
                />
              </Field>
              <Field label="Ngày hết hiệu lực" required>
                <Input
                  type="date"
                  value={String(form.ngay_het_hieu_luc ?? "")}
                  onChange={(e) => setField("ngay_het_hieu_luc", e.target.value)}
                />
              </Field>
              <Field label="Hạn gia hạn lần đầu">
                <Input
                  type="date"
                  value={String(form.han_gia_han_lan_dau ?? "")}
                  onChange={(e) => setField("han_gia_han_lan_dau", e.target.value)}
                />
              </Field>
            </>
          )}
          <Field label="Thông tin chung" className="md:col-span-2">
            <Input
              value={String(form.thong_tin_chung ?? "")}
              onChange={(e) => setField("thong_tin_chung", e.target.value)}
              placeholder="Chức vụ, đơn vị, ghi chú kỹ thuật..."
            />
          </Field>
          {dialogMode === "thay_doi_thong_tin" ? (
            <Field label="Nội dung thay đổi" className="md:col-span-2">
              <Input
                value={String(form.noi_dung_thay_doi ?? "")}
                onChange={(e) => setField("noi_dung_thay_doi", e.target.value)}
                placeholder="Email, chức vụ, tổ chức..."
              />
            </Field>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu CTS"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        title="Import Excel CTS"
        description="Tải file mẫu, điền dữ liệu rồi import. Chỉ các dòng khớp mã thiết bị và người sử dụng mới được đánh dấu sẵn sàng import."
        onClose={() => setImportOpen(false)}
        className="max-w-5xl"
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
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                onChange={(event) => handleImportFile(event.target.files?.[0] ?? null)}
              />
            </Label>
            <Button type="button" variant="outline" onClick={() => setImportRows([])}>
              Xóa preview
            </Button>
          </div>
          {importMessage ? <p className="text-sm text-slate-600">{importMessage}</p> : null}
          {importRows.length ? (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[1400px]">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Mã thiết bị</th>
                    <th>Serial CTS</th>
                    <th>Tên CTS</th>
                    <th>Email</th>
                    <th>Người sử dụng</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row) => (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td>{display(row.deviceCode)}</td>
                      <td>{display(row.serial)}</td>
                      <td>{display(String(row.payload.ten_chung_thu_so ?? ""))}</td>
                      <td>{display(String(row.payload.email ?? ""))}</td>
                      <td>{display(row.staffName)}</td>
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
            <EmptyState title="Chưa có dữ liệu preview" description="Tải file Excel CTS để xem dữ liệu trước khi import." />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Đóng
            </Button>
            <Button type="button" onClick={commitImport} disabled={isPending || !importRows.length}>
              Ghi dữ liệu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailTarget)}
        title={`Chi tiết CTS ${detailTarget?.so_hieu_chung_thu_so ?? ""}`}
        description="Lịch sử serial theo cùng mã thiết bị."
        onClose={() => setDetailTarget(null)}
        className="max-w-5xl"
      >
        {detailTarget ? (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2">
              <Info label="Thiết bị" value={display(detailTarget.so_hieu_thiet_bi)} />
              <Info label="Tên CTS" value={display(detailTarget.ten_chung_thu_so)} />
              <Info label="Email" value={display(detailTarget.email)} />
              <Info label="Tổ chức" value={display(detailTarget.to_chuc)} />
              <Info label="Loại" value={display(detailTarget.loai_chung_thu_so ?? detailTarget.loai_thiet_bi)} />
              <Info label="Trạng thái" value={<CertificateStatusBadge status={detailTarget.trang_thai} />} />
            </section>
            <section className="rounded-md border border-border">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-heading text-base font-semibold text-slate-950">Các serial trên cùng thiết bị</h3>
              </div>
              <div className="divide-y divide-border">
                {currentDeviceRecords.map((record) => (
                  <div key={record.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{record.so_hieu_chung_thu_so}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDate(record.ngay_hieu_luc)} đến {formatDate(record.ngay_het_hieu_luc)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.da_gia_han ? "Đã gia hạn" : "Chưa gia hạn"} ·{" "}
                          {record.la_hien_hanh ? "Hiện hành" : "Đã thay thế"}
                        </p>
                      </div>
                      <CertificateStatusBadge
                        status={
                          record.la_hien_hanh
                            ? detailTarget.trang_thai
                            : record.da_gia_han
                              ? "da_gia_han"
                              : "het_han"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-md border border-border">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-heading text-base font-semibold text-slate-950">Timeline sự kiện</h3>
              </div>
              {currentDetailHistory.length ? (
                <div className="overflow-x-auto">
                  <table className="admin-table min-w-[960px]">
                    <thead>
                      <tr>
                        <th>Thời điểm</th>
                        <th>Sự kiện</th>
                        <th>Serial cũ</th>
                        <th>Serial mới</th>
                        <th>Thay đổi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDetailHistory.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.thoi_diem_su_kien)}</td>
                          <td>{row.loai_su_kien}</td>
                          <td>{display(row.so_hieu_chung_thu_so_truoc)}</td>
                          <td>{display(row.so_hieu_chung_thu_so_sau)}</td>
                          <td>{display(row.noi_dung_thay_doi ?? row.ly_do_thu_hoi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <EmptyState title="Chưa có timeline" description="Sự kiện sẽ hiện khi gia hạn, đổi thông tin hoặc thu hồi." />
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Xác nhận thu hồi CTS"
        description={`Bạn có chắc muốn ghi nhận thu hồi CTS ${revokeTarget?.so_hieu_chung_thu_so ?? "này"}?`}
        confirmLabel="Thu hồi CTS"
        pending={isPending}
        onCancel={() => {
          setRevokeTarget(null);
          setRevokeReason("");
          setRevokeAt("");
          setRevokeMessage(null);
        }}
        onConfirm={revokeSelected}
      >
        {revokeMessage ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {revokeMessage}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3">
          <div>
            <Label>Thời gian thu hồi</Label>
            <Input
              type="datetime-local"
              value={revokeAt}
              onChange={(e) => setRevokeAt(e.target.value)}
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-slate-500">
              Bỏ trống nếu muốn dùng thời điểm hiện tại của hệ thống.
            </p>
          </div>
          <div>
            <Label>Lý do thu hồi</Label>
            <Input
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Hết hạn, thay thiết bị, điều chuyển..."
              className="mt-1.5"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa CTS"
        description={`Bạn có chắc muốn xóa CTS ${deleteTarget?.so_hieu_chung_thu_so ?? "này"}? Thao tác có thể bị từ chối nếu còn lịch sử liên quan.`}
        confirmLabel="Xóa CTS"
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

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-700">{value}</div>
    </div>
  );
}
