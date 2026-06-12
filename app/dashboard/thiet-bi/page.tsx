import { PageHeader } from "@/components/common/page";
import { DeviceListClient } from "@/components/features/device-list-client";
import { getDevices } from "@/lib/data";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { rows, lookups } = await getDevices({
    q: params.q,
    loai: params.loai,
    phongBan: params.phongBan,
    tinhTrang: params.tinhTrang,
    nguoiDung: params.nguoiDung,
  });

  return (
    <>
      <PageHeader title="Thiết bị" />
      <DeviceListClient rows={rows} lookups={lookups} filters={params} />
    </>
  );
}
