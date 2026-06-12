import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  HardDrive,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

import { PageHeader, StatCard } from "@/components/common/page";
import { CertificateReportClient } from "@/components/features/certificate-report-client";
import { DeviceReportClient } from "@/components/features/device-report-client";
import {
  HandoverReportClient,
  MaintenanceReportClient,
} from "@/components/features/operations-report-client";
import { buttonVariants } from "@/components/ui/button";
import { getDevices, getOperations, getReportRows } from "@/lib/data";
import { cn } from "@/lib/utils";

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

async function CertificateReportSection({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const { rows, lookups, summary } = await getReportRows({
    q: params.q,
    phongBan: params.phongBan,
    trangThai: params.trangThai,
    from: params.from,
    to: params.to,
  });

  return (
    <>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Sắp hết hạn" value={summary.expiring} icon={CalendarClock} tone="amber" />
        <StatCard label="Hết hạn" value={summary.renew} icon={RefreshCcw} tone="red" />
        <StatCard label="Đã gia hạn" value={summary.renewed} icon={BadgeCheck} tone="slate" />
        <StatCard label="Cần thu hồi" value={summary.revoke} icon={ShieldAlert} tone="red" />
        <StatCard label="Đang hiệu lực" value={summary.active} icon={BadgeCheck} tone="green" />
      </section>

      <CertificateReportClient
        rows={rows}
        lookups={lookups}
        filters={{
          q: params.q,
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
  const { rows, lookups } = await getDevices({});

  return (
    <>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng thiết bị" value={rows.length} icon={HardDrive} tone="blue" />
        <StatCard
          label="Đáp ứng CĐS"
          value={rows.filter((row) => row.dap_ung_cds).length}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard
          label="Thiết bị mật"
          value={rows.filter((row) => row.thiet_bi_mat).length}
          icon={ShieldAlert}
          tone="red"
        />
        <StatCard
          label="Chưa phân công"
          value={rows.filter((row) => row.nguoi_su_dung_id == null).length}
          icon={RefreshCcw}
          tone="amber"
        />
      </section>
      <DeviceReportClient rows={rows} lookups={lookups} />
    </>
  );
}

async function HandoverReportSection() {
  const data = await getOperations("ban-giao");
  return <HandoverReportClient rows={data.handovers} />;
}

async function MaintenanceReportSection() {
  const data = await getOperations("bao-tri");
  return <MaintenanceReportClient rows={data.maintenance} />;
}
