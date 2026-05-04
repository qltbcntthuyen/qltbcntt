import { PageHeader } from "@/components/common/page";
import { OperationsClient } from "@/components/features/operations-client";
import { getOperations } from "@/lib/data";

export default async function MaintenancePage() {
  const data = await getOperations("bao-tri");

  return (
    <>
      <PageHeader title="Bảo trì, sửa chữa" />
      <OperationsClient data={data} />
    </>
  );
}
