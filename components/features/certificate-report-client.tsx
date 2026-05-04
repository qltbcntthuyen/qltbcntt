"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import { CertificateStatusBadge } from "@/components/common/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CERTIFICATE_STATUS_OPTIONS } from "@/lib/constants";
import type { CertificateReportRow, LookupData } from "@/lib/data";
import { display, formatDate } from "@/lib/format";

type ReportFilters = {
  q?: string;
  report?: string;
  phongBan?: string;
  trangThai?: string;
  from?: string;
  to?: string;
};

const reportOptions = [
  { value: "month", label: "Hết hạn trong tháng này" },
  { value: "quarter", label: "Hết hạn trong quý này" },
  { value: "year", label: "Hết hạn trong năm nay" },
  { value: "renew", label: "Cần gia hạn" },
  { value: "revoke", label: "Cần thu hồi" },
  { value: "active", label: "Danh sách đang hiệu lực" },
  { value: "all", label: "Toàn bộ chứng thư" },
];

const excelHeaders = [
  "Số hiệu chứng thư",
  "Mã thiết bị",
  "Tên thiết bị",
  "Loại thiết bị",
  "Người sử dụng",
  "Phòng ban",
  "Ngày hiệu lực",
  "Ngày hết hiệu lực",
  "Hạn gia hạn lần đầu",
  "Số ngày còn lại",
  "Trạng thái",
  "Ngày cần thu hồi",
];

export function CertificateReportClient({
  rows,
  lookups,
  filters,
}: {
  rows: CertificateReportRow[];
  lookups: LookupData;
  filters: ReportFilters;
}) {
  const router = useRouter();
  const [filterState, setFilterState] = useState<ReportFilters>({
    q: filters.q ?? "",
    report: filters.report ?? "month",
    phongBan: filters.phongBan ?? "",
    trangThai: filters.trangThai ?? "all",
    from: filters.from ?? "",
    to: filters.to ?? "",
  });

  function applyFilters(next: ReportFilters) {
    const params = new URLSearchParams();
    params.set("nhom", "chung-thu-so");
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    router.push(`/dashboard/bao-cao${params.size ? `?${params}` : ""}`);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = [
      excelHeaders,
      ...rows.map((row) => [
        row.so_hieu_chung_thu_so ?? "",
        row.so_hieu_thiet_bi ?? "",
        row.ten_thiet_bi ?? "",
        row.loai_thiet_bi ?? "",
        row.nguoi_su_dung ?? "",
        row.ten_phong_ban ?? "",
        formatDate(row.ngay_hieu_luc),
        formatDate(row.ngay_het_hieu_luc),
        formatDate(row.han_gia_han_lan_dau),
        row.so_ngay_con_lai ?? "",
        row.trang_thai ?? "",
        formatDate(row.ngay_can_thu_hoi),
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = excelHeaders.map((header) => ({ wch: Math.max(header.length + 4, 18) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chung thu so");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-chung-thu-so-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_220px_180px_180px_140px_140px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filterState.q ?? ""}
              onChange={(event) => setFilterState((current) => ({ ...current, q: event.target.value }))}
              placeholder="Tìm chứng thư, thiết bị, nhân sự..."
              className="pl-9"
            />
          </div>
          <Select
            value={filterState.report ?? "month"}
            onChange={(event) => setFilterState((current) => ({ ...current, report: event.target.value }))}
          >
            {reportOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
            value={filterState.from ?? ""}
            onChange={(event) => setFilterState((current) => ({ ...current, from: event.target.value }))}
            aria-label="Từ ngày"
          />
          <Input
            type="date"
            value={filterState.to ?? ""}
            onChange={(event) => setFilterState((current) => ({ ...current, to: event.target.value }))}
            aria-label="Đến ngày"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => applyFilters(filterState)}>
              Lọc
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => router.push("/dashboard/bao-cao?nhom=chung-thu-so")}>
              <RotateCcw className="size-4" />
              <span className="sr-only">Đặt lại</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Kết quả báo cáo: {rows.length} chứng thư</p>
        <Button type="button" onClick={exportExcel} disabled={!rows.length}>
          <Download className="size-4" />
          Xuất Excel
        </Button>
      </div>

      <section className="admin-panel overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1240px]">
              <thead>
                <tr>
                  <th>Số hiệu chứng thư</th>
                  <th>Thiết bị</th>
                  <th>Người sử dụng</th>
                  <th>Phòng ban</th>
                  <th>Ngày hết hạn</th>
                  <th>Hạn gia hạn lần đầu</th>
                  <th>Còn lại</th>
                  <th>Ngày cần thu hồi</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.thiet_bi_chung_thu_so_id}-${row.thiet_bi_id}`}>
                    <td className="font-medium text-slate-950">{display(row.so_hieu_chung_thu_so)}</td>
                    <td>
                      {row.thiet_bi_id ? (
                        <Link href={`/dashboard/thiet-bi/${row.thiet_bi_id}`} className="font-medium text-primary hover:underline">
                          {display(row.so_hieu_thiet_bi)} - {display(row.ten_thiet_bi)}
                        </Link>
                      ) : (
                        display(row.ten_thiet_bi)
                      )}
                    </td>
                    <td>{display(row.nguoi_su_dung)}</td>
                    <td>{display(row.ten_phong_ban)}</td>
                    <td>{formatDate(row.ngay_het_hieu_luc)}</td>
                    <td>{formatDate(row.han_gia_han_lan_dau)}</td>
                    <td>
                      {row.so_ngay_con_lai == null ? "Không có dữ liệu" : `${row.so_ngay_con_lai} ngày`}
                    </td>
                    <td>{formatDate(row.ngay_can_thu_hoi)}</td>
                    <td>
                      <CertificateStatusBadge status={row.trang_thai} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có dữ liệu báo cáo"
              description="Thử đổi kỳ báo cáo hoặc đặt lại bộ lọc để xem toàn bộ chứng thư."
            />
          </div>
        )}
      </section>
    </div>
  );
}
