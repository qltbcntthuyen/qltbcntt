import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  ClipboardList,
  HardDrive,
  RefreshCcw,
  ShieldAlert,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { CertificateStatusBadge, PageHeader } from "@/components/common/page";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getDashboardData, getExpiryThresholdDays } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const quickActions = [
  { href: "/dashboard/thiet-bi", label: "Thêm thiết bị", icon: HardDrive },
  { href: "/dashboard/nhan-su", label: "Thêm nhân sự", icon: UserPlus },
  { href: "/dashboard/phong-ban", label: "Thêm phòng ban", icon: Building2 },
  { href: "/dashboard/chung-thu-so", label: "Cấp chứng thư", icon: BadgeCheck },
  { href: "/dashboard/ban-giao", label: "Lập bàn giao", icon: ClipboardCheck },
  { href: "/dashboard/bao-tri", label: "Ghi nhận bảo trì", icon: Wrench },
];

export default async function DashboardPage() {
  const data = await getDashboardData();
  const thresholdDays = await getExpiryThresholdDays();
  const issueCount =
    data.metrics.unassignedDevices +
    data.metrics.expiringCertificates +
    data.metrics.renewalCertificates +
    data.metrics.revokeCertificates +
    data.metrics.trackedMaintenance;

  const needs = [
    {
      label: "Thiết bị chưa phân công",
      value: data.metrics.unassignedDevices,
      href: "/dashboard/thiet-bi?nguoiDung=none",
      icon: Building2,
      tone: "slate",
    },
    {
      label: "Chứng thư sắp hết hạn",
      value: data.metrics.expiringCertificates,
      href: "/dashboard/chung-thu-so?trangThai=sap_het_han",
      icon: BadgeCheck,
      tone: "amber",
    },
    {
      label: "Chứng thư hết hạn",
      value: data.metrics.renewalCertificates,
      href: "/dashboard/chung-thu-so?trangThai=het_han",
      icon: RefreshCcw,
      tone: "red",
    },
    {
      label: "Chứng thư cần thu hồi",
      value: data.metrics.revokeCertificates,
      href: "/dashboard/chung-thu-so?trangThai=can_thu_hoi",
      icon: ShieldAlert,
      tone: "red",
    },
    {
      label: "Bảo trì đang theo dõi",
      value: data.metrics.trackedMaintenance,
      href: "/dashboard/bao-tri",
      icon: Wrench,
      tone: "blue",
    },
  ];

  const operationCards = [
    {
      title: "Thiết bị",
      icon: HardDrive,
      href: "/dashboard/thiet-bi",
      value: data.metrics.totalDevices,
      description: `${data.metrics.activeDevices} đang sử dụng, ${data.metrics.unassignedDevices} chưa phân công`,
    },
    {
      title: "Chứng thư số",
      icon: BadgeCheck,
      href: "/dashboard/chung-thu-so",
      value:
        data.metrics.expiringCertificates +
        data.metrics.renewalCertificates +
        data.metrics.revokeCertificates,
      description: "Theo dõi serial, gia hạn, cấp mới và thu hồi",
    },
    {
      title: "Bàn giao",
      icon: ClipboardList,
      href: "/dashboard/ban-giao",
      value: data.recentHandovers.length,
      description: "Biên bản gần đây",
    },
    {
      title: "Bảo trì",
      icon: Wrench,
      href: "/dashboard/bao-tri",
      value: data.metrics.trackedMaintenance,
      description: "Việc đang theo dõi",
    },
  ];

  return (
    <>
      <PageHeader
        title="Tổng quan"
        action={
          <Link href="/dashboard/bao-cao?nhom=thiet-bi" className={buttonVariants({ variant: "outline" })}>
            Xem báo cáo
          </Link>
        }
      />

      {data.metrics.expiringCertificates > 0 ? (
        <Link
          href="/dashboard/chung-thu-so?trangThai=sap_het_han"
          className="mb-5 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition hover:bg-amber-100"
        >
          <ShieldAlert className="size-5 shrink-0 text-amber-600" />
          <span>
            Có <strong>{data.metrics.expiringCertificates}</strong> chứng thư số sẽ hết hạn trong{" "}
            <strong>{thresholdDays}</strong> ngày tới. Nhấn để xem và gia hạn kịp thời.
          </span>
        </Link>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Việc cần xử lý" description={`${issueCount} đầu việc cần kiểm tra trong hệ thống.`}>
          <div className="grid gap-2">
            {needs.map((item) => (
              <NeedRow key={item.label} {...item} />
            ))}
          </div>
        </Panel>

        <Panel title="Thao tác nhanh" description="Các luồng thường dùng.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <Icon className="size-4 text-blue-700" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {operationCards.map((item) => (
          <OperationCard key={item.title} {...item} />
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Chứng thư cần xử lý" bodyClassName="p-0">
          {data.recentCertificates.length ? (
            <div className="divide-y divide-border">
              {data.recentCertificates.map((row) => (
                <Link
                  key={row.thiet_bi_chung_thu_so_id ?? row.so_hieu_chung_thu_so}
                  href="/dashboard/chung-thu-so"
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {row.so_hieu_chung_thu_so ?? "Chưa cập nhật số hiệu"}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-600">
                        {row.nguoi_su_dung ?? "Chưa cập nhật người sử dụng"} · {row.so_hieu_thiet_bi ?? "Chưa có thiết bị"}
                      </p>
                    </div>
                    <CertificateStatusBadge status={row.trang_thai} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Hết hạn: {formatDate(row.ngay_het_hieu_luc)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <CompactEmpty text="Không có chứng thư cần xử lý." />
          )}
        </Panel>

        <Panel title="Bàn giao gần đây" bodyClassName="p-0">
          {data.recentHandovers.length ? (
            <div className="divide-y divide-border">
              {data.recentHandovers.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/thiet-bi/${row.thiet_bi_id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-950">
                    {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id} · {row.thiet_bi?.ten_thiet_bi ?? "Thiết bị"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.nguoi_nhan?.ho_ten ?? "Chưa cập nhật người nhận"} · {formatDate(row.ngay_ban_giao)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <CompactEmpty text="Chưa có bàn giao gần đây." />
          )}
        </Panel>

        <Panel title="Bảo trì gần đây" bodyClassName="p-0">
          {data.recentMaintenance.length ? (
            <div className="divide-y divide-border">
              {data.recentMaintenance.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/thiet-bi/${row.thiet_bi_id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-950">
                    {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id} · {row.loai_xu_ly ?? "Theo dõi"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(row.ngay_ghi_nhan)} · {formatCurrency(row.chi_phi)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <CompactEmpty text="Chưa có bảo trì gần đây." />
          )}
        </Panel>
      </section>
    </>
  );
}

function NeedRow({
  label,
  value,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-md ring-1",
            tone === "red"
              ? "bg-red-50 text-red-700 ring-red-200"
              : tone === "amber"
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : tone === "blue"
                  ? "bg-blue-50 text-blue-700 ring-blue-200"
                  : "bg-slate-100 text-slate-700 ring-slate-200"
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </span>
      <span className="font-heading text-xl font-bold text-slate-950">{value}</span>
    </Link>
  );
}

function OperationCard({
  title,
  value,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="admin-panel flex items-center justify-between gap-3 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-2 font-heading text-3xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{description}</p>
      </div>
      <span className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-200">
        <Icon className="size-5" />
      </span>
    </Link>
  );
}

function CompactEmpty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-sm text-slate-500">{text}</p>;
}
