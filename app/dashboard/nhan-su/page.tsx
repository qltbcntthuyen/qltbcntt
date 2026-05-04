import { PageHeader } from "@/components/common/page";
import { PersonnelClient } from "@/components/features/personnel-client";
import { getPersonnel } from "@/lib/data";

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { rows, lookups } = await getPersonnel({
    q: params.q,
    phongBan: params.phongBan,
    vaiTro: params.vaiTro,
    trangThai: params.trangThai,
  });

  return (
    <>
      <PageHeader
        title="Nhân sự"
        description="Quản lý hồ sơ cán bộ, công chức, viên chức để phân công thiết bị và cấp quyền quản trị hệ thống."
      />
      <PersonnelClient
        rows={rows}
        lookups={lookups}
        filters={{
          q: params.q,
          phongBan: params.phongBan,
          vaiTro: params.vaiTro,
          trangThai: params.trangThai,
        }}
      />
    </>
  );
}
