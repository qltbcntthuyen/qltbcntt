import { PageHeader } from "@/components/common/page";
import { SystemConfigClient } from "@/components/features/system-config-client";
import { getExpiryThresholdDays } from "@/lib/data";

export default async function ConfigPage() {
  const ctsCanhBaoSoNgay = await getExpiryThresholdDays();

  return (
    <>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Tinh chỉnh các tham số dùng chung cho toàn bộ phần mềm. Thay đổi áp dụng ngay cho các báo cáo và dashboard."
      />
      <SystemConfigClient defaults={{ ctsCanhBaoSoNgay }} />
    </>
  );
}
