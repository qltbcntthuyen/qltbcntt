import { PageHeader } from "@/components/common/page";
import { OperationsClient } from "@/components/features/operations-client";
import { getOperations } from "@/lib/data";

export default async function HandoverPage() {
  const data = await getOperations("ban-giao");

  return (
    <>
      <PageHeader title="Bàn giao thiết bị" />
      <OperationsClient data={data} />
    </>
  );
}
