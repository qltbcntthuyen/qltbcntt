import { PageHeader } from "@/components/common/page";
import { CertificateListClient } from "@/components/features/certificate-list-client";
import { getCertificateHistoryRecords, getCertificateRecords, getCertificates } from "@/lib/data";

export default async function CertificatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ rows, lookups }, records, history] = await Promise.all([
    getCertificates({
      q: params.q,
      trangThai: params.trangThai,
      phongBan: params.phongBan,
      hieuLucFrom: params.hieuLucFrom,
      hieuLucTo: params.hieuLucTo,
    }),
    getCertificateRecords(),
    getCertificateHistoryRecords(),
  ]);

  return (
    <>
      <PageHeader title="Chứng thư số" />
      <CertificateListClient
        rows={rows}
        records={records}
        history={history}
        lookups={lookups}
        filters={{
          q: params.q,
          trangThai: params.trangThai,
          phongBan: params.phongBan,
          hieuLucFrom: params.hieuLucFrom,
          hieuLucTo: params.hieuLucTo,
        }}
      />
    </>
  );
}
