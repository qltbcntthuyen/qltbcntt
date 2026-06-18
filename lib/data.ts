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
export type CertificateDocumentConfig = Tables<"cau_hinh_van_ban_chung_thu_so">;

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
  computerConfigs: ComputerConfig[];
};

export type DeviceListItem = Device & {
  loai_thiet_bi: DeviceType | null;
  hang_model: Model | null;
  phong_ban: Department | null;
  nguoi_su_dung: Staff | null;
  nguon_goc: Source | null;
  tinh_trang: DeviceStatus | null;
  chung_thu: CertificateReportRow | null;
  cau_hinh: ComputerConfig | null;
};

export type HandoverItem = Handover & {
  thiet_bi: Device | null;
  nguoi_nhan: Staff | null;
  phong_ban_nhan: Department | null;
};

export type MaintenanceItem = Maintenance & {
  thiet_bi: Device | null;
  nguoi_su_dung: Staff | null;
};

export type StaffItem = Staff & {
  phong_ban: Department | null;
  assignedDevices: DeviceListItem[];
  certificates: CertificateReportRow[];
  thiet_bi_count: number;
  chung_thu_count: number;
  co_tai_khoan: boolean;
};

export type DepartmentItem = Department & {
  nhan_su_count: number;
  thiet_bi_count: number;
  chung_thu_count: number;
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
    unassignedDevices: number;
    expiringCertificates: number;
    renewalCertificates: number;
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
    computerConfigs,
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
    supabase.from("cau_hinh_may_tinh").select("*"),
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
    computerConfigs: computerConfigs.data ?? [],
  };
}

export async function getDepartments(): Promise<DepartmentItem[]> {
  if (!(await hasAdminAccess())) return [];

  const supabase = await createClient();
  const [departmentsResult, staffResult, devicesResult, certificatesResult] = await Promise.all([
    supabase.from("phong_ban").select("*").order("ten_phong_ban"),
    supabase.from("nguoi_dung").select("id, phong_ban_id").order("id"),
    supabase.from("thiet_bi").select("id, phong_ban_id").order("id"),
    supabase.from("v_bao_cao_chung_thu_so").select("phong_ban_id"),
  ]);

  const staffByDepartment = new Map<number, number>();
  const devicesByDepartment = new Map<number, number>();
  const certificatesByDepartment = new Map<number, number>();

  for (const row of staffResult.data ?? []) {
    if (row.phong_ban_id == null) continue;
    staffByDepartment.set(row.phong_ban_id, (staffByDepartment.get(row.phong_ban_id) ?? 0) + 1);
  }

  for (const row of devicesResult.data ?? []) {
    if (row.phong_ban_id == null) continue;
    devicesByDepartment.set(row.phong_ban_id, (devicesByDepartment.get(row.phong_ban_id) ?? 0) + 1);
  }

  for (const row of certificatesResult.data ?? []) {
    if (row.phong_ban_id == null) continue;
    certificatesByDepartment.set(
      row.phong_ban_id,
      (certificatesByDepartment.get(row.phong_ban_id) ?? 0) + 1
    );
  }

  return (departmentsResult.data ?? []).map((department) => ({
    ...department,
    nhan_su_count: staffByDepartment.get(department.id) ?? 0,
    thiet_bi_count: devicesByDepartment.get(department.id) ?? 0,
    chung_thu_count: certificatesByDepartment.get(department.id) ?? 0,
  }));
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!(await hasAdminAccess())) {
    return {
      metrics: {
        totalDevices: 0,
        activeDevices: 0,
        unassignedDevices: 0,
        expiringCertificates: 0,
        renewalCertificates: 0,
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
  const unassignedDevices = lookups.devices.filter((device) => !device.nguoi_su_dung_id).length;

  const certificateRows = certificates.data ?? [];
  const maintenanceRows = maintenance.data ?? [];
  const renewalStatuses = ["het_han"];
  const actionStatuses = ["sap_het_han", "het_han", "can_thu_hoi"];

  return {
    metrics: {
      totalDevices: lookups.devices.length,
      activeDevices,
      unassignedDevices,
      expiringCertificates: certificateRows.filter(
        (row) => row.trang_thai === "sap_het_han"
      ).length,
      renewalCertificates: certificateRows.filter(
        (row) => renewalStatuses.includes(row.trang_thai ?? "")
      ).length,
      revokeCertificates: certificateRows.filter(
        (row) => row.trang_thai === "can_thu_hoi"
      ).length,
      trackedMaintenance: maintenanceRows.filter(
        (row) => !row.ngay_sua_chua || !row.ket_qua_xu_ly
      ).length,
    },
    recentCertificates: certificateRows
      .filter((row) => actionStatuses.includes(row.trang_thai ?? ""))
      .slice(0, 8),
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
  dapUngCds?: string;
  thietBiMat?: string;
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
      if (filters.phongBan && Number(row.phong_ban_id) !== Number(filters.phongBan)) return false;
      if (filters.tinhTrang && row.tinh_trang_id !== Number(filters.tinhTrang)) return false;
      if (filters.nguoiDung === "none" && row.nguoi_su_dung_id != null) return false;
      if (
        filters.nguoiDung &&
        filters.nguoiDung !== "none" &&
        row.nguoi_su_dung_id !== Number(filters.nguoiDung)
      ) {
        return false;
      }
      if (
        filters.chungThu &&
        filters.chungThu !== "all" &&
        row.chung_thu?.trang_thai !== filters.chungThu
      ) {
        return false;
      }
      if (filters.dapUngCds === "yes" && !row.dap_ung_cds) return false;
      if (filters.dapUngCds === "no" && row.dap_ung_cds) return false;
      if (filters.thietBiMat === "yes" && !row.thiet_bi_mat) return false;
      if (filters.thietBiMat === "no" && row.thiet_bi_mat) return false;
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
    supabase
      .from("thiet_bi_chung_thu_so")
      .select("*")
      .eq("thiet_bi_id", id)
      .order("la_hien_hanh", { ascending: false })
      .order("ngay_hieu_luc", { ascending: false }),
    supabase
      .from("v_bao_cao_chung_thu_so")
      .select("*")
      .eq("thiet_bi_id", id)
      .order("la_hien_hanh", { ascending: false })
      .order("ngay_hieu_luc", { ascending: false }),
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
    certificate: ((certificates.data ?? []) as Certificate[]).find(
      (row) => row.la_hien_hanh && !row.thoi_diem_thu_hoi
    ) ?? null,
    certificates: (certificates.data ?? []) as Certificate[],
    certificateReport: selectCurrentCertificate(certificateRows.data ?? []),
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
  hieuLucFrom?: string;
  hieuLucTo?: string;
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
  const fromDate = filters.hieuLucFrom ? new Date(filters.hieuLucFrom) : null;
  const toDate = filters.hieuLucTo ? new Date(filters.hieuLucTo) : null;
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
    if (fromDate || toDate) {
      const expiresAt = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
      if (!expiresAt) return false;
      if (fromDate && expiresAt < fromDate) return false;
      if (toDate && expiresAt > toDate) return false;
    }
    return includesTerm(term, [
      row.so_hieu_chung_thu_so,
      row.ten_chung_thu_so,
      row.email,
      row.loai_chung_thu_so,
      row.to_chuc,
      row.thong_tin_chung,
      row.id_chung_thu_so_nguon,
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
  const { data } = await supabase
    .from("thiet_bi_chung_thu_so")
    .select("*")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getCertificateHistoryRecords() {
  if (!(await hasAdminAccess())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("lich_su_chung_thu_so")
    .select("*")
    .order("thoi_diem_su_kien", { ascending: false });
  return data ?? [];
}

export async function getPersonnel(filters: {
  q?: string;
  phongBan?: string;
  vaiTro?: string;
  trangThai?: string;
  taiKhoan?: string;
}): Promise<{ rows: StaffItem[]; lookups: LookupData }> {
  if (!(await hasAdminAccess())) return { rows: [], lookups: emptyLookups() };

  const [lookups, supabase] = await Promise.all([getLookups(), createClient()]);
  const [{ data }, certificatesResult] = await Promise.all([
    supabase.from("nguoi_dung").select("*").order("ho_ten"),
    supabase.from("v_bao_cao_chung_thu_so").select("*"),
  ]);
  const departmentMap = byId(lookups.departments);
  const term = normalizeText(filters.q);
  const certificateRows = (certificatesResult.data ?? []) as CertificateReportRow[];
  const enrichedDevices = enrichDevices(lookups.devices, lookups, certificateRows);
  const devicesByStaff = new Map<number, DeviceListItem[]>();
  const certificatesByStaff = new Map<number, CertificateReportRow[]>();

  for (const device of enrichedDevices) {
    if (device.nguoi_su_dung_id == null) continue;
    const current = devicesByStaff.get(device.nguoi_su_dung_id) ?? [];
    current.push(device);
    devicesByStaff.set(device.nguoi_su_dung_id, current);
  }

  for (const certificate of certificateRows) {
    if (certificate.nguoi_su_dung_id == null) continue;
    const current = certificatesByStaff.get(certificate.nguoi_su_dung_id) ?? [];
    current.push(certificate);
    certificatesByStaff.set(certificate.nguoi_su_dung_id, current);
  }

  const rows = (data ?? [])
    .map((row) => {
      const assignedDevices = devicesByStaff.get(row.id) ?? [];
      const certificates = certificatesByStaff.get(row.id) ?? [];
      return {
        ...row,
        phong_ban: departmentMap.get(row.phong_ban_id ?? -1) ?? null,
        assignedDevices,
        certificates,
        thiet_bi_count: assignedDevices.length,
        chung_thu_count: certificates.length,
        co_tai_khoan: Boolean(row.auth_user_id),
      };
    })
    .filter((row) => {
      if (filters.phongBan && Number(row.phong_ban_id) !== Number(filters.phongBan)) return false;
      if (filters.vaiTro && row.vai_tro !== filters.vaiTro) return false;
      if (filters.trangThai === "active" && !row.trang_thai) return false;
      if (filters.trangThai === "inactive" && row.trang_thai) return false;
      if (filters.taiKhoan === "with_account" && !row.co_tai_khoan) return false;
      if (filters.taiKhoan === "without_account" && row.co_tai_khoan) return false;
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

  const filtered = rows.filter((row) => {
    const expiresAt = row.ngay_het_hieu_luc ? new Date(row.ngay_het_hieu_luc) : null;
    if (filters.from && expiresAt && expiresAt < new Date(filters.from)) return false;
    if (filters.to && expiresAt && expiresAt > new Date(filters.to)) return false;
    return true;
  });

  return {
    rows: filtered,
    lookups,
    summary: {
      revoke: filtered.filter((row) => row.trang_thai === "can_thu_hoi").length,
      renew: filtered.filter((row) => row.trang_thai === "het_han").length,
      renewed: filtered.filter((row) => row.trang_thai === "da_gia_han").length,
      expiring: filtered.filter((row) => row.trang_thai === "sap_het_han").length,
      active: filtered.filter((row) => row.trang_thai === "dang_hieu_luc").length,
    },
  };
}

export async function getSystemConfigValue<T = unknown>(key: string): Promise<T | null> {
  if (!(await hasAdminAccess())) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("he_thong_cau_hinh")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (!data) return null;
  return data.value as T;
}

export async function getExpiryThresholdDays(): Promise<number> {
  const value = await getSystemConfigValue<number>("cts_canh_bao_so_ngay");
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return 30;
}

export async function getNextPersonnelCode(): Promise<string> {
  if (!(await hasAdminAccess())) return "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("gen_ma_nhan_su");
  if (error || !data) {
    return "";
  }
  return String(data);
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
  const valid = kind === "phong_ban" || CATALOG_OPTIONS.some((option) => option.value === kind);
  const selected = valid ? kind : "loai_thiet_bi";

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
  const configMap = new Map<number, ComputerConfig>();
  for (const config of lookups.computerConfigs) {
    configMap.set(config.thiet_bi_id, config);
  }
  const certificateMap = new Map<number, CertificateReportRow>();
  const groupedCertificates = new Map<number, CertificateReportRow[]>();

  for (const row of certificates) {
    if (row.thiet_bi_id == null) continue;
    const current = groupedCertificates.get(row.thiet_bi_id) ?? [];
    current.push(row);
    groupedCertificates.set(row.thiet_bi_id, current);
  }

  for (const [deviceId, rows] of groupedCertificates) {
    const selected = selectCurrentCertificate(rows);
    if (selected) certificateMap.set(deviceId, selected);
  }

  return devices.map((device) => ({
    ...device,
    loai_thiet_bi: typeMap.get(device.loai_thiet_bi_id) ?? null,
    hang_model: modelMap.get(device.hang_model_id ?? -1) ?? null,
    phong_ban: departmentMap.get(device.phong_ban_id ?? -1) ?? null,
    nguoi_su_dung: staffMap.get(device.nguoi_su_dung_id ?? -1) ?? null,
    nguon_goc: sourceMap.get(device.nguon_goc_id ?? -1) ?? null,
    tinh_trang: statusMap.get(device.tinh_trang_id ?? -1) ?? null,
    chung_thu: certificateMap.get(device.id) ?? null,
    cau_hinh: configMap.get(device.id) ?? null,
  }));
}

function selectCurrentCertificate(rows: CertificateReportRow[]) {
  return (
    rows.find((row) => row.la_hien_hanh && !row.thoi_diem_thu_hoi) ??
    rows.find((row) => row.la_hien_hanh) ??
    [...rows].sort((a, b) =>
      String(b.ngay_hieu_luc ?? "").localeCompare(String(a.ngay_hieu_luc ?? ""))
    )[0] ??
    null
  );
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
  const staffMap = byId(lookups.staff);
  return rows.map((row) => {
    const device = deviceMap.get(row.thiet_bi_id) ?? null;
    return {
      ...row,
      thiet_bi: device,
      nguoi_su_dung: device?.nguoi_su_dung_id != null ? staffMap.get(device.nguoi_su_dung_id) ?? null : null,
    };
  });
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
    computerConfigs: [],
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
