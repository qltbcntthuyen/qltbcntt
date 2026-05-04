import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page";
import { DeviceDetailClient } from "@/components/features/device-detail-client";
import { getDeviceDetail } from "@/lib/data";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const detail = await getDeviceDetail(numericId);
  if (!detail) notFound();

  return (
    <>
      <PageHeader
        title={`${detail.device.ma_thiet_bi} - ${detail.device.ten_thiet_bi}`}
        description="Theo dõi thông tin tài sản, cấu hình máy tính, bàn giao, bảo trì và chứng thư số liên quan."
      />
      <DeviceDetailClient detail={detail} />
    </>
  );
}
