"use server";

import { revalidatePath } from "next/cache";

import type { CatalogKind } from "@/lib/constants";
import { createClient } from "@/lib/server";
import { toNumberOrNull, toOptionalString } from "@/lib/format";
import { requireAdminForAction } from "@/lib/auth";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export type EntityInput = Record<
  string,
  string | number | boolean | null | undefined
>;

async function ensureActionAllowed(): Promise<ActionResult | null> {
  const allowed = await requireAdminForAction();
  if (!allowed.ok) {
    return { ok: false, message: allowed.message };
  }
  return null;
}

function requiredText(input: EntityInput, key: string, label: string) {
  const value = toOptionalString(String(input[key] ?? ""));
  if (!value) throw new Error(`Vui lòng nhập ${label}.`);
  return value;
}

function nullableText(input: EntityInput, key: string) {
  const value = input[key];
  if (value === null || value === undefined) return null;
  return toOptionalString(String(value));
}

function nullableNumber(input: EntityInput, key: string) {
  return toNumberOrNull(input[key] as string | number | null | undefined);
}

function requiredNumber(input: EntityInput, key: string, label: string) {
  const value = nullableNumber(input, key);
  if (value == null) throw new Error(`Vui lòng chọn ${label}.`);
  return value;
}

function boolValue(input: EntityInput, key: string, fallback = false) {
  const value = input[key];
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function idValue(input: EntityInput) {
  return nullableNumber(input, "id");
}

function success(message: string): ActionResult {
  return { ok: true, message };
}

function failure(error: unknown): ActionResult {
  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: "Không thể xử lý yêu cầu. Vui lòng thử lại." };
}

export async function savePersonAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    const payload = {
      ho_ten: requiredText(input, "ho_ten", "họ tên"),
      ten_dang_nhap: requiredText(input, "ten_dang_nhap", "tên đăng nhập"),
      email: nullableText(input, "email"),
      so_dien_thoai: nullableText(input, "so_dien_thoai"),
      phong_ban_id: nullableNumber(input, "phong_ban_id"),
      vai_tro: requiredText(input, "vai_tro", "vai trò"),
      trang_thai: boolValue(input, "trang_thai", true),
      auth_user_id: nullableText(input, "auth_user_id"),
    };

    const result = id
      ? await supabase.from("nguoi_dung").update(payload).eq("id", id)
      : await supabase.from("nguoi_dung").insert(payload);

    if (result.error) throw result.error;
    revalidatePath("/dashboard/nhan-su");
    revalidatePath("/dashboard", "layout");
    return success(id ? "Đã cập nhật nhân sự." : "Đã thêm nhân sự.");
  } catch (error) {
    return failure(error);
  }
}

export async function deletePersonAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("nguoi_dung").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath("/dashboard/nhan-su");
  return success("Đã xóa nhân sự.");
}

export async function saveDeviceAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    const payload = {
      ma_thiet_bi: requiredText(input, "ma_thiet_bi", "mã thiết bị"),
      ten_thiet_bi: requiredText(input, "ten_thiet_bi", "tên thiết bị"),
      loai_thiet_bi_id: requiredNumber(input, "loai_thiet_bi_id", "loại thiết bị"),
      hang_model_id: nullableNumber(input, "hang_model_id"),
      serial: nullableText(input, "serial"),
      nam_trang_bi: nullableNumber(input, "nam_trang_bi"),
      ngay_tiep_nhan: nullableText(input, "ngay_tiep_nhan"),
      nguon_goc_id: nullableNumber(input, "nguon_goc_id"),
      tinh_trang_id: nullableNumber(input, "tinh_trang_id"),
      phong_ban_id: nullableNumber(input, "phong_ban_id"),
      nguoi_su_dung_id: nullableNumber(input, "nguoi_su_dung_id"),
      la_thiet_bi_dung_chung: boolValue(input, "la_thiet_bi_dung_chung", false),
      thiet_bi_mat: boolValue(input, "thiet_bi_mat", false),
      ghi_chu: nullableText(input, "ghi_chu"),
    };

    const result = id
      ? await supabase.from("thiet_bi").update(payload).eq("id", id)
      : await supabase.from("thiet_bi").insert(payload);

    if (result.error) throw result.error;
    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard");
    return success(id ? "Đã cập nhật thiết bị." : "Đã thêm thiết bị.");
  } catch (error) {
    return failure(error);
  }
}

export async function deleteDeviceAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("thiet_bi").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath("/dashboard/thiet-bi");
  revalidatePath("/dashboard");
  return success("Đã xóa thiết bị.");
}

export async function saveComputerConfigAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const payload = {
      thiet_bi_id: requiredNumber(input, "thiet_bi_id", "thiết bị"),
      mainboard: nullableText(input, "mainboard"),
      cpu: nullableText(input, "cpu"),
      ram: nullableText(input, "ram"),
      o_cung: nullableText(input, "o_cung"),
      man_hinh: nullableText(input, "man_hinh"),
      he_dieu_hanh_id: nullableNumber(input, "he_dieu_hanh_id"),
      phan_mem_diet_virus_id: nullableNumber(input, "phan_mem_diet_virus_id"),
      ghi_chu: nullableText(input, "ghi_chu"),
    };

    const { error } = await supabase
      .from("cau_hinh_may_tinh")
      .upsert(payload, { onConflict: "thiet_bi_id" });

    if (error) throw error;
    revalidatePath(`/dashboard/thiet-bi/${payload.thiet_bi_id}`);
    return success("Đã lưu cấu hình máy tính.");
  } catch (error) {
    return failure(error);
  }
}

export async function saveCertificateAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    const eventType =
      input.loai_su_kien === "gia_han" ? "gia_han" : "thay_doi_thong_tin";
    const payload = {
      thiet_bi_id: requiredNumber(input, "thiet_bi_id", "thiết bị"),
      nguoi_su_dung_id: requiredNumber(input, "nguoi_su_dung_id", "người sử dụng"),
      so_hieu_chung_thu_so: requiredText(
        input,
        "so_hieu_chung_thu_so",
        "số hiệu chứng thư"
      ),
      ngay_hieu_luc: requiredText(input, "ngay_hieu_luc", "ngày hiệu lực"),
      ngay_het_hieu_luc: requiredText(
        input,
        "ngay_het_hieu_luc",
        "ngày hết hiệu lực"
      ),
      ghi_chu: nullableText(input, "ghi_chu"),
      thoi_diem_gia_han_gan_nhat:
        id && eventType === "gia_han" ? new Date().toISOString() : undefined,
      thoi_diem_thay_doi_thong_tin_gan_nhat:
        id && eventType !== "gia_han" ? new Date().toISOString() : undefined,
    };

    if (new Date(payload.ngay_het_hieu_luc) < new Date(payload.ngay_hieu_luc)) {
      throw new Error("Ngày hết hiệu lực phải sau hoặc bằng ngày hiệu lực.");
    }

    if (!id) {
      const { error } = await supabase.from("thiet_bi_chung_thu_so").insert(payload);
      if (error) throw error;
      const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
        thiet_bi_id: payload.thiet_bi_id,
        loai_su_kien: "cap_moi",
        nguoi_su_dung_id_sau: payload.nguoi_su_dung_id,
        so_hieu_chung_thu_so_sau: payload.so_hieu_chung_thu_so,
        ngay_hieu_luc_sau: payload.ngay_hieu_luc,
        ngay_het_hieu_luc_sau: payload.ngay_het_hieu_luc,
        ghi_chu: payload.ghi_chu,
      });
      if (historyError) throw historyError;
    } else {
      const { data: previous, error: previousError } = await supabase
        .from("thiet_bi_chung_thu_so")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) throw new Error("Không tìm thấy chứng thư cần cập nhật.");

      const { error } = await supabase
        .from("thiet_bi_chung_thu_so")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
        thiet_bi_id: payload.thiet_bi_id,
        loai_su_kien: eventType,
        nguoi_su_dung_id_truoc: previous.nguoi_su_dung_id,
        nguoi_su_dung_id_sau: payload.nguoi_su_dung_id,
        so_hieu_chung_thu_so_truoc: previous.so_hieu_chung_thu_so,
        so_hieu_chung_thu_so_sau: payload.so_hieu_chung_thu_so,
        ngay_hieu_luc_truoc: previous.ngay_hieu_luc,
        ngay_hieu_luc_sau: payload.ngay_hieu_luc,
        ngay_het_hieu_luc_truoc: previous.ngay_het_hieu_luc,
        ngay_het_hieu_luc_sau: payload.ngay_het_hieu_luc,
        ghi_chu: payload.ghi_chu,
      });
      if (historyError) throw historyError;
    }

    revalidatePath("/dashboard/chung-thu-so");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard");
    return success(id ? "Đã cập nhật chứng thư số." : "Đã thêm chứng thư số.");
  } catch (error) {
    return failure(error);
  }
}

export async function revokeCertificateAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const { data: previous, error: previousError } = await supabase
      .from("thiet_bi_chung_thu_so")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (previousError) throw previousError;
    if (!previous) throw new Error("Không tìm thấy chứng thư cần thu hồi.");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("thiet_bi_chung_thu_so")
      .update({ thoi_diem_thu_hoi: now })
      .eq("id", id);
    if (error) throw error;

    const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
      thiet_bi_id: previous.thiet_bi_id,
      loai_su_kien: "thu_hoi",
      nguoi_su_dung_id_truoc: previous.nguoi_su_dung_id,
      so_hieu_chung_thu_so_truoc: previous.so_hieu_chung_thu_so,
      ngay_hieu_luc_truoc: previous.ngay_hieu_luc,
      ngay_het_hieu_luc_truoc: previous.ngay_het_hieu_luc,
      ghi_chu: "Thu hồi chứng thư số",
    });
    if (historyError) throw historyError;

    revalidatePath("/dashboard/chung-thu-so");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard");
    return success("Đã ghi nhận thu hồi chứng thư.");
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCertificateAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("thiet_bi_chung_thu_so").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath("/dashboard/chung-thu-so");
  revalidatePath("/dashboard/bao-cao");
  return success("Đã xóa chứng thư số.");
}

export async function saveHandoverAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    const payload = {
      thiet_bi_id: requiredNumber(input, "thiet_bi_id", "thiết bị"),
      nguoi_nhan_id: nullableNumber(input, "nguoi_nhan_id"),
      phong_ban_nhan_id: nullableNumber(input, "phong_ban_nhan_id"),
      ngay_ban_giao: requiredText(input, "ngay_ban_giao", "ngày bàn giao"),
      ngay_thu_hoi: nullableText(input, "ngay_thu_hoi"),
      hinh_thuc: nullableText(input, "hinh_thuc"),
      noi_dung: nullableText(input, "noi_dung"),
      ghi_chu: nullableText(input, "ghi_chu"),
    };

    const result = id
      ? await supabase.from("lich_su_ban_giao").update(payload).eq("id", id)
      : await supabase.from("lich_su_ban_giao").insert(payload);
    if (result.error) throw result.error;

    await supabase
      .from("thiet_bi")
      .update({
        nguoi_su_dung_id: payload.nguoi_nhan_id,
        phong_ban_id: payload.phong_ban_nhan_id,
      })
      .eq("id", payload.thiet_bi_id);

    revalidatePath("/dashboard/ban-giao");
    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard");
    return success(id ? "Đã cập nhật bàn giao." : "Đã lập bàn giao.");
  } catch (error) {
    return failure(error);
  }
}

export async function deleteHandoverAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("lich_su_ban_giao").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath("/dashboard/ban-giao");
  return success("Đã xóa bản ghi bàn giao.");
}

export async function saveMaintenanceAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    const payload = {
      thiet_bi_id: requiredNumber(input, "thiet_bi_id", "thiết bị"),
      ngay_ghi_nhan: requiredText(input, "ngay_ghi_nhan", "ngày ghi nhận"),
      ngay_sua_chua: nullableText(input, "ngay_sua_chua"),
      loai_xu_ly: nullableText(input, "loai_xu_ly"),
      mo_ta_loi: nullableText(input, "mo_ta_loi"),
      ket_qua_xu_ly: nullableText(input, "ket_qua_xu_ly"),
      chi_phi: nullableNumber(input, "chi_phi"),
      don_vi_sua_chua: nullableText(input, "don_vi_sua_chua"),
      ghi_chu: nullableText(input, "ghi_chu"),
    };

    const result = id
      ? await supabase.from("sua_chua_bao_tri").update(payload).eq("id", id)
      : await supabase.from("sua_chua_bao_tri").insert(payload);
    if (result.error) throw result.error;

    revalidatePath("/dashboard/bao-tri");
    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard");
    return success(id ? "Đã cập nhật bảo trì." : "Đã ghi nhận bảo trì.");
  } catch (error) {
    return failure(error);
  }
}

export async function deleteMaintenanceAction(id: number): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("sua_chua_bao_tri").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath("/dashboard/bao-tri");
  return success("Đã xóa bản ghi bảo trì.");
}

export async function saveCatalogAction(
  kind: CatalogKind,
  input: EntityInput
): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);

    switch (kind) {
      case "phong_ban": {
        const payload = {
          ma_phong_ban: nullableText(input, "ma"),
          ten_phong_ban: requiredText(input, "ten", "tên phòng ban"),
          ghi_chu: nullableText(input, "ghi_chu"),
        };
        const result = id
          ? await supabase.from("phong_ban").update(payload).eq("id", id)
          : await supabase.from("phong_ban").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "loai_thiet_bi": {
        const payload = {
          ma_loai: nullableText(input, "ma"),
          ten_loai: requiredText(input, "ten", "tên loại thiết bị"),
          ghi_chu: nullableText(input, "ghi_chu"),
        };
        const result = id
          ? await supabase.from("loai_thiet_bi").update(payload).eq("id", id)
          : await supabase.from("loai_thiet_bi").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "hang_model": {
        const payload = {
          ten_hang: requiredText(input, "ten", "tên hãng"),
          ten_model: nullableText(input, "phu"),
          ghi_chu: nullableText(input, "ghi_chu"),
        };
        const result = id
          ? await supabase.from("hang_model").update(payload).eq("id", id)
          : await supabase.from("hang_model").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "he_dieu_hanh": {
        const payload = {
          ten_he_dieu_hanh: requiredText(input, "ten", "tên hệ điều hành"),
          phien_ban: nullableText(input, "phu"),
        };
        const result = id
          ? await supabase.from("he_dieu_hanh").update(payload).eq("id", id)
          : await supabase.from("he_dieu_hanh").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "phan_mem_diet_virus": {
        const payload = {
          ten_phan_mem: requiredText(input, "ten", "tên phần mềm"),
          phien_ban: nullableText(input, "phu"),
        };
        const result = id
          ? await supabase.from("phan_mem_diet_virus").update(payload).eq("id", id)
          : await supabase.from("phan_mem_diet_virus").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "tinh_trang_thiet_bi": {
        const payload = {
          ma_tinh_trang: nullableText(input, "ma"),
          ten_tinh_trang: requiredText(input, "ten", "tên tình trạng"),
          ghi_chu: nullableText(input, "ghi_chu"),
        };
        const result = id
          ? await supabase.from("tinh_trang_thiet_bi").update(payload).eq("id", id)
          : await supabase.from("tinh_trang_thiet_bi").insert(payload);
        if (result.error) throw result.error;
        break;
      }
      case "nguon_goc_tai_san": {
        const payload = {
          ma_nguon_goc: nullableText(input, "ma"),
          ten_nguon_goc: requiredText(input, "ten", "tên nguồn gốc"),
          ghi_chu: nullableText(input, "ghi_chu"),
        };
        const result = id
          ? await supabase.from("nguon_goc_tai_san").update(payload).eq("id", id)
          : await supabase.from("nguon_goc_tai_san").insert(payload);
        if (result.error) throw result.error;
        break;
      }
    }

    revalidatePath("/dashboard/danh-muc");
    revalidatePath("/dashboard", "layout");
    return success(id ? "Đã cập nhật danh mục." : "Đã thêm danh mục.");
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCatalogAction(
  kind: CatalogKind,
  id: number
): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    let error: unknown = null;
    if (kind === "phong_ban") {
      ({ error } = await supabase.from("phong_ban").delete().eq("id", id));
    } else if (kind === "loai_thiet_bi") {
      ({ error } = await supabase.from("loai_thiet_bi").delete().eq("id", id));
    } else if (kind === "hang_model") {
      ({ error } = await supabase.from("hang_model").delete().eq("id", id));
    } else if (kind === "he_dieu_hanh") {
      ({ error } = await supabase.from("he_dieu_hanh").delete().eq("id", id));
    } else if (kind === "phan_mem_diet_virus") {
      ({ error } = await supabase.from("phan_mem_diet_virus").delete().eq("id", id));
    } else if (kind === "tinh_trang_thiet_bi") {
      ({ error } = await supabase.from("tinh_trang_thiet_bi").delete().eq("id", id));
    } else {
      ({ error } = await supabase.from("nguon_goc_tai_san").delete().eq("id", id));
    }
    if (error) throw error;
    revalidatePath("/dashboard/danh-muc");
    return success("Đã xóa danh mục.");
  } catch (error) {
    return failure(error);
  }
}

