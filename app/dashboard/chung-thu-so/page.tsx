import { PageHeader } from "@/components/common/page";
import { CertificateListClient } from "@/components/features/certificate-list-client";
import { getCertificateRecords, getCertificates } from "@/lib/data";

export default async function CertificatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ rows, lookups }, records] = await Promise.all([
    getCertificates({
      q: params.q,
      trangThai: params.trangThai,
      phongBan: params.phongBan,
    }),
    getCertificateRecords(),
  ]);

  return (
    <>
      <PageHeader
        title="Chứng thư số"
        description="Theo dõi vòng đời chứng thư số: cấp mới, gia hạn, thay đổi thông tin và thu hồi."
      />
      <CertificateListClient
        rows={rows}
        records={records}
        lookups={lookups}
        filters={{
          q: params.q,
          trangThai: params.trangThai,
          phongBan: params.phongBan,
        }}
      />
    </>
  );
}
