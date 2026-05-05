import {
  Activity,
  BadgeCheck,
  Boxes,
  Building2,
  ClipboardList,
  Gauge,
  HardDrive,
  LibraryBig,
  UsersRound,
  Wrench,
} from "lucide-react";

export const ADMIN_ROLES = ["admin", "it"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: Gauge },
  { href: "/dashboard/thiet-bi", label: "Thiết bị", icon: HardDrive },
  { href: "/dashboard/chung-thu-so", label: "Chứng thư số", icon: BadgeCheck },
  { href: "/dashboard/bao-cao", label: "Báo cáo", icon: ClipboardList },
  { href: "/dashboard/nhan-su", label: "Nhân sự", icon: UsersRound },
  { href: "/dashboard/phong-ban", label: "Phòng ban", icon: Building2 },
  { href: "/dashboard/ban-giao", label: "Bàn giao", icon: Boxes },
  { href: "/dashboard/bao-tri", label: "Bảo trì", icon: Wrench },
  { href: "/dashboard/danh-muc", label: "Danh mục", icon: LibraryBig },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  it: "IT",
  user: "Nhân sự",
};

export const CERTIFICATE_STATUS_LABELS: Record<string, string> = {
  dang_hieu_luc: "Đang hiệu lực",
  sap_het_han: "Sắp hết hạn",
  het_han: "Hết hạn",
  da_gia_han: "Đã gia hạn",
  can_cap_moi: "Cần cấp mới",
  can_thu_hoi: "Cần thu hồi",
  da_thu_hoi: "Đã thu hồi",
  da_thay_the: "Đã thay thế",
};

export const CERTIFICATE_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "dang_hieu_luc", label: "Đang hiệu lực" },
  { value: "sap_het_han", label: "Sắp hết hạn" },
  { value: "het_han", label: "Hết hạn" },
  { value: "da_gia_han", label: "Đã gia hạn" },
  { value: "can_cap_moi", label: "Cần cấp mới" },
  { value: "can_thu_hoi", label: "Cần thu hồi" },
  { value: "da_thu_hoi", label: "Đã thu hồi" },
  { value: "da_thay_the", label: "Đã thay thế" },
];

export const CATALOG_OPTIONS = [
  {
    value: "loai_thiet_bi",
    label: "Loại thiết bị",
    description: "Máy tính, máy in, token, sim PKI...",
    icon: HardDrive,
  },
  {
    value: "hang_model",
    label: "Hãng/model",
    description: "Nhà sản xuất và model thiết bị",
    icon: Boxes,
  },
  {
    value: "he_dieu_hanh",
    label: "Hệ điều hành",
    description: "Windows, macOS, Linux và phiên bản",
    icon: Activity,
  },
  {
    value: "phan_mem_diet_virus",
    label: "Phần mềm diệt virus",
    description: "Phần mềm bảo vệ và phiên bản",
    icon: BadgeCheck,
  },
  {
    value: "tinh_trang_thiet_bi",
    label: "Tình trạng thiết bị",
    description: "Đang dùng, trong kho, hỏng, mất...",
    icon: Wrench,
  },
  {
    value: "nguon_goc_tai_san",
    label: "Nguồn gốc tài sản",
    description: "Mua sắm, tài trợ, điều chuyển...",
    icon: LibraryBig,
  },
] as const;

export type CatalogKind = "phong_ban" | (typeof CATALOG_OPTIONS)[number]["value"];
