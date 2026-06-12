"use client";

import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  FileClock,
  HardDrive,
  History,
  Save,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

import { saveComputerConfigAction, type EntityInput } from "@/app/actions/mutations";
import {
  CertificateStatusBadge,
  DeviceConditionBadge,
  TextLinkButton,
} from "@/components/common/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import type {
  Certificate,
  CertificateHistory,
  CertificateReportRow,
  ComputerConfig,
  DeviceListItem,
  HandoverItem,
  LookupData,
  MaintenanceItem,
} from "@/lib/data";
import { display, formatCurrency, formatDate, formatDateTime } from "@/lib/format";

type DeviceDetailData = {
  device: DeviceListItem;
  config: ComputerConfig | null;
  certificate: Certificate | null;
  certificates: Certificate[];
  certificateReport: CertificateReportRow | null;
  certificateHistory: CertificateHistory[];
  handovers: HandoverItem[];
  maintenance: MaintenanceItem[];
  lookups: LookupData;
};

const eventLabels: Record<string, string> = {
  cap_moi: "Cấp mới",
  gia_han: "Gia hạn",
  thay_doi_thong_tin: "Thay đổi thông tin",
  thu_hoi: "Thu hồi",
};

export function DeviceDetailClient({ detail }: { detail: DeviceDetailData }) {
  const router = useRouter();
  const [form, setForm] = useState<EntityInput>({
    thiet_bi_id: detail.device.id,
    mainboard: detail.config?.mainboard ?? "",
    cpu: detail.config?.cpu ?? "",
    ram: detail.config?.ram ?? "",
    o_cung: detail.config?.o_cung ?? "",
    man_hinh: detail.config?.man_hinh ?? "",
    he_dieu_hanh_id: detail.config?.he_dieu_hanh_id ?? "",
    phan_mem_diet_virus_id: detail.config?.phan_mem_diet_virus_id ?? "",
    ghi_chu: detail.config?.ghi_chu ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveConfig() {
    startTransition(async () => {
      const result = await saveComputerConfigAction(form);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  const device = detail.device;
  const model = [device.hang_model?.ten_hang, device.hang_model?.ten_model]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-5">
      {message ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Thông tin thiết bị" description="Thông tin nhận diện và đơn vị đang quản lý.">
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Mã thiết bị" value={device.ma_thiet_bi} strong />
            <Info label="Tên thiết bị" value={device.ten_thiet_bi} strong />
            <Info label="Loại thiết bị" value={display(device.loai_thiet_bi?.ten_loai)} />
            <Info label="Hãng/model" value={display(model)} />
            <Info label="Serial" value={display(device.serial)} />
            <Info label="Năm trang bị" value={display(device.nam_trang_bi)} />
            <Info label="Ngày tiếp nhận" value={formatDate(device.ngay_tiep_nhan)} />
            <Info label="Nguồn gốc" value={display(device.nguon_goc?.ten_nguon_goc)} />
            <Info label="Phòng ban" value={display(device.phong_ban?.ten_phong_ban)} />
            <Info label="Người sử dụng" value={display(device.nguoi_su_dung?.ho_ten)} />
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Tình trạng</p>
              <div className="mt-1">
                <DeviceConditionBadge label={device.tinh_trang?.ten_tinh_trang} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Thuộc tính</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {device.la_thiet_bi_dung_chung ? <Badge tone="blue">Dùng chung</Badge> : null}
                {device.thiet_bi_mat ? <Badge tone="red">Thiết bị mật</Badge> : null}
                {device.dap_ung_cds ? <Badge tone="green">Đáp ứng CĐS</Badge> : null}
                {!device.la_thiet_bi_dung_chung && !device.thiet_bi_mat && !device.dap_ung_cds ? (
                  <Badge tone="slate">Thiết bị thường</Badge>
                ) : null}
              </div>
            </div>
            {device.ghi_chu ? <Info label="Ghi chú" value={device.ghi_chu} /> : null}
          </div>
        </Panel>

        <Panel title="Chứng thư số" description="Trạng thái chứng thư đang gắn với thiết bị.">
          {detail.certificateReport ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {display(detail.certificateReport.so_hieu_chung_thu_so)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {display(detail.certificateReport.ten_chung_thu_so ?? detail.certificateReport.nguoi_su_dung)}
                  </p>
                </div>
                <CertificateStatusBadge status={detail.certificateReport.trang_thai} />
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <Info label="Ngày hiệu lực" value={formatDate(detail.certificateReport.ngay_hieu_luc)} />
                <Info
                  label="Ngày hết hiệu lực"
                  value={formatDate(detail.certificateReport.ngay_het_hieu_luc)}
                />
                <Info
                  label="Số ngày còn lại"
                  value={
                    detail.certificateReport.so_ngay_con_lai == null
                      ? "Không có dữ liệu"
                      : `${detail.certificateReport.so_ngay_con_lai} ngày`
                  }
                />
                <Info
                  label="Hạn gia hạn lần đầu"
                  value={formatDate(detail.certificateReport.han_gia_han_lan_dau)}
                />
                <Info label="Email" value={display(detail.certificateReport.email)} />
                <Info
                  label="Đã gia hạn"
                  value={detail.certificateReport.da_gia_han ? "Có" : "Không"}
                />
              </div>
              <TextLinkButton href="/dashboard/chung-thu-so">Quản lý chứng thư</TextLinkButton>
            </div>
          ) : (
            <EmptyState
              title="Chưa gắn chứng thư số"
              description="Có thể thêm chứng thư mới tại màn hình Chứng thư số."
              action={<TextLinkButton href="/dashboard/chung-thu-so">Thêm chứng thư</TextLinkButton>}
            />
          )}
        </Panel>
      </section>

      <Panel title="Cấu hình máy tính" description="Dùng cho máy tính để bàn, máy tính xách tay và thiết bị cần cấu hình kỹ thuật.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Mainboard">
            <Input value={String(form.mainboard ?? "")} onChange={(e) => setField("mainboard", e.target.value)} />
          </Field>
          <Field label="CPU">
            <Input value={String(form.cpu ?? "")} onChange={(e) => setField("cpu", e.target.value)} />
          </Field>
          <Field label="RAM">
            <Input value={String(form.ram ?? "")} onChange={(e) => setField("ram", e.target.value)} />
          </Field>
          <Field label="Ổ cứng">
            <Input value={String(form.o_cung ?? "")} onChange={(e) => setField("o_cung", e.target.value)} />
          </Field>
          <Field label="Màn hình">
            <Input value={String(form.man_hinh ?? "")} onChange={(e) => setField("man_hinh", e.target.value)} />
          </Field>
          <Field label="Hệ điều hành">
            <Select
              value={String(form.he_dieu_hanh_id ?? "")}
              onChange={(e) => setField("he_dieu_hanh_id", e.target.value)}
            >
              <option value="">Chưa chọn</option>
              {detail.lookups.operatingSystems.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.ten_he_dieu_hanh, item.phien_ban].filter(Boolean).join(" ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Phần mềm diệt virus">
            <Select
              value={String(form.phan_mem_diet_virus_id ?? "")}
              onChange={(e) => setField("phan_mem_diet_virus_id", e.target.value)}
            >
              <option value="">Chưa chọn</option>
              {detail.lookups.antivirus.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.ten_phan_mem, item.phien_ban].filter(Boolean).join(" ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú kỹ thuật" className="md:col-span-2 xl:col-span-3">
            <Input
              value={String(form.ghi_chu ?? "")}
              onChange={(e) => setField("ghi_chu", e.target.value)}
              placeholder="Cấu hình bổ sung, lưu ý cài đặt..."
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={saveConfig} disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <HistoryPanel
          title="Lịch sử bàn giao"
          icon={History}
          emptyTitle="Chưa có lịch sử bàn giao"
          rows={detail.handovers}
          render={(row) => (
            <tr key={row.id}>
              <td>{formatDate(row.ngay_ban_giao)}</td>
              <td>{display(row.nguoi_nhan?.ho_ten)}</td>
              <td>{display(row.phong_ban_nhan?.ten_phong_ban)}</td>
              <td>{display(row.hinh_thuc)}</td>
              <td>{formatDate(row.ngay_thu_hoi)}</td>
            </tr>
          )}
          headers={["Ngày giao", "Người nhận", "Phòng ban", "Hình thức", "Thu hồi"]}
        />

        <HistoryPanel
          title="Bảo trì, sửa chữa"
          icon={Wrench}
          emptyTitle="Chưa có bảo trì"
          rows={detail.maintenance}
          render={(row) => (
            <tr key={row.id}>
              <td>{formatDate(row.ngay_ghi_nhan)}</td>
              <td>{display(row.loai_xu_ly)}</td>
              <td>{display(row.mo_ta_loi)}</td>
              <td>{display(row.ket_qua_xu_ly)}</td>
              <td>{formatCurrency(row.chi_phi)}</td>
            </tr>
          )}
          headers={["Ghi nhận", "Loại xử lý", "Mô tả", "Kết quả", "Chi phí"]}
        />
      </section>

      <Panel title="Lịch sử chứng thư số" description="Các lần cấp mới, gia hạn, thay đổi thông tin và thu hồi.">
        {detail.certificates.length ? (
          <div className="mb-4 overflow-x-auto">
            <table className="admin-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Serial CTS</th>
                  <th>Tên CTS</th>
                  <th>Hiệu lực</th>
                  <th>Đã gia hạn</th>
                  <th>Hiện hành</th>
                </tr>
              </thead>
              <tbody>
                {detail.certificates.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-950">{display(row.so_hieu_chung_thu_so)}</td>
                    <td>{display(row.ten_chung_thu_so)}</td>
                    <td>
                      {formatDate(row.ngay_hieu_luc)} đến {formatDate(row.ngay_het_hieu_luc)}
                    </td>
                    <td>{row.da_gia_han ? "Có" : "Không"}</td>
                    <td>{row.la_hien_hanh ? "Có" : "Không"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {detail.certificateHistory.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[980px]">
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Sự kiện</th>
                  <th>Số hiệu trước</th>
                  <th>Số hiệu sau</th>
                  <th>Hiệu lực sau</th>
                </tr>
              </thead>
              <tbody>
                {detail.certificateHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.thoi_diem_su_kien)}</td>
                    <td>{eventLabels[row.loai_su_kien] ?? row.loai_su_kien}</td>
                    <td>{display(row.so_hieu_chung_thu_so_truoc)}</td>
                    <td>{display(row.so_hieu_chung_thu_so_sau)}</td>
                    <td>{formatDate(row.ngay_het_hieu_luc_sau)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Chưa có lịch sử chứng thư" description="Lịch sử sẽ phát sinh khi cấp mới, gia hạn, thay đổi hoặc thu hồi chứng thư." />
        )}
      </Panel>

      <div className="flex flex-wrap gap-2">
        <TextLinkButton href="/dashboard/thiet-bi">
          <HardDrive className="size-4" />
          Quay lại danh sách thiết bị
        </TextLinkButton>
        <TextLinkButton href="/dashboard/ban-giao">
          <FileClock className="size-4" />
          Lập bàn giao
        </TextLinkButton>
        <TextLinkButton href="/dashboard/bao-tri">
          <Wrench className="size-4" />
          Ghi nhận bảo trì
        </TextLinkButton>
        <TextLinkButton href="/dashboard/chung-thu-so">
          <BadgeCheck className="size-4" />
          Cập nhật chứng thư
        </TextLinkButton>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={strong ? "mt-1 font-semibold text-slate-950" : "mt-1 text-sm text-slate-700"}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function HistoryPanel<T>({
  title,
  icon: Icon,
  emptyTitle,
  rows,
  headers,
  render,
}: {
  title: string;
  icon: LucideIcon;
  emptyTitle: string;
  rows: T[];
  headers: string[];
  render: (row: T) => React.ReactNode;
}) {
  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {title}
        </span>
      }
    >
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[720px]">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.map(render)}</tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={emptyTitle} description="Dữ liệu sẽ hiển thị khi có nghiệp vụ được ghi nhận." />
      )}
    </Panel>
  );
}
