import { BadgeCheck, CalendarClock, CalendarDays, RotateCcw, ShieldAlert } from "lucide-react";

import { PageHeader, StatCard } from "@/components/common/page";
import { CertificateReportClient } from "@/components/features/certificate-report-client";
import { getReportRows } from "@/lib/data";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
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
      <PageHeader
        title="Báo cáo chứng thư số"
        description="Tổng hợp chứng thư sắp hết hạn, cần thu hồi và danh sách chứng thư còn hiệu lực phục vụ theo dõi định kỳ."
      />

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Hết hạn tháng này" value={summary.month} icon={CalendarClock} tone="amber" />
        <StatCard label="Hết hạn quý này" value={summary.quarter} icon={CalendarDays} tone="blue" />
        <StatCard label="Hết hạn năm nay" value={summary.year} icon={RotateCcw} tone="slate" />
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
