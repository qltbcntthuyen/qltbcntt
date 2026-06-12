"use client";

import { Download, FileSpreadsheet, Search, ShieldAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { NHOM_CDS_LABELS, NHOM_CDS_OPTIONS } from "@/lib/constants";
import type { DeviceListItem, LookupData } from "@/lib/data";

type ReportRow = Array<string | number | boolean | null | undefined>;

async function downloadWorkbook(
  fileName: string,
  sheets: Array<{ name: string; data: ReportRow[]; cols?: number[] }>
) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data.map((row) => row as unknown[]));
    if (sheet.cols) {
      worksheet["!cols"] = sheet.cols.map((wch) => ({ wch }));
    } else if (sheet.data[0]) {
      worksheet["!cols"] = sheet.data[0].map((header) => ({
        wch: Math.max(String(header ?? "").length + 4, 16),
      }));
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }
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

function display(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function DeviceReportClient({
  rows,
  lookups,
}: {
  rows: DeviceListItem[];
  lookups: LookupData;
}) {
  const [staffFilter, setStaffFilter] = useState("");
  const staff = useMemo(
    () => [...lookups.staff].sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, "vi")),
    [lookups.staff]
  );

  function exportCDS() {
    const summary: ReportRow[] = [
      ["BÁO CÁO ĐÁNH GIÁ ĐÁP ỨNG YÊU CẦU CHUYỂN ĐỔI SỐ"],
      [],
      ["Nhóm thiết bị", "Tổng số", "Đáp ứng CĐS", "Chưa đáp ứng"],
    ];
    for (const option of NHOM_CDS_OPTIONS) {
      const matching = rows.filter((row) => row.nhom_cds === option.value);
      summary.push([
        option.label,
        matching.length,
        matching.filter((row) => row.dap_ung_cds).length,
        matching.filter((row) => !row.dap_ung_cds).length,
      ]);
    }
    const unclassified = rows.filter((row) => !row.nhom_cds);
    if (unclassified.length) {
      summary.push([
        "Chưa phân nhóm",
        unclassified.length,
        unclassified.filter((row) => row.dap_ung_cds).length,
        unclassified.filter((row) => !row.dap_ung_cds).length,
      ]);
    }
    summary.push([
      "Tổng cộng",
      rows.length,
      rows.filter((row) => row.dap_ung_cds).length,
      rows.filter((row) => !row.dap_ung_cds).length,
    ]);

    const detail: ReportRow[] = [
      ["STT", "Mã thiết bị", "Tên thiết bị", "Loại", "Nhóm CĐS", "Phòng ban", "Người sử dụng", "Đáp ứng CĐS"],
      ...rows.map((row, index) => [
        index + 1,
        row.ma_thiet_bi,
        row.ten_thiet_bi,
        display(row.loai_thiet_bi?.ten_loai),
        row.nhom_cds ? NHOM_CDS_LABELS[row.nhom_cds] ?? row.nhom_cds : "Chưa phân nhóm",
        display(row.phong_ban?.ten_phong_ban),
        display(row.nguoi_su_dung?.ho_ten),
        row.dap_ung_cds ? "Có" : "Không",
      ]),
    ];

    void downloadWorkbook("bao-cao-danh-gia-cds", [
      { name: "Tong hop", data: summary },
      { name: "Chi tiet", data: detail },
    ]);
  }

  function exportCatalog(filterMat = false) {
    const list = filterMat ? rows.filter((row) => row.thiet_bi_mat) : rows;
    const headers: ReportRow = [
      "STT",
      "Phòng ban",
      "Người sử dụng",
      "Mã thiết bị",
      "Tên thiết bị",
      "Hãng/Model",
      "Mainboard",
      "CPU",
      "RAM",
      "Ổ cứng",
      "Màn hình",
      "Hệ điều hành",
      "Phần mềm diệt virus",
      "Tình trạng",
      "Năm trang bị",
    ];
    if (!filterMat) headers.push("Đáp ứng CĐS");
    headers.push("Ghi chú");

    const data: ReportRow[] = [
      [filterMat ? "DANH MỤC THIẾT BỊ MẬT" : "DANH MỤC TOÀN BỘ THIẾT BỊ"],
      [],
      headers,
      ...list.map((row, index) => {
        const osName = lookups.operatingSystems.find(
          (item) => item.id === row.cau_hinh?.he_dieu_hanh_id
        );
        const av = lookups.antivirus.find(
          (item) => item.id === row.cau_hinh?.phan_mem_diet_virus_id
        );
        const base: ReportRow = [
          index + 1,
          display(row.phong_ban?.ten_phong_ban),
          display(row.nguoi_su_dung?.ho_ten),
          row.ma_thiet_bi,
          row.ten_thiet_bi,
          [row.hang_model?.ten_hang, row.hang_model?.ten_model].filter(Boolean).join(" "),
          display(row.cau_hinh?.mainboard),
          display(row.cau_hinh?.cpu),
          display(row.cau_hinh?.ram),
          display(row.cau_hinh?.o_cung),
          display(row.cau_hinh?.man_hinh),
          osName ? [osName.ten_he_dieu_hanh, osName.phien_ban].filter(Boolean).join(" ") : "",
          av ? [av.ten_phan_mem, av.phien_ban].filter(Boolean).join(" ") : "",
          display(row.tinh_trang?.ten_tinh_trang),
          display(row.nam_trang_bi),
        ];
        if (!filterMat) base.push(row.dap_ung_cds ? "Có" : "Không");
        base.push(display(row.cau_hinh?.ghi_chu ?? row.ghi_chu));
        return base;
      }),
    ];
    void downloadWorkbook(
      filterMat ? "danh-muc-thiet-bi-mat" : "danh-muc-thiet-bi",
      [{ name: filterMat ? "Thiet bi mat" : "Toan bo thiet bi", data }]
    );
  }

  function exportByUser() {
    const target = staff.find((item) => String(item.id) === staffFilter);
    const filteredDevices = rows.filter((row) =>
      target ? row.nguoi_su_dung_id === target.id : row.nguoi_su_dung_id != null
    );
    const computers = filteredDevices.filter((row) => {
      const text = `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase();
      return text.includes("máy tính") && !text.includes("xách tay") && !text.includes("laptop");
    });
    const laptops = filteredDevices.filter((row) =>
      `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase().match(/laptop|xách tay/)
    );
    const printers = filteredDevices.filter((row) =>
      `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase().includes("máy in")
    );
    const others = filteredDevices.filter(
      (row) => !computers.includes(row) && !laptops.includes(row) && !printers.includes(row)
    );

    const data: ReportRow[] = [
      ["THỐNG KÊ THIẾT BỊ THEO NGƯỜI SỬ DỤNG"],
      target ? [`Người sử dụng: ${target.ho_ten}`] : ["Toàn bộ người sử dụng"],
      [],
      ["STT", "Họ và tên", "Máy tính", "Laptop", "Máy in", "Thiết bị khác", "Phần mềm diệt virus", "Ngày bàn giao"],
    ];
    if (target) {
      data.push([
        1,
        target.ho_ten,
        computers.map((row) => row.ten_thiet_bi).join("\n"),
        laptops.map((row) => row.ten_thiet_bi).join("\n"),
        printers.map((row) => row.ten_thiet_bi).join("\n"),
        others.map((row) => row.ten_thiet_bi).join("\n"),
        Array.from(
          new Set(
            filteredDevices
              .map((row) =>
                lookups.antivirus.find(
                  (item) => item.id === row.cau_hinh?.phan_mem_diet_virus_id
                )?.ten_phan_mem
              )
              .filter(Boolean)
          )
        ).join(", "),
        "",
      ]);
    } else {
      const grouped = new Map<number, DeviceListItem[]>();
      for (const device of filteredDevices) {
        if (device.nguoi_su_dung_id == null) continue;
        const list = grouped.get(device.nguoi_su_dung_id) ?? [];
        list.push(device);
        grouped.set(device.nguoi_su_dung_id, list);
      }
      let stt = 1;
      for (const [staffId, devices] of grouped) {
        const member = lookups.staff.find((item) => item.id === staffId);
        const isComputer = (row: DeviceListItem) => {
          const text = `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase();
          return text.includes("máy tính") && !text.includes("xách tay") && !text.includes("laptop");
        };
        const isLaptop = (row: DeviceListItem) =>
          /laptop|xách tay/.test(`${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase());
        const isPrinter = (row: DeviceListItem) =>
          `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase().includes("máy in");
        data.push([
          stt++,
          member?.ho_ten ?? `Nhân sự #${staffId}`,
          devices.filter(isComputer).map((row) => row.ten_thiet_bi).join("\n"),
          devices.filter(isLaptop).map((row) => row.ten_thiet_bi).join("\n"),
          devices.filter(isPrinter).map((row) => row.ten_thiet_bi).join("\n"),
          devices
            .filter((row) => !isComputer(row) && !isLaptop(row) && !isPrinter(row))
            .map((row) => row.ten_thiet_bi)
            .join("\n"),
          Array.from(
            new Set(
              devices
                .map((row) =>
                  lookups.antivirus.find(
                    (item) => item.id === row.cau_hinh?.phan_mem_diet_virus_id
                  )?.ten_phan_mem
                )
                .filter(Boolean)
            )
          ).join(", "),
          "",
        ]);
      }
    }

    void downloadWorkbook("thong-ke-theo-nguoi-dung", [
      { name: "Theo nguoi su dung", data, cols: [6, 24, 24, 24, 24, 24, 24, 16] },
    ]);
  }

  function exportCounts() {
    const safe = rows.filter((row) => !row.thiet_bi_mat);
    const secret = rows.filter((row) => row.thiet_bi_mat);
    const isComputer = (row: DeviceListItem) => {
      const text = `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase();
      return text.includes("máy tính") && !text.includes("xách tay") && !text.includes("laptop");
    };
    const isLaptop = (row: DeviceListItem) =>
      /laptop|xách tay/.test(`${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase());
    const isPrinter = (row: DeviceListItem) =>
      `${row.loai_thiet_bi?.ten_loai ?? ""}`.toLowerCase().includes("máy in");
    const isBroken = (row: DeviceListItem) => {
      const text = `${row.tinh_trang?.ten_tinh_trang ?? ""}`.toLowerCase();
      return text.includes("hỏng") || text.includes("hư");
    };

    const buildRow = (group: DeviceListItem[]): ReportRow => [
      group.filter(isComputer).length,
      group.filter(isLaptop).length,
      group.filter(isPrinter).length,
      group.filter((row) => !isComputer(row) && !isLaptop(row) && !isPrinter(row)).length,
      group.filter(isBroken).length,
      group.filter((row) => Boolean(row.cau_hinh?.phan_mem_diet_virus_id)).length,
    ];

    const data: ReportRow[] = [
      ["THỐNG KÊ SỐ LƯỢNG TỪNG LOẠI THIẾT BỊ"],
      [],
      [
        "Nhóm",
        "Máy tính để bàn",
        "Laptop",
        "Máy in",
        "Thiết bị khác",
        "Thiết bị hư hỏng",
        "PM diệt virus đã cài",
      ],
      ["Thiết bị không mật", ...buildRow(safe)],
      ["Thiết bị mật", ...buildRow(secret)],
      ["Tổng cộng", ...buildRow(rows)],
    ];

    void downloadWorkbook("thong-ke-so-luong-thiet-bi", [
      { name: "So luong", data, cols: [22, 18, 12, 10, 14, 14, 18] },
    ]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Chọn báo cáo cần xuất. Mỗi báo cáo đều xuất Excel theo dữ liệu đang được lọc trên trang Thiết bị.
        Đảm bảo đã đánh dấu cờ “Đáp ứng CĐS” và phân “Nhóm CĐS” cho thiết bị trước khi xuất báo cáo 1.1.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportCard
          icon={ShieldAlert}
          title="1.1 Báo cáo đánh giá đáp ứng yêu cầu chuyển đổi số"
          description="Tổng hợp số lượng đáp ứng CĐS theo nhóm + chi tiết từng thiết bị."
          onClick={exportCDS}
        />
        <ReportCard
          icon={FileSpreadsheet}
          title="1.2 Danh mục toàn bộ thiết bị"
          description="Đầy đủ thông tin nhận diện, cấu hình kỹ thuật, cờ Đáp ứng CĐS."
          onClick={() => exportCatalog(false)}
        />
        <ReportCard
          icon={ShieldAlert}
          title="1.3 Danh mục toàn bộ thiết bị mật"
          description="Lọc các thiết bị có cờ Thiết bị mật."
          onClick={() => exportCatalog(true)}
        />
        <ReportCard
          icon={Users}
          title="1.4 Thống kê thiết bị theo người sử dụng"
          description="Chọn nhân sự để xuất báo cáo theo tên hoặc để trống để xuất toàn bộ."
          extra={
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  list="staff-options"
                  value={staffFilter}
                  onChange={(event) => setStaffFilter(event.target.value)}
                  placeholder="Chọn hoặc bỏ trống để xuất tất cả"
                  className="pl-9"
                />
                <datalist id="staff-options">
                  {staff.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.ho_ten}
                    </option>
                  ))}
                </datalist>
              </div>
              <Select
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
                aria-label="Chọn nhân sự"
              >
                <option value="">Toàn bộ</option>
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.ho_ten}
                  </option>
                ))}
              </Select>
            </div>
          }
          onClick={exportByUser}
        />
        <ReportCard
          icon={FileSpreadsheet}
          title="1.5 Thống kê số lượng từng loại thiết bị"
          description="Thống kê số lượng máy tính, laptop, máy in, thiết bị khác, hỏng, PM diệt virus."
          onClick={exportCounts}
        />
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  description,
  extra,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  extra?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <section className="admin-panel flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {extra ? <div>{extra}</div> : null}
      <div className="mt-auto flex justify-end">
        <Button type="button" onClick={onClick}>
          <Download className="size-4" />
          Tải Excel
        </Button>
      </div>
    </section>
  );
}

export type { ReportRow as DeviceReportRow };

// Hint to keep Label tree-shake friendly when not used directly.
export const _DeviceReportLabel = Label;
