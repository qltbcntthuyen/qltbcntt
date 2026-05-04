import { PageHeader } from "@/components/common/page";
import { CatalogClient } from "@/components/features/catalog-client";
import { CATALOG_OPTIONS, type CatalogKind } from "@/lib/constants";
import { getCatalog } from "@/lib/data";

function normalizeKind(value?: string): CatalogKind {
  const found = CATALOG_OPTIONS.find((option) => option.value === value);
  return found?.value ?? "loai_thiet_bi";
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
      <PageHeader title="Danh mục" />
      <CatalogClient kind={kind} rows={rows} />
    </>
  );
}
