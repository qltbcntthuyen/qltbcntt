import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  HardDrive,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import { PageHeader, StatCard } from "@/components/common/page";
import { CertificateReportClient } from "@/components/features/certificate-report-client";
import {
  GeneralReportClient,
  type GeneralReportColumn,
  type GeneralReportRow,
} from "@/components/features/general-report-client";
import { buttonVariants } from "@/components/ui/button";
import { getDevices, getOperations, getReportRows } from "@/lib/data";
import { CERTIFICATE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { display, formatCurrency, formatDate } from "@/lib/format";

const reportTabs = [
  { value: "thiet-bi", label: "Báo cáo thiết bị" },
  { value: "chung-thu-so", label: "Báo cáo chứng thư số" },
  { value: "ban-giao", label: "Báo cáo bàn giao" },
  { value: "bao-tri", label: "Báo cáo bảo trì" },
];

type ReportTab = (typeof reportTabs)[number]["value"];

function normalizeTab(value?: string): ReportTab {
  return reportTabs.some((tab) => tab.value === value)
    ? (value as ReportTab)
    : "thiet-bi";
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const activeTab = normalizeTab(params.nhom);

  return (
    <>
      <PageHeader title="Báo cáo" />

      <nav className="mb-5 flex flex-wrap gap-2">
        {reportTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/bao-cao?nhom=${tab.value}`}
            className={cn(
              buttonVariants({
                variant: activeTab === tab.value ? "default" : "outline",
                size: "sm",
              })
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "chung-thu-so" ? (
        <CertificateReportSection params={params} />
      ) : activeTab === "thiet-bi" ? (
        <DeviceReportSection />
      ) : activeTab === "ban-giao" ? (
        <HandoverReportSection />
      ) : (
        <MaintenanceReportSection />
      )}
    </>
  );
}

async function CertificateReportSection({ params }: { params: Record<string, string | undefined> }) {
  const { rows, lookups, summary } = await getReportRows({
    q: params.q,
    report: params.report ?? "month",
    phongBan: params.phongBan,
    trangThai: params.trangThai,
    from: params.from,
    to: params.to,
  });

  return (
    <>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Hết hạn tháng này" value={summary.month} icon={CalendarClock} tone="amber" />
        <StatCard label="Hết hạn quý này" value={summary.quarter} icon={CalendarDays} tone="blue" />
        <StatCard label="Hết hạn năm nay" value={summary.year} icon={RotateCcw} tone="slate" />
        <StatCard label="Cần gia hạn" value={summary.renew} icon={RefreshCcw} tone="red" />
        <StatCard label="Cần thu hồi" value={summary.revoke} icon={ShieldAlert} tone="red" />
        <StatCard label="Đang hiệu lực" value={summary.active} icon={BadgeCheck} tone="green" />
      </section>

      <CertificateReportClient
        rows={rows}
        lookups={lookups}
        filters={{
          q: params.q,
          report: params.report ?? "month",
          phongBan: params.phongBan,
          trangThai: params.trangThai,
          from: params.from,
          to: params.to,
        }}
      />
    </>
  );
}

async function DeviceReportSection() {
  const { rows } = await getDevices({});
  const columns: GeneralReportColumn[] = [
    { key: "ma_thiet_bi", label: "Mã thiết bị" },
    { key: "ten_thiet_bi", label: "Tên thiết bị" },
    { key: "loai", label: "Loại" },
    { key: "phong_ban", label: "Phòng ban" },
    { key: "nguoi_su_dung", label: "Người sử dụng" },
    { key: "tinh_trang", label: "Tình trạng" },
    { key: "chung_thu", label: "Chứng thư số" },
    { key: "serial", label: "Serial" },
    { key: "nam_trang_bi", label: "Năm trang bị" },
  ];
  const reportRows: GeneralReportRow[] = rows.map((row) => ({
    id: row.id,
    thiet_bi_id: row.id,
    ma_thiet_bi: row.ma_thiet_bi,
    ten_thiet_bi: row.ten_thiet_bi,
    loai: display(row.loai_thiet_bi?.ten_loai),
    phong_ban: display(row.phong_ban?.ten_phong_ban),
    nguoi_su_dung: display(row.nguoi_su_dung?.ho_ten),
    tinh_trang: display(row.tinh_trang?.ten_tinh_trang),
    chung_thu: row.chung_thu?.trang_thai
      ? CERTIFICATE_STATUS_LABELS[row.chung_thu.trang_thai] ?? row.chung_thu.trang_thai
      : "Chưa có",
    serial: display(row.serial),
    nam_trang_bi: display(row.nam_trang_bi),
  }));

  return (
    <>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng thiết bị" value={rows.length} icon={HardDrive} tone="blue" />
        <StatCard
          label="Đã phân công"
          value={rows.filter((row) => row.nguoi_su_dung_id != null).length}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard
          label="Chưa phân công"
          value={rows.filter((row) => row.nguoi_su_dung_id == null).length}
          icon={ShieldAlert}
          tone="amber"
        />
        <StatCard
          label="Có chứng thư số"
          value={rows.filter((row) => row.chung_thu).length}
          icon={RefreshCcw}
          tone="slate"
        />
      </section>
      <GeneralReportClient rows={reportRows} columns={columns} fileName="bao-cao-thiet-bi" />
    </>
  );
}

async function HandoverReportSection() {
  const data = await getOperations("ban-giao");
  const columns: GeneralReportColumn[] = [
    { key: "ngay_ban_giao", label: "Ngày bàn giao" },
    { key: "ma_thiet_bi", label: "Mã thiết bị" },
    { key: "ten_thiet_bi", label: "Tên thiết bị" },
    { key: "nguoi_nhan", label: "Người nhận" },
    { key: "phong_ban_nhan", label: "Phòng ban nhận" },
    { key: "hinh_thuc", label: "Hình thức" },
    { key: "ngay_thu_hoi", label: "Ngày thu hồi" },
    { key: "noi_dung", label: "Nội dung" },
  ];
  const rows: GeneralReportRow[] = data.handovers.map((row) => ({
    id: row.id,
    thiet_bi_id: row.thiet_bi_id,
    ngay_ban_giao: formatDate(row.ngay_ban_giao),
    ma_thiet_bi: row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id,
    ten_thiet_bi: display(row.thiet_bi?.ten_thiet_bi),
    nguoi_nhan: display(row.nguoi_nhan?.ho_ten),
    phong_ban_nhan: display(row.phong_ban_nhan?.ten_phong_ban),
    hinh_thuc: display(row.hinh_thuc),
    ngay_thu_hoi: formatDate(row.ngay_thu_hoi),
    noi_dung: display(row.noi_dung),
  }));

  return <GeneralReportClient rows={rows} columns={columns} fileName="bao-cao-ban-giao" />;
}

async function MaintenanceReportSection() {
  const data = await getOperations("bao-tri");
  const columns: GeneralReportColumn[] = [
    { key: "ngay_ghi_nhan", label: "Ngày ghi nhận" },
    { key: "ma_thiet_bi", label: "Mã thiết bị" },
    { key: "ten_thiet_bi", label: "Tên thiết bị" },
    { key: "loai_xu_ly", label: "Loại xử lý" },
    { key: "mo_ta_loi", label: "Mô tả lỗi" },
    { key: "ngay_sua_chua", label: "Ngày sửa chữa" },
    { key: "ket_qua_xu_ly", label: "Kết quả xử lý" },
    { key: "chi_phi", label: "Chi phí" },
    { key: "don_vi_sua_chua", label: "Đơn vị sửa chữa" },
  ];
  const rows: GeneralReportRow[] = data.maintenance.map((row) => ({
    id: row.id,
    thiet_bi_id: row.thiet_bi_id,
    ngay_ghi_nhan: formatDate(row.ngay_ghi_nhan),
    ma_thiet_bi: row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id,
    ten_thiet_bi: display(row.thiet_bi?.ten_thiet_bi),
    loai_xu_ly: display(row.loai_xu_ly),
    mo_ta_loi: display(row.mo_ta_loi),
    ngay_sua_chua: formatDate(row.ngay_sua_chua),
    ket_qua_xu_ly: display(row.ket_qua_xu_ly),
    chi_phi: formatCurrency(row.chi_phi),
    don_vi_sua_chua: display(row.don_vi_sua_chua),
  }));

  return <GeneralReportClient rows={rows} columns={columns} fileName="bao-cao-bao-tri" />;
}
