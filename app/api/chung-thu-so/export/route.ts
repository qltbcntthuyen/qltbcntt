import { NextResponse } from "next/server";

import { getAdminGateState } from "@/lib/auth";
import { buildCertificateDocx } from "@/lib/docx-export";
import { createClient } from "@/lib/server";

export async function GET(request: Request) {
  const gate = await getAdminGateState();
  if (gate.status !== "authorized") {
    return NextResponse.json({ message: "Không có quyền xuất văn bản." }, { status: 403 });
  }

  const url = new URL(request.url);
  const param = url.searchParams.get("mau") ?? "dang_su_dung";
  const mode: "04" | "05" | "dang_su_dung" =
    param === "04" ? "04" : param === "05" ? "05" : "dang_su_dung";
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  // Trạng thái mặc định theo từng mẫu khi không truyền ids:
  // - dang_su_dung: CTS đang hiệu lực hoặc sắp hết hạn
  // - mẫu 04 (đề nghị gia hạn/đổi thông tin): sắp hết hạn hoặc đã hết hạn
  // - mẫu 05 (đề nghị thu hồi): cần thu hồi
  const defaultStatuses: Record<typeof mode, string[]> = {
    dang_su_dung: ["dang_hieu_luc", "sap_het_han"],
    "04": ["sap_het_han", "het_han"],
    "05": ["can_thu_hoi"],
  };

  const supabase = await createClient();
  const [rowsResult, configResult] = await Promise.all([
    ids.length
      ? supabase
          .from("v_bao_cao_chung_thu_so")
          .select("*")
          .in("thiet_bi_chung_thu_so_id", ids)
          .order("so_hieu_thiet_bi")
      : supabase
          .from("v_bao_cao_chung_thu_so")
          .select("*")
          .in("trang_thai", defaultStatuses[mode])
          .order("so_hieu_thiet_bi"),
    supabase
      .from("cau_hinh_van_ban_chung_thu_so")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (rowsResult.error) {
    return NextResponse.json({ message: rowsResult.error.message }, { status: 500 });
  }

  let rows = rowsResult.data ?? [];
  if (ids.length && mode === "dang_su_dung") {
    rows = rows.filter(
      (row) => row.trang_thai === "dang_hieu_luc" || row.trang_thai === "sap_het_han"
    );
  }
  if (!rows.length) {
    return NextResponse.json({ message: "Không tìm thấy CTS phù hợp." }, { status: 404 });
  }

  const body = buildCertificateDocx({
    mode,
    rows,
    config: configResult.data ?? null,
  });
  const date = new Date().toISOString().slice(0, 10);
  const fileName =
    mode === "dang_su_dung"
      ? `danh-sach-cts-dang-su-dung-${date}.docx`
      : `mau-${mode}-chung-thu-so-${date}.docx`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
