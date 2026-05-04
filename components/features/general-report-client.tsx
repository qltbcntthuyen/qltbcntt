"use client";

import Link from "next/link";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/format";

export type GeneralReportColumn = {
  key: string;
  label: string;
};

export type GeneralReportRow = Record<string, string | number | null>;

export function GeneralReportClient({
  rows,
  columns,
  fileName,
}: {
  rows: GeneralReportRow[];
  columns: GeneralReportColumn[];
  fileName: string;
}) {
  const [q, setQ] = useState("");
  const filteredRows = useMemo(() => {
    const term = normalizeText(q);
    if (!term) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => normalizeText(String(value ?? "")).includes(term))
    );
  }, [q, rows]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = [
      columns.map((column) => column.label),
      ...filteredRows.map((row) => columns.map((column) => row[column.key] ?? "")),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = columns.map((column) => ({ wch: Math.max(column.label.length + 4, 18) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao cao");
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

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm trong báo cáo..."
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={exportExcel} disabled={!filteredRows.length}>
            <Download className="size-4" />
            Xuất Excel
          </Button>
        </div>
      </section>

      <p className="text-sm text-slate-600">Kết quả báo cáo: {filteredRows.length} dòng</p>

      <section className="admin-panel overflow-hidden">
        {filteredRows.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1080px]">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={String(row.id ?? index)}>
                    {columns.map((column) => {
                      const value = row[column.key];
                      const deviceId = row.thiet_bi_id;
                      const shouldLinkDevice =
                        column.key === "ma_thiet_bi" && typeof deviceId === "number";
                      return (
                        <td key={column.key}>
                          {shouldLinkDevice ? (
                            <Link href={`/dashboard/thiet-bi/${deviceId}`} className="font-medium text-primary hover:underline">
                              {value ?? ""}
                            </Link>
                          ) : (
                            value ?? ""
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có dữ liệu báo cáo"
              description="Thử đổi từ khóa tìm kiếm hoặc kiểm tra dữ liệu nghiệp vụ đã nhập."
            />
          </div>
        )}
      </section>
    </div>
  );
}
