"use client";

import { Download, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { HandoverItem, MaintenanceItem } from "@/lib/data";
import { display, formatCurrency, formatDate, normalizeText } from "@/lib/format";

type ReportRow = Array<string | number | null | undefined>;

async function exportXlsx(fileName: string, sheetName: string, data: ReportRow[]) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet(data.map((row) => row as unknown[]));
  if (data[0]) {
    worksheet["!cols"] = data[0].map((header) => ({
      wch: Math.max(String(header ?? "").length + 4, 16),
    }));
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function HandoverReportClient({ rows }: { rows: HandoverItem[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    const term = normalizeText(q);
    return rows.filter((row) => {
      const day = row.ngay_ban_giao ? new Date(row.ngay_ban_giao) : null;
      if (fromDate && day && day < fromDate) return false;
      if (toDate && day && day > toDate) return false;
      if (term) {
        const haystack = normalizeText(
          [
            row.thiet_bi?.ma_thiet_bi,
            row.thiet_bi?.ten_thiet_bi,
            row.nguoi_nhan?.ho_ten,
            row.phong_ban_nhan?.ten_phong_ban,
            row.hinh_thuc,
            row.noi_dung,
          ]
            .filter(Boolean)
            .join(" ")
        );
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, from, to, q]);

  function exportExcel() {
    const data: ReportRow[] = [
      [
        "STT",
        "Mã thiết bị",
        "Tên thiết bị",
        "Người nhận",
        "Phòng ban nhận",
        "Ngày bàn giao",
        "Tình trạng thiết bị bàn giao",
      ],
      ...filtered.map((row, index) => [
        index + 1,
        display(row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id),
        display(row.thiet_bi?.ten_thiet_bi),
        display(row.nguoi_nhan?.ho_ten),
        display(row.phong_ban_nhan?.ten_phong_ban),
        formatDate(row.ngay_ban_giao),
        display(row.noi_dung),
      ]),
    ];
    void exportXlsx("bao-cao-ban-giao", "Ban giao", data);
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm thiết bị, người nhận, phòng ban..."
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            aria-label="Từ ngày"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            aria-label="Đến ngày"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              setFrom("");
              setTo("");
            }}
          >
            <RotateCcw className="size-4" />
            Đặt lại
          </Button>
          <Button type="button" onClick={exportExcel} disabled={!filtered.length}>
            <Download className="size-4" />
            Xuất Excel
          </Button>
        </div>
      </section>

      <p className="text-sm text-slate-600">Kết quả: {filtered.length} biên bản</p>

      <section className="admin-panel overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1080px]">
              <thead>
                <tr>
                  <th className="w-12">STT</th>
                  <th>Ngày bàn giao</th>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Người nhận</th>
                  <th>Phòng ban nhận</th>
                  <th>Tình trạng thiết bị bàn giao</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={row.id}>
                    <td className="text-slate-500">{index + 1}</td>
                    <td>{formatDate(row.ngay_ban_giao)}</td>
                    <td>{display(row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id)}</td>
                    <td>{display(row.thiet_bi?.ten_thiet_bi)}</td>
                    <td>{display(row.nguoi_nhan?.ho_ten)}</td>
                    <td>{display(row.phong_ban_nhan?.ten_phong_ban)}</td>
                    <td>{display(row.noi_dung)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có dữ liệu báo cáo"
              description="Chưa có bàn giao nào trong khoảng thời gian đã chọn."
            />
          </div>
        )}
      </section>
    </div>
  );
}

export function MaintenanceReportClient({ rows }: { rows: MaintenanceItem[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    const term = normalizeText(q);
    return rows.filter((row) => {
      const day = row.ngay_ghi_nhan ? new Date(row.ngay_ghi_nhan) : null;
      if (fromDate && day && day < fromDate) return false;
      if (toDate && day && day > toDate) return false;
      if (term) {
        const haystack = normalizeText(
          [
            row.thiet_bi?.ma_thiet_bi,
            row.thiet_bi?.ten_thiet_bi,
            row.loai_xu_ly,
            row.mo_ta_loi,
            row.ket_qua_xu_ly,
            row.don_vi_sua_chua,
          ]
            .filter(Boolean)
            .join(" ")
        );
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, from, to, q]);

  const totalCost = filtered.reduce((sum, row) => sum + (row.chi_phi ?? 0), 0);

  function exportExcel() {
    const data: ReportRow[] = [
      [
        "STT",
        "Mã thiết bị",
        "Tên thiết bị",
        "Người sử dụng thiết bị",
        "Ngày ghi nhận",
        "Loại xử lý",
        "Mô tả lỗi",
        "Ngày sửa chữa",
        "Kết quả xử lý",
        "Đơn vị sửa chữa",
        "Chi phí",
      ],
      ...filtered.map((row, index) => [
        index + 1,
        display(row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id),
        display(row.thiet_bi?.ten_thiet_bi),
        display(row.nguoi_su_dung?.ho_ten),
        formatDate(row.ngay_ghi_nhan),
        display(row.loai_xu_ly),
        display(row.mo_ta_loi),
        formatDate(row.ngay_sua_chua),
        display(row.ket_qua_xu_ly),
        display(row.don_vi_sua_chua),
        row.chi_phi ?? 0,
      ]),
      [
        "Tổng chi phí",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        totalCost,
      ],
    ];
    void exportXlsx("bao-cao-bao-tri", "Bao tri", data);
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm thiết bị, lỗi, kết quả..."
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            aria-label="Từ ngày"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            aria-label="Đến ngày"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              setFrom("");
              setTo("");
            }}
          >
            <RotateCcw className="size-4" />
            Đặt lại
          </Button>
          <Button type="button" onClick={exportExcel} disabled={!filtered.length}>
            <Download className="size-4" />
            Xuất Excel
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Kết quả: {filtered.length} bản ghi</p>
        <p className="text-sm font-semibold text-slate-800">
          Tổng chi phí: <span className="text-blue-700">{formatCurrency(totalCost)}</span>
        </p>
      </div>

      <section className="admin-panel overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1280px]">
              <thead>
                <tr>
                  <th className="w-12">STT</th>
                  <th>Ngày ghi nhận</th>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Người sử dụng</th>
                  <th>Loại xử lý</th>
                  <th>Mô tả lỗi</th>
                  <th>Ngày sửa</th>
                  <th>Kết quả</th>
                  <th>Đơn vị</th>
                  <th>Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={row.id}>
                    <td className="text-slate-500">{index + 1}</td>
                    <td>{formatDate(row.ngay_ghi_nhan)}</td>
                    <td>{display(row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id)}</td>
                    <td>{display(row.thiet_bi?.ten_thiet_bi)}</td>
                    <td>{display(row.nguoi_su_dung?.ho_ten)}</td>
                    <td>{display(row.loai_xu_ly)}</td>
                    <td>{display(row.mo_ta_loi)}</td>
                    <td>{formatDate(row.ngay_sua_chua)}</td>
                    <td>{display(row.ket_qua_xu_ly)}</td>
                    <td>{display(row.don_vi_sua_chua)}</td>
                    <td className="font-medium text-slate-900">{formatCurrency(row.chi_phi)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9} className="text-right font-semibold">
                    Tổng chi phí
                  </td>
                  <td className="font-semibold text-blue-700">{formatCurrency(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có dữ liệu báo cáo"
              description="Chưa có bảo trì, sửa chữa nào trong khoảng thời gian đã chọn."
            />
          </div>
        )}
      </section>
    </div>
  );
}
