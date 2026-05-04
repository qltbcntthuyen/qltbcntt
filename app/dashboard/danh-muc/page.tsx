import { PageHeader } from "@/components/common/page";
import { CatalogClient } from "@/components/features/catalog-client";
import { CATALOG_OPTIONS, type CatalogKind } from "@/lib/constants";
import { getCatalog } from "@/lib/data";

function normalizeKind(value?: string): CatalogKind {
  const found = CATALOG_OPTIONS.find((option) => option.value === value);
  return found?.value ?? "phong_ban";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const kind = normalizeKind(params.loai);
  const { rows } = await getCatalog(kind);

  return (
    <>
      <PageHeader
        title="Danh mục"
        description="Quản lý dữ liệu nền dùng trong thiết bị, cấu hình máy tính, phòng ban và báo cáo."
      />
      <CatalogClient kind={kind} rows={rows} />
    </>
  );
}
