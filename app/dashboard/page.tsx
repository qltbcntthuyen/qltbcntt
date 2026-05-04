import {
  BadgeCheck,
  ClipboardList,
  HardDrive,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import {
  CertificateStatusBadge,
  PageHeader,
  StatCard,
} from "@/components/common/page";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Theo dõi nhanh tình trạng thiết bị CNTT, chứng thư số, bàn giao và bảo trì trong cơ quan."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Tổng thiết bị"
          value={data.metrics.totalDevices}
          icon={HardDrive}
          tone="blue"
        />
        <StatCard
          label="Thiết bị đang sử dụng"
          value={data.metrics.activeDevices}
          icon={ClipboardList}
          tone="green"
        />
        <StatCard
          label="Chứng thư sắp hết hạn"
          value={data.metrics.expiringCertificates}
          icon={BadgeCheck}
          tone="amber"
        />
        <StatCard
          label="Chứng thư cần thu hồi"
          value={data.metrics.revokeCertificates}
          icon={ShieldAlert}
          tone="red"
        />
        <StatCard
          label="Bảo trì đang theo dõi"
          value={data.metrics.trackedMaintenance}
          icon={Wrench}
          tone="slate"
        />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-1">
          <PanelHeader>
            <PanelTitle>Chứng thư gần hết hạn</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {data.recentCertificates.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Số hiệu</th>
                    <th>Người dùng</th>
                    <th>Hết hạn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentCertificates.map((row) => (
                    <tr key={row.thiet_bi_chung_thu_so_id ?? row.so_hieu_chung_thu_so}>
                      <td className="font-medium text-slate-900">
                        {row.so_hieu_chung_thu_so ?? "Chưa cập nhật"}
                      </td>
                      <td>{row.nguoi_su_dung ?? "Chưa cập nhật"}</td>
                      <td>{formatDate(row.ngay_het_hieu_luc)}</td>
                      <td>
                        <CertificateStatusBadge status={row.trang_thai} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="Chưa có chứng thư số"
                  description="Khi chứng thư số được nhập, danh sách sắp hết hạn sẽ xuất hiện tại đây."
                />
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Bàn giao gần đây</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {data.recentHandovers.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thiết bị</th>
                    <th>Người nhận</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentHandovers.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-900">
                        {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id}
                      </td>
                      <td>{row.nguoi_nhan?.ho_ten ?? "Chưa cập nhật"}</td>
                      <td>{formatDate(row.ngay_ban_giao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="Chưa có bàn giao"
                  description="Các biên bản bàn giao mới nhất sẽ được hiển thị tại đây."
                />
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Bảo trì gần đây</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {data.recentMaintenance.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thiết bị</th>
                    <th>Loại xử lý</th>
                    <th>Chi phí</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentMaintenance.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-900">
                        {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id}
                      </td>
                      <td>{row.loai_xu_ly ?? "Theo dõi"}</td>
                      <td>{formatCurrency(row.chi_phi)}</td>
                      <td>{formatDate(row.ngay_ghi_nhan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="Chưa có bảo trì"
                  description="Các lỗi, sửa chữa và bảo trì đang theo dõi sẽ xuất hiện tại đây."
                />
              </div>
            )}
          </PanelBody>
        </Panel>
      </section>
    </>
  );
}

