import { PageHeader } from "@/components/common/page";
import { DepartmentClient } from "@/components/features/department-client";
import { getDepartments } from "@/lib/data";

export default async function DepartmentsPage() {
  const rows = await getDepartments();

  return (
    <>
      <PageHeader title="Phòng ban" />
      <DepartmentClient rows={rows} />
    </>
  );
}
