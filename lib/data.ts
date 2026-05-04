import "server-only";

import { redirect } from "next/navigation";

import { CATALOG_OPTIONS, type CatalogKind } from "@/lib/constants";
import type { Tables, ViewRows } from "@/lib/database.types";
import { normalizeText } from "@/lib/format";
import { getAdminGateState } from "@/lib/auth";
import { createClient } from "@/lib/server";

export type Device = Tables<"thiet_bi">;
export type Department = Tables<"phong_ban">;
export type DeviceType = Tables<"loai_thiet_bi">;
export type Model = Tables<"hang_model">;
export type DeviceStatus = Tables<"tinh_trang_thiet_bi">;
export type Source = Tables<"nguon_goc_tai_san">;
export type Staff = Tables<"nguoi_dung">;
export type OperatingSystem = Tables<"he_dieu_hanh">;
export type Antivirus = Tables<"phan_mem_diet_virus">;
export type ComputerConfig = Tables<"cau_hinh_may_tinh">;
export type Handover = Tables<"lich_su_ban_giao">;
export type Maintenance = Tables<"sua_chua_bao_tri">;
export type Certificate = Tables<"thiet_bi_chung_thu_so">;
export type CertificateHistory = Tables<"lich_su_chung_thu_so">;
export type CertificateReportRow = ViewRows<"v_bao_cao_chung_thu_so">;

export type LookupData = {
  departments: Department[];
  deviceTypes: DeviceType[];
  models: Model[];
  operatingSystems: OperatingSystem[];
  antivirus: Antivirus[];
  statuses: DeviceStatus[];
  sources: Source[];
  staff: Staff[];
  devices: Device[];
};

export type DeviceListItem = Device & {
  loai_thiet_bi: DeviceType | null;
  hang_model: Model | null;
  phong_ban: Department | null;
  nguoi_su_dung: Staff | null;
  nguon_goc: Source | null;
  tinh_trang: DeviceStatus | null;
  chung_thu: CertificateReportRow | null;
};

export type HandoverItem = Handover & {
  thiet_bi: Device | null;
  nguoi_nhan: Staff | null;
  phong_ban_nhan: Department | null;
};

export type MaintenanceItem = Maintenance & {
  thiet_bi: Device | null;
};

export type StaffItem = Staff & {
  phong_ban: Department | null;
};

export type CatalogRow = {
  id: number;
  primary: string;
  secondary: string | null;
  note: string | null;
  raw: Record<string, unknown>;
};

export type DashboardData = {
  metrics: {
    totalDevices: number;
    activeDevices: number;
    expiringCertificates: number;
    revokeCertificates: number;
    trackedMaintenance: number;
  };
  recentCertificates: CertificateReportRow[];
  recentHandovers: HandoverItem[];
  recentMaintenance: MaintenanceItem[];
};

async function hasAdminAccess() {
  const gate = await getAdminGateState();
  if (gate.status === "unauthenticated") {
    redirect("/auth/login");
  }
  return gate.status === "authorized";
}

function byId<T extends { id: number }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function includesTerm(term: string, values: Array<string | number | null | undefined>) {
  if (!term) return true;
  return values.some((value) => normalizeText(String(value ?? "")).includes(term));
}

function sortByText<T>(rows: T[], selector: (row: T) => string | null | undefined) {
  return [...rows].sort((a, b) =>
    (selector(a) ?? "").localeCompare(selector(b) ?? "", "vi")
  );
}

export async function getLookups(): Promise<LookupData> {
  if (!(await hasAdminAccess())) return emptyLookups();

  const supabase = await createClient();
  const [
    departments,
    deviceTypes,
    models,
    operatingSystems,
    antivirus,
    statuses,
    sources,
    staff,
    devices,
  ] = await Promise.all([
    supabase.from("phong_ban").select("*").order("ten_phong_ban"),
    supabase.from("loai_thiet_bi").select("*").order("ten_loai"),
    supabase.from("hang_model").select("*").order("ten_hang"),
    supabase.from("he_dieu_hanh").select("*").order("ten_he_dieu_hanh"),
    supabase.from("phan_mem_diet_virus").select("*").order("ten_phan_mem"),
    supabase.from("tinh_trang_thiet_bi").select("*").order("ten_tinh_trang"),
    supabase.from("nguon_goc_tai_san").select("*").order("ten_nguon_goc"),
    supabase.from("nguoi_dung").select("*").order("ho_ten"),
    supabase.from("thiet_bi").select("*").order("ma_thiet_bi"),
  ]);

  return {
    departments: departments.data ?? [],
    deviceTypes: deviceTypes.data ?? [],
    models: models.data ?? [],
    operatingSystems: operatingSystems.data ?? [],
    antivirus: antivirus.data ?? [],
    statuses: statuses.data ?? [],
    sources: sources.data ?? [],
    staff: staff.data ?? [],
    devices: devices.data ?? [],
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!(await hasAdminAccess())) {
    return {
      metrics: {
        totalDevices: 0,
        activeDevices: 0,
        expiringCertificates: 0,
        revokeCertificates: 0,
        trackedMaintenance: 0,
      },
      recentCertificates: [],
      recentHandovers: [],
      recentMaintenance: [],
    };
  }

  const supabase = await createClient();
  const [lookups, certificates, handovers, maintenance] = await Promise.all([
    getLookups(),
    supabase
      .from("v_bao_cao_chung_thu_so")
      .select("*")
      .order("ngay_het_hieu_luc", { ascending: true }),
    supabase
      .from("lich_su_ban_giao")
      .select("*")
      .order("ngay_ban_giao", { ascending: false })
      .limit(8),
    supabase
      .from("sua_chua_bao_tri")
      .select("*")
      .order("ngay_ghi_nhan", { ascending: false })
      .limit(8),
  ]);

  const statusMap = byId(lookups.statuses);
  const activeDevices = lookups.devices.filter((device) => {
    const status = statusMap.get(device.tinh_trang_id ?? -1);
    const statusText = normalizeText(status?.ten_tinh_trang);
    return (
      statusText.includes("dang su dung") ||
      (!device.thiet_bi_mat && Boolean(device.nguoi_su_dung_id))
    );
  }).length;

  const certificateRows = certificates.data ?? [];
  const maintenanceRows = maintenance.data ?? [];

  return {
    metrics: {
      totalDevices: lookups.devices.length,
      activeDevices,
      expiringCertificates: certificateRows.filter(
        (row) => row.trang_thai === "sap_het_han"
      ).length,
      revokeCertificates: certificateRows.filter(
        (row) => row.trang_thai === "can_thu_hoi"
      ).length,
      trackedMaintenance: maintenanceRows.filter(
        (row) => !row.ngay_sua_chua || !row.ket_qua_xu_ly
      ).length,
    },
    recentCertificates: certificateRows.slice(0, 8),
    recentHandovers: enrichHandovers(handovers.data ?? [], lookups),
    recentMaintenance: enrichMaintenance(maintenanceRows, lookups),
  };
}

export async function getDevices(filters: {
  q?: string;
  loai?: string;
  phongBan?: string;
  tinhTrang?: string;
  nguoiDung?: string;
  chungThu?: string;
}): Promise<{ rows: DeviceListItem[]; lookups: LookupData }> {
  if (!(await hasAdminAccess())) return { rows: [], lookups: emptyLookups() };

  const supabase = await createClient();
  const [lookups, devicesResult, certificatesResult] = await Promise.all([
    getLookups(),
    supabase.from("thiet_bi").select("*").order("id", { ascending: false }),
    supabase.from("v_bao_cao_chung_thu_so").select("*"),
  ]);

  const rows = enrichDevices(devicesResult.data ?? [], lookups, certificatesResult.data ?? []);
  const term = normalizeText(filters.q);

  return {
    lookups,
    rows: rows.filter((row) => {
      if (filters.loai && row.loai_thiet_bi_id !== Number(filters.loai)) return false;
      if (filters.phongBan && row.phong_ban_id !== Number(filters.phongBan)) return false;
      if (filters.tinhTrang && row.tinh_trang_id !== Number(filters.tinhTrang)) return false;
      if (filters.nguoiDung && row.nguoi_su_dung_id !== Number(filters.nguoiDung)) return false;
      if (
        filters.chungThu &&
        filters.chungThu !== "all" &&
        row.chung_thu?.trang_thai !== filters.chungThu
      ) {
        return false;
      }
      return includesTerm(term, [
        row.ma_thiet_bi,
        row.ten_thiet_bi,
        row.serial,
        row.loai_thiet_bi?.ten_loai,
        row.hang_model?.ten_hang,
        row.hang_model?.ten_model,
        row.phong_ban?.ten_phong_ban,
        row.nguoi_su_dung?.ho_ten,
      ]);
    }),
  };
}

export async function getDeviceDetail(id: number) {
  if (!(await hasAdminAccess())) return null;

  const supabase = await createClient();
  const [
    lookups,
    device,
    config,
    handovers,
    maintenance,
    certificates,
    certificateRows,
    history,
  ] = await Promise.all([
    getLookups(),
    supabase.from("thiet_bi").select("*").eq("id", id).maybeSingle(),
    supabase.from("cau_hinh_may_tinh").select("*").eq("thiet_bi_id", id).maybeSingle(),
    supabase
      .from("lich_su_ban_giao")
      .select("*")
      .eq("thiet_bi_id", id)
      .order("ngay_ban_giao", { ascending: false }),
    supabase
      .from("sua_chua_bao_tri")
      .select("*")
      .eq("thiet_bi_id", id)
      .order("ngay_ghi_nhan", { ascending: false }),
    supabase.from("thiet_bi_chung_thu_so").select("*").eq("thiet_bi_id", id).maybeSingle(),
    supabase.from("v_bao_cao_chung_thu_so").select("*").eq("thiet_bi_id", id),
    supabase
      .from("lich_su_chung_thu_so")
      .select("*")
      .eq("thiet_bi_id", id)
      .order("thoi_diem_su_kien", { ascending: false }),
  ]);

  if (!device.data) return null;

  const deviceRow = enrichDevices(
    [device.data],
    lookups,
    certificateRows.data ?? []
  )[0];

  return {
    device: deviceRow,
    config: config.data as ComputerConfig | null,
    certificate: certificates.data as Certificate | null,
    certificateReport: (certificateRows.data ?? [])[0] ?? null,
    certificateHistory: (history.data ?? []) as CertificateHistory[],
    handovers: enrichHandovers(handovers.data ?? [], lookups),
    maintenance: enrichMaintenance(maintenance.data ?? [], lookups),
    lookups,
  };
}

export async function getCertificates(filters: {
  q?: string;
  trangThai?: string;
  phongBan?: string;
}): Promise<{ rows: CertificateReportRow[]; lookups: LookupData }> {
  if (!(await hasAdminAccess())) return { rows: [], lookups: emptyLookups() };

  const supabase = await createClient();
  const [lookups, result] = await Promise.all([
    getLookups(),
    supabase
      .from("v_bao_cao_chung_thu_so")
      .select("*")
      .order("ngay_het_hieu_luc", { ascending: true }),
  ]);

  const term = normalizeText(filters.q);
  const rows = (result.data ?? []).filter((row) => {
    if (
      filters.trangThai &&
      filters.trangThai !== "all" &&
      row.trang_thai !== filters.trangThai
    ) {
      return false;
    }
    if (filters.phongBan && row.phong_ban_id !== Number(filters.phongBan)) {
      return false;
    }
    return includesTerm(term, [
      row.so_hieu_chung_thu_so,
      row.so_hieu_thiet_bi,
      row.ten_thiet_bi,
      row.nguoi_su_dung,
      row.ten_phong_ban,
    ]);
  });

  return { rows, lookups };
}

export async function getCertificateRecords() {
  if (!(await hasAdminAccess())) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("thiet_bi_chung_thu_so").select("*");
  return data ?? [];
}

export async function getPersonnel(filters: {
  q?: string;
  phongBan?: string;
  vaiTro?: string;
  trangThai?: string;
}): Promise<{ rows: StaffItem[]; lookups: LookupData }> {
  if (!(await hasAdminAccess())) return { rows: [], lookups: emptyLookups() };

  const [lookups, supabase] = await Promise.all([getLookups(), createClient()]);
  const { data } = await supabase.from("nguoi_dung").select("*").order("ho_ten");
  const departmentMap = byId(lookups.departments);
  const term = normalizeText(filters.q);

  const rows = (data ?? [])
    .map((row) => ({ ...row, phong_ban: departmentMap.get(row.phong_ban_id ?? -1) ?? null }))
    .filter((row) => {
      if (filters.phongBan && row.phong_ban_id !== Number(filters.phongBan)) return false;
      if (filters.vaiTro && row.vai_tro !== filters.vaiTro) return false;
      if (filters.trangThai === "active" && !row.trang_thai) return false;
      if (filters.trangThai === "inactive" && row.trang_thai) return false;
      return includesTerm(term, [
        row.ho_ten,
        row.ten_dang_nhap,
        row.email,
        row.so_dien_thoai,
        row.phong_ban?.ten_phong_ban,
      ]);
    });

  return { rows, lookups };
}

export async function getReportRows(filters: {
  q?: string;
  report?: string;
  phongBan?: string;
  trangThai?: string;
  from?: string;
  to?: string;
}) {
  const { rows, lookups } = await getCertificates({
    q: filters.q,
    phongBan: filters.phongBan,
    trangThai: filters.trangThai,
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);
  const currentYear = now.getFullYear();

  const filtered = rows.filter((row) => {
    const expiresAt = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
    if (filters.from && expiresAt && expiresAt < new Date(filters.from)) return false;
    if (filters.to && expiresAt && expiresAt > new Date(filters.to)) return false;
    if (filters.report === "month") {
      return expiresAt?.getMonth() === currentMonth && expiresAt.getFullYear() === currentYear;
    }
    if (filters.report === "quarter") {
      return (
        expiresAt &&
        Math.floor(expiresAt.getMonth() / 3) === currentQuarter &&
        expiresAt.getFullYear() === currentYear
      );
    }
    if (filters.report === "year") {
      return expiresAt?.getFullYear() === currentYear;
    }
    if (filters.report === "revoke") return row.trang_thai === "can_thu_hoi";
    if (filters.report === "active") return row.trang_thai === "dang_hieu_luc";
    return true;
  });

  return {
    rows: filtered,
    lookups,
    summary: {
      month: rows.filter((row) => {
        const date = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
        return date?.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length,
      quarter: rows.filter((row) => {
        const date = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
        return (
          date &&
          Math.floor(date.getMonth() / 3) === currentQuarter &&
          date.getFullYear() === currentYear
        );
      }).length,
      year: rows.filter((row) => {
        const date = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
        return date?.getFullYear() === currentYear;
      }).length,
      revoke: rows.filter((row) => row.trang_thai === "can_thu_hoi").length,
      active: rows.filter((row) => row.trang_thai === "dang_hieu_luc").length,
    },
  };
}

export async function getOperations(active: "ban-giao" | "bao-tri") {
  if (!(await hasAdminAccess())) {
    return { active, lookups: emptyLookups(), handovers: [], maintenance: [] };
  }

  const supabase = await createClient();
  const [lookups, handovers, maintenance] = await Promise.all([
    getLookups(),
    supabase
      .from("lich_su_ban_giao")
      .select("*")
      .order("ngay_ban_giao", { ascending: false }),
    supabase
      .from("sua_chua_bao_tri")
      .select("*")
      .order("ngay_ghi_nhan", { ascending: false }),
  ]);

  return {
    active,
    lookups,
    handovers: enrichHandovers(handovers.data ?? [], lookups),
    maintenance: enrichMaintenance(maintenance.data ?? [], lookups),
  };
}

export async function getCatalog(kind: CatalogKind) {
  if (!(await hasAdminAccess())) return { kind, rows: [] as CatalogRow[] };
  const supabase = await createClient();
  const valid = CATALOG_OPTIONS.some((option) => option.value === kind);
  const selected = valid ? kind : "phong_ban";

  switch (selected) {
    case "phong_ban": {
      const { data } = await supabase.from("phong_ban").select("*").order("ten_phong_ban");
      return { kind: selected, rows: (data ?? []).map(catalogDepartmentRow) };
    }
    case "loai_thiet_bi": {
      const { data } = await supabase.from("loai_thiet_bi").select("*").order("ten_loai");
      return { kind: selected, rows: (data ?? []).map(catalogDeviceTypeRow) };
    }
    case "hang_model": {
      const { data } = await supabase.from("hang_model").select("*").order("ten_hang");
      return { kind: selected, rows: (data ?? []).map(catalogModelRow) };
    }
    case "he_dieu_hanh": {
      const { data } = await supabase
        .from("he_dieu_hanh")
        .select("*")
        .order("ten_he_dieu_hanh");
      return { kind: selected, rows: (data ?? []).map(catalogOsRow) };
    }
    case "phan_mem_diet_virus": {
      const { data } = await supabase
        .from("phan_mem_diet_virus")
        .select("*")
        .order("ten_phan_mem");
      return { kind: selected, rows: (data ?? []).map(catalogAntivirusRow) };
    }
    case "tinh_trang_thiet_bi": {
      const { data } = await supabase
        .from("tinh_trang_thiet_bi")
        .select("*")
        .order("ten_tinh_trang");
      return { kind: selected, rows: (data ?? []).map(catalogStatusRow) };
    }
    case "nguon_goc_tai_san": {
      const { data } = await supabase
        .from("nguon_goc_tai_san")
        .select("*")
        .order("ten_nguon_goc");
      return { kind: selected, rows: (data ?? []).map(catalogSourceRow) };
    }
  }
}

function enrichDevices(
  devices: Device[],
  lookups: LookupData,
  certificates: CertificateReportRow[]
): DeviceListItem[] {
  const typeMap = byId(lookups.deviceTypes);
  const modelMap = byId(lookups.models);
  const departmentMap = byId(lookups.departments);
  const staffMap = byId(lookups.staff);
  const sourceMap = byId(lookups.sources);
  const statusMap = byId(lookups.statuses);
  const certificateMap = new Map(
    certificates
      .filter((row) => row.thiet_bi_id != null)
      .map((row) => [row.thiet_bi_id as number, row])
  );

  return devices.map((device) => ({
    ...device,
    loai_thiet_bi: typeMap.get(device.loai_thiet_bi_id) ?? null,
    hang_model: modelMap.get(device.hang_model_id ?? -1) ?? null,
    phong_ban: departmentMap.get(device.phong_ban_id ?? -1) ?? null,
    nguoi_su_dung: staffMap.get(device.nguoi_su_dung_id ?? -1) ?? null,
    nguon_goc: sourceMap.get(device.nguon_goc_id ?? -1) ?? null,
    tinh_trang: statusMap.get(device.tinh_trang_id ?? -1) ?? null,
    chung_thu: certificateMap.get(device.id) ?? null,
  }));
}

function enrichHandovers(rows: Handover[], lookups: LookupData): HandoverItem[] {
  const deviceMap = byId(lookups.devices);
  const staffMap = byId(lookups.staff);
  const departmentMap = byId(lookups.departments);
  return rows.map((row) => ({
    ...row,
    thiet_bi: deviceMap.get(row.thiet_bi_id) ?? null,
    nguoi_nhan: staffMap.get(row.nguoi_nhan_id ?? -1) ?? null,
    phong_ban_nhan: departmentMap.get(row.phong_ban_nhan_id ?? -1) ?? null,
  }));
}

function enrichMaintenance(rows: Maintenance[], lookups: LookupData): MaintenanceItem[] {
  const deviceMap = byId(lookups.devices);
  return rows.map((row) => ({
    ...row,
    thiet_bi: deviceMap.get(row.thiet_bi_id) ?? null,
  }));
}

function emptyLookups(): LookupData {
  return {
    departments: [],
    deviceTypes: [],
    models: [],
    operatingSystems: [],
    antivirus: [],
    statuses: [],
    sources: [],
    staff: [],
    devices: [],
  };
}

function catalogDepartmentRow(row: Department): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_phong_ban,
    secondary: row.ma_phong_ban,
    note: row.ghi_chu,
    raw: row,
  };
}

function catalogDeviceTypeRow(row: DeviceType): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_loai,
    secondary: row.ma_loai,
    note: row.ghi_chu,
    raw: row,
  };
}

function catalogModelRow(row: Model): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_hang,
    secondary: row.ten_model,
    note: row.ghi_chu,
    raw: row,
  };
}

function catalogOsRow(row: OperatingSystem): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_he_dieu_hanh,
    secondary: row.phien_ban,
    note: null,
    raw: row,
  };
}

function catalogAntivirusRow(row: Antivirus): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_phan_mem,
    secondary: row.phien_ban,
    note: null,
    raw: row,
  };
}

function catalogStatusRow(row: DeviceStatus): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_tinh_trang,
    secondary: row.ma_tinh_trang,
    note: row.ghi_chu,
    raw: row,
  };
}

function catalogSourceRow(row: Source): CatalogRow {
  return {
    id: row.id,
    primary: row.ten_nguon_goc,
    secondary: row.ma_nguon_goc,
    note: row.ghi_chu,
    raw: row,
  };
}

export function getSortedStaff(lookups: LookupData) {
  return sortByText(lookups.staff, (row) => row.ho_ten);
}
