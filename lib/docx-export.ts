import type { CertificateDocumentConfig, CertificateReportRow } from "@/lib/data";
import { formatDate } from "@/lib/format";

type ExportMode = "04" | "05" | "dang_su_dung";

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = Math.max(date.getFullYear() - 1980, 0);
  return {
    date: (year << 9) | (month << 5) | day,
    time,
  };
}

function u16(value: number) {
  const buffer = new Uint8Array(2);
  new DataView(buffer.buffer).setUint16(0, value, true);
  return buffer;
}

function u32(value: number) {
  const buffer = new Uint8Array(4);
  new DataView(buffer.buffer).setUint32(0, value, true);
  return buffer;
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function createZip(entries: Array<{ name: string; content: string }>) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const { date, time } = dosDateTime();

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const content = encoder.encode(entry.content);
    const crc = crc32(content);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(content.length),
      u32(content.length),
      u16(name.length),
      u16(0),
      name,
      content,
    ]);
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(content.length),
      u32(content.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralDirectory = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  return Buffer.from(concat([...locals, centralDirectory, end]));
}

function xmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraph(text: string, options: { bold?: boolean; center?: boolean } = {}) {
  return `<w:p>${options.center ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : ""}<w:r>${
    options.bold ? "<w:rPr><w:b/></w:rPr>" : ""
  }<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function table(headers: string[], rows: string[][]) {
  const headerXml = `<w:tr>${headers
    .map((header) => `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${xmlEscape(header)}</w:t></w:r></w:p></w:tc>`)
    .join("")}</w:tr>`;
  const rowsXml = rows
    .map(
      (row) =>
        `<w:tr>${row
          .map((cell) => `<w:tc><w:p><w:r><w:t xml:space="preserve">${xmlEscape(cell)}</w:t></w:r></w:p></w:tc>`)
          .join("")}</w:tr>`
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${headerXml}${rowsXml}</w:tbl>`;
}

function buildBody(mode: ExportMode, rows: CertificateReportRow[], config: CertificateDocumentConfig | null) {
  const agency = config?.ten_co_quan ?? "................................";
  const place = config?.dia_diem ?? "................";
  const today = formatDate(new Date().toISOString());
  const number = config?.so_van_ban_mac_dinh ?? "......";
  const contact = config?.nguoi_dau_moi ?? "";
  const body: string[] = [];

  body.push(paragraph(agency.toUpperCase(), { center: true, bold: true }));
  body.push(paragraph(`Số: ${number}`, { center: true }));
  body.push(paragraph(`${place}, ngày ${today}`, { center: true }));
  if (mode === "dang_su_dung") {
    body.push(paragraph("DANH SÁCH CHỨNG THƯ SỐ ĐANG SỬ DỤNG", { center: true, bold: true }));
  } else {
    body.push(paragraph(mode === "04" ? "MẪU SỐ 04" : "MẪU SỐ 05", { center: true, bold: true }));
    body.push(
      paragraph(
        mode === "04"
          ? "DANH SÁCH ĐỀ NGHỊ GIA HẠN / THAY ĐỔI THÔNG TIN CHỨNG THƯ SỐ"
          : "DANH SÁCH ĐỀ NGHỊ THU HỒI CHỨNG THƯ SỐ",
        { center: true, bold: true }
      )
    );
  }
  body.push(paragraph(""));
  if (contact) {
    body.push(paragraph(`Đầu mối xử lý: ${contact}`));
  }

  if (mode === "04") {
    body.push(
      table(
        [
          "STT",
          "Tên CTS",
          "Serial CTS",
          "Email",
          "Mã thiết bị",
          "Nội dung đề nghị",
          "Thông tin mới",
          "Thời hạn",
        ],
        rows.map((row, index) => [
          String(index + 1),
          row.ten_chung_thu_so ?? row.nguoi_su_dung ?? "",
          row.so_hieu_chung_thu_so ?? "",
          row.email ?? "",
          row.so_hieu_thiet_bi ?? "",
          row.da_gia_han ? "Thay đổi thông tin / cấp mới" : "Gia hạn / thay đổi thông tin",
          row.thong_tin_chung ?? "",
          `${formatDate(row.ngay_hieu_luc)} - ${formatDate(row.ngay_het_hieu_luc)}`,
        ])
      )
    );
  } else if (mode === "05") {
    body.push(
      table(
        ["STT", "Tên CTS", "Email", "Serial CTS", "Mã thiết bị", "Lý do thu hồi"],
        rows.map((row, index) => [
          String(index + 1),
          row.ten_chung_thu_so ?? row.nguoi_su_dung ?? "",
          row.email ?? "",
          row.so_hieu_chung_thu_so ?? "",
          row.so_hieu_thiet_bi ?? "",
          row.ly_do_thu_hoi ?? "................................",
        ])
      )
    );
  } else {
    body.push(
      table(
        [
          "STT",
          "Tên CTS",
          "Mã thiết bị",
          "Serial CTS",
          "Email",
          "Thời hạn",
        ],
        rows.map((row, index) => [
          String(index + 1),
          row.ten_chung_thu_so ?? row.nguoi_su_dung ?? "",
          row.so_hieu_thiet_bi ?? "",
          row.so_hieu_chung_thu_so ?? "",
          row.email ?? "",
          `${formatDate(row.ngay_hieu_luc)} - ${formatDate(row.ngay_het_hieu_luc)}`,
        ])
      )
    );
  }

  body.push(paragraph(""));
  body.push(paragraph("NGƯỜI LẬP", { center: true, bold: true }));
  body.push(paragraph(""));
  body.push(paragraph(config?.nguoi_ky ?? "................................", { center: true }));
  return body.join("");
}

export function buildCertificateDocx({
  mode,
  rows,
  config,
}: {
  mode: ExportMode;
  rows: CertificateReportRow[];
  config: CertificateDocumentConfig | null;
}) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${buildBody(mode, rows, config)}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="850"/></w:sectPr>
  </w:body>
</w:document>`;

  return createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      name: "word/document.xml",
      content: documentXml,
    },
  ]);
}
