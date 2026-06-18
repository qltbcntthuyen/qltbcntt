"use server";

import { revalidatePath } from "next/cache";

import type { CatalogKind } from "@/lib/constants";
import type { TablesInsert } from "@/lib/database.types";
import { createClient } from "@/lib/server";
import { normalizeText, toNumberOrNull, toOptionalString } from "@/lib/format";
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

function hasInputValue(input: EntityInput, key: string) {
  const value = input[key];
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
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
    let maHoSo = toOptionalString(String(input.ten_dang_nhap ?? ""));
    if (!id && !maHoSo) {
      const { data: generated, error: genError } = await supabase.rpc("gen_ma_nhan_su");
      if (genError) throw genError;
      if (generated) maHoSo = String(generated);
    }
    if (!maHoSo) {
      throw new Error("Không thể sinh mã hồ sơ. Vui lòng thử lại.");
    }
    const payload = {
      ho_ten: requiredText(input, "ho_ten", "họ tên"),
      ten_dang_nhap: maHoSo,
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
    revalidatePath("/dashboard/phong-ban");
    revalidatePath("/dashboard", "layout");
    return success(id ? "Đã cập nhật nhân sự." : `Đã thêm nhân sự (${maHoSo}).`);
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
  revalidatePath("/dashboard/phong-ban");
  return success("Đã xóa nhân sự.");
}

export async function saveDeviceAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = idValue(input);
    let maThietBi = toOptionalString(String(input.ma_thiet_bi ?? ""));
    if (!id && !maThietBi) {
      const { data: generated, error: genError } = await supabase.rpc("gen_ma_thiet_bi");
      if (genError) throw genError;
      if (generated) maThietBi = String(generated);
    }
    if (!maThietBi) {
      throw new Error("Không thể sinh mã thiết bị. Vui lòng thử lại.");
    }
    const payload = {
      ma_thiet_bi: maThietBi,
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
      dap_ung_cds: boolValue(input, "dap_ung_cds", false),
      nhom_cds: nullableText(input, "nhom_cds"),
      ghi_chu: nullableText(input, "ghi_chu"),
    };

    const result = id
      ? await supabase.from("thiet_bi").update(payload).eq("id", id).select("id").single()
      : await supabase.from("thiet_bi").insert(payload).select("id").single();

    if (result.error) throw result.error;
    const savedId = result.data?.id ?? id;
    const hasComputerConfig = [
      "mainboard",
      "cpu",
      "ram",
      "o_cung",
      "man_hinh",
      "he_dieu_hanh_id",
      "phan_mem_diet_virus_id",
      "ghi_chu_ky_thuat",
    ].some((key) => hasInputValue(input, key));

    if (savedId && hasComputerConfig) {
      const configPayload = {
        thiet_bi_id: savedId,
        mainboard: nullableText(input, "mainboard"),
        cpu: nullableText(input, "cpu"),
        ram: nullableText(input, "ram"),
        o_cung: nullableText(input, "o_cung"),
        man_hinh: nullableText(input, "man_hinh"),
        he_dieu_hanh_id: nullableNumber(input, "he_dieu_hanh_id"),
        phan_mem_diet_virus_id: nullableNumber(input, "phan_mem_diet_virus_id"),
        ghi_chu: nullableText(input, "ghi_chu_ky_thuat"),
      };
      const { error: configError } = await supabase
        .from("cau_hinh_may_tinh")
        .upsert(configPayload, { onConflict: "thiet_bi_id" });
      if (configError) throw configError;
    }

    revalidatePath("/dashboard/thiet-bi");
    if (savedId) revalidatePath(`/dashboard/thiet-bi/${savedId}`);
    revalidatePath("/dashboard/phong-ban");
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
  revalidatePath("/dashboard/phong-ban");
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
    const eventType = String(input.loai_su_kien ?? (id ? "thay_doi_thong_tin" : "cap_moi"));
    const payload = {
      thiet_bi_id: requiredNumber(input, "thiet_bi_id", "thiết bị"),
      nguoi_su_dung_id: requiredNumber(input, "nguoi_su_dung_id", "người sử dụng"),
      so_hieu_chung_thu_so: requiredText(
        input,
        "so_hieu_chung_thu_so",
        "Serial CTS"
      ),
      email: nullableText(input, "email"),
      ten_chung_thu_so: nullableText(input, "ten_chung_thu_so"),
      loai_chung_thu_so: nullableText(input, "loai_chung_thu_so"),
      to_chuc: nullableText(input, "to_chuc"),
      thong_tin_chung: nullableText(input, "thong_tin_chung"),
      id_chung_thu_so_nguon: nullableText(input, "id_chung_thu_so_nguon"),
      ngay_hieu_luc: requiredText(input, "ngay_hieu_luc", "ngày hiệu lực"),
      ngay_het_hieu_luc: requiredText(
        input,
        "ngay_het_hieu_luc",
        "ngày hết hiệu lực"
      ),
      han_gia_han_lan_dau: nullableText(input, "han_gia_han_lan_dau"),
      ghi_chu: null,
    };

    if (new Date(payload.ngay_het_hieu_luc) < new Date(payload.ngay_hieu_luc)) {
      throw new Error("Ngày hết hiệu lực phải sau hoặc bằng ngày hiệu lực.");
    }
    if (
      payload.han_gia_han_lan_dau &&
      new Date(payload.han_gia_han_lan_dau) < new Date(payload.ngay_het_hieu_luc)
    ) {
      throw new Error("Hạn gia hạn lần đầu phải sau hoặc bằng ngày hết hiệu lực.");
    }

    if (eventType === "thay_doi_thong_tin") {
      if (!id) throw new Error("Vui lòng chọn CTS cần thay đổi thông tin.");
      const { data: previous, error: previousError } = await supabase
        .from("thiet_bi_chung_thu_so")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) throw new Error("Không tìm thấy chứng thư cần cập nhật.");

      const { error } = await supabase
        .from("thiet_bi_chung_thu_so")
        .update({
          ...payload,
          thoi_diem_thay_doi_thong_tin_gan_nhat: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
        thiet_bi_chung_thu_so_id: id,
        thiet_bi_id: payload.thiet_bi_id,
        loai_su_kien: "thay_doi_thong_tin",
        nguoi_su_dung_id_truoc: previous.nguoi_su_dung_id,
        nguoi_su_dung_id_sau: payload.nguoi_su_dung_id,
        so_hieu_chung_thu_so_truoc: previous.so_hieu_chung_thu_so,
        so_hieu_chung_thu_so_sau: payload.so_hieu_chung_thu_so,
        email_truoc: previous.email,
        email_sau: payload.email,
        ten_chung_thu_so_truoc: previous.ten_chung_thu_so,
        ten_chung_thu_so_sau: payload.ten_chung_thu_so,
        to_chuc_truoc: previous.to_chuc,
        to_chuc_sau: payload.to_chuc,
        thong_tin_chung_truoc: previous.thong_tin_chung,
        thong_tin_chung_sau: payload.thong_tin_chung,
        noi_dung_thay_doi: nullableText(input, "noi_dung_thay_doi"),
        ngay_hieu_luc_truoc: previous.ngay_hieu_luc,
        ngay_hieu_luc_sau: payload.ngay_hieu_luc,
        ngay_het_hieu_luc_truoc: previous.ngay_het_hieu_luc,
        ngay_het_hieu_luc_sau: payload.ngay_het_hieu_luc,
        ghi_chu: null,
      });
      if (historyError) throw historyError;
    } else if (eventType === "gia_han") {
      if (!id) throw new Error("Vui lòng chọn CTS gốc cần gia hạn.");
      const { data: previous, error: previousError } = await supabase
        .from("thiet_bi_chung_thu_so")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) throw new Error("Không tìm thấy CTS gốc cần gia hạn.");
      if (previous.thoi_diem_thu_hoi) throw new Error("CTS đã thu hồi không thể gia hạn.");
      if (previous.da_gia_han || previous.chung_thu_goc_id) {
        throw new Error("CTS này đã qua một lần gia hạn. Vui lòng dùng Cấp mới để tạo CTS mới.");
      }

      const now = new Date().toISOString();
      const { error: retireError } = await supabase
        .from("thiet_bi_chung_thu_so")
        .update({
          da_gia_han: true,
          la_hien_hanh: false,
          thoi_diem_gia_han_gan_nhat: now,
        })
        .eq("id", previous.id);
      if (retireError) throw retireError;

      const insertPayload = {
        ...payload,
        thiet_bi_id: previous.thiet_bi_id,
        nguoi_su_dung_id: payload.nguoi_su_dung_id || previous.nguoi_su_dung_id,
        id_chung_thu_so_nguon:
          payload.id_chung_thu_so_nguon ?? previous.id_chung_thu_so_nguon ?? previous.so_hieu_chung_thu_so,
        chung_thu_goc_id: previous.id,
        da_gia_han: false,
        la_hien_hanh: true,
      };
      const { data: inserted, error: insertError } = await supabase
        .from("thiet_bi_chung_thu_so")
        .insert(insertPayload)
        .select("*")
        .single();
      if (insertError) throw insertError;

      await supabase
        .from("thiet_bi_chung_thu_so")
        .update({ chung_thu_thay_the_id: inserted.id })
        .eq("id", previous.id);

      const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
        thiet_bi_chung_thu_so_id: inserted.id,
        thiet_bi_id: previous.thiet_bi_id,
        loai_su_kien: "gia_han",
        nguoi_su_dung_id_truoc: previous.nguoi_su_dung_id,
        nguoi_su_dung_id_sau: insertPayload.nguoi_su_dung_id,
        so_hieu_chung_thu_so_truoc: previous.so_hieu_chung_thu_so,
        so_hieu_chung_thu_so_sau: inserted.so_hieu_chung_thu_so,
        email_truoc: previous.email,
        email_sau: inserted.email,
        ten_chung_thu_so_truoc: previous.ten_chung_thu_so,
        ten_chung_thu_so_sau: inserted.ten_chung_thu_so,
        to_chuc_truoc: previous.to_chuc,
        to_chuc_sau: inserted.to_chuc,
        thong_tin_chung_truoc: previous.thong_tin_chung,
        thong_tin_chung_sau: inserted.thong_tin_chung,
        ngay_hieu_luc_truoc: previous.ngay_hieu_luc,
        ngay_hieu_luc_sau: inserted.ngay_hieu_luc,
        ngay_het_hieu_luc_truoc: previous.ngay_het_hieu_luc,
        ngay_het_hieu_luc_sau: inserted.ngay_het_hieu_luc,
        ghi_chu: null,
      });
      if (historyError) throw historyError;
    } else {
      const { data: previousCurrent } = await supabase
        .from("thiet_bi_chung_thu_so")
        .select("*")
        .eq("thiet_bi_id", payload.thiet_bi_id)
        .eq("la_hien_hanh", true)
        .is("thoi_diem_thu_hoi", null)
        .maybeSingle();

      if (previousCurrent) {
        const { error: retireError } = await supabase
          .from("thiet_bi_chung_thu_so")
          .update({ la_hien_hanh: false })
          .eq("id", previousCurrent.id);
        if (retireError) throw retireError;
      }

      const { data: inserted, error } = await supabase
        .from("thiet_bi_chung_thu_so")
        .insert({
          ...payload,
          da_gia_han: false,
          la_hien_hanh: true,
        })
        .select("*")
        .single();
      if (error) throw error;

      if (previousCurrent) {
        await supabase
          .from("thiet_bi_chung_thu_so")
          .update({ chung_thu_thay_the_id: inserted.id })
          .eq("id", previousCurrent.id);
      }

      const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
        thiet_bi_chung_thu_so_id: inserted.id,
        thiet_bi_id: payload.thiet_bi_id,
        loai_su_kien: "cap_moi",
        nguoi_su_dung_id_truoc: previousCurrent?.nguoi_su_dung_id ?? null,
        nguoi_su_dung_id_sau: payload.nguoi_su_dung_id,
        so_hieu_chung_thu_so_truoc: previousCurrent?.so_hieu_chung_thu_so ?? null,
        so_hieu_chung_thu_so_sau: payload.so_hieu_chung_thu_so,
        email_truoc: previousCurrent?.email ?? null,
        email_sau: payload.email,
        ten_chung_thu_so_truoc: previousCurrent?.ten_chung_thu_so ?? null,
        ten_chung_thu_so_sau: payload.ten_chung_thu_so,
        to_chuc_truoc: previousCurrent?.to_chuc ?? null,
        to_chuc_sau: payload.to_chuc,
        thong_tin_chung_truoc: previousCurrent?.thong_tin_chung ?? null,
        thong_tin_chung_sau: payload.thong_tin_chung,
        ngay_hieu_luc_truoc: previousCurrent?.ngay_hieu_luc ?? null,
        ngay_hieu_luc_sau: payload.ngay_hieu_luc,
        ngay_het_hieu_luc_truoc: previousCurrent?.ngay_het_hieu_luc ?? null,
        ngay_het_hieu_luc_sau: payload.ngay_het_hieu_luc,
        ghi_chu: null,
      });
      if (historyError) throw historyError;
    }

    revalidatePath("/dashboard/chung-thu-so");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard");
    return success(
      eventType === "gia_han"
        ? "Đã gia hạn và tạo Serial CTS mới."
        : eventType === "thay_doi_thong_tin"
          ? "Đã ghi nhận thay đổi thông tin CTS."
          : "Đã cấp mới CTS."
    );
  } catch (error) {
    return failure(error);
  }
}

export async function importCertificatesAction(rows: EntityInput[]): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    if (!rows.length) throw new Error("Không có dòng CTS nào để import.");
    const supabase = await createClient();
    const [devicesResult, staffResult, existingResult] = await Promise.all([
      supabase.from("thiet_bi").select("id, ma_thiet_bi, nguoi_su_dung_id"),
      supabase.from("nguoi_dung").select("id, ho_ten, email"),
      supabase.from("thiet_bi_chung_thu_so").select("*"),
    ]);

    if (devicesResult.error) throw devicesResult.error;
    if (staffResult.error) throw staffResult.error;
    if (existingResult.error) throw existingResult.error;

    const deviceMap = new Map(
      (devicesResult.data ?? []).map((device) => [normalizeText(device.ma_thiet_bi), device])
    );
    const staffByEmail = new Map(
      (staffResult.data ?? [])
        .filter((staff) => staff.email)
        .map((staff) => [normalizeText(staff.email), staff])
    );
    const staffByName = new Map(
      (staffResult.data ?? []).map((staff) => [normalizeText(staff.ho_ten), staff])
    );
    const existingSerials = new Map(
      (existingResult.data ?? []).map((item) => [normalizeText(item.so_hieu_chung_thu_so), item])
    );

    const readyRows = rows
      .map((row) => {
        const deviceCode = requiredText(row, "so_hieu_thiet_bi", "mã thiết bị");
        const serial = requiredText(row, "so_hieu_chung_thu_so", "Serial CTS");
        const device = deviceMap.get(normalizeText(deviceCode));
        const staff =
          staffByEmail.get(normalizeText(nullableText(row, "email") ?? "")) ??
          staffByName.get(normalizeText(nullableText(row, "ten_chung_thu_so") ?? "")) ??
          (device?.nguoi_su_dung_id
            ? (staffResult.data ?? []).find((item) => item.id === device.nguoi_su_dung_id)
            : null);
        return { row, device, staff, serial };
      })
      .filter((item) => item.device && item.staff);

    if (!readyRows.length) {
      throw new Error("Không có dòng nào đủ điều kiện import. Cần khớp mã thiết bị và nhân sự trước.");
    }

    const grouped = new Map<number, typeof readyRows>();
    for (const item of readyRows) {
      const deviceId = item.device!.id;
      const current = grouped.get(deviceId) ?? [];
      current.push(item);
      grouped.set(deviceId, current);
    }

    let imported = 0;
    let skippedExisting = 0;

    for (const [deviceId, group] of grouped) {
      const sorted = [...group].sort((a, b) =>
        String(a.row.ngay_hieu_luc ?? "").localeCompare(String(b.row.ngay_hieu_luc ?? ""))
      );
      await supabase
        .from("thiet_bi_chung_thu_so")
        .update({ la_hien_hanh: false })
        .eq("thiet_bi_id", deviceId)
        .eq("la_hien_hanh", true)
        .is("thoi_diem_thu_hoi", null);

      let previousId: number | null = null;
      for (const [index, item] of sorted.entries()) {
        const existing = existingSerials.get(normalizeText(item.serial));
        const isLast = index === sorted.length - 1;
        const certPayload: TablesInsert<"thiet_bi_chung_thu_so"> = {
          thiet_bi_id: deviceId,
          nguoi_su_dung_id: item.staff!.id,
          so_hieu_chung_thu_so: item.serial,
          email: nullableText(item.row, "email"),
          ten_chung_thu_so: nullableText(item.row, "ten_chung_thu_so"),
          loai_chung_thu_so: nullableText(item.row, "loai_chung_thu_so"),
          to_chuc: nullableText(item.row, "to_chuc"),
          thong_tin_chung: nullableText(item.row, "thong_tin_chung"),
          id_chung_thu_so_nguon: nullableText(item.row, "id_chung_thu_so_nguon"),
          ngay_hieu_luc: requiredText(item.row, "ngay_hieu_luc", "ngày hiệu lực"),
          ngay_het_hieu_luc: requiredText(item.row, "ngay_het_hieu_luc", "ngày hết hạn"),
          da_gia_han: !isLast,
          la_hien_hanh: isLast,
          chung_thu_goc_id: previousId,
          ghi_chu: null,
        };

        const result = existing
          ? await supabase
              .from("thiet_bi_chung_thu_so")
              .update(certPayload)
              .eq("id", existing.id)
              .select("*")
              .single()
          : await supabase
              .from("thiet_bi_chung_thu_so")
              .insert(certPayload)
              .select("*")
              .single();
        if (result.error) throw result.error;

        if (previousId) {
          await supabase
            .from("thiet_bi_chung_thu_so")
            .update({ chung_thu_thay_the_id: result.data.id })
            .eq("id", previousId);
        }

        if (!existing) {
          const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
            thiet_bi_chung_thu_so_id: result.data.id,
            thiet_bi_id: deviceId,
            loai_su_kien: previousId ? "gia_han" : "cap_moi",
            nguoi_su_dung_id_sau: item.staff!.id,
            so_hieu_chung_thu_so_sau: item.serial,
            email_sau: certPayload.email,
            ten_chung_thu_so_sau: certPayload.ten_chung_thu_so,
            to_chuc_sau: certPayload.to_chuc,
            thong_tin_chung_sau: certPayload.thong_tin_chung,
            ngay_hieu_luc_sau: certPayload.ngay_hieu_luc,
            ngay_het_hieu_luc_sau: certPayload.ngay_het_hieu_luc,
            ghi_chu: null,
          });
          if (historyError) throw historyError;
          imported += 1;
        } else {
          skippedExisting += 1;
        }

        previousId = result.data.id;
      }
    }

    const skipped = rows.length - readyRows.length;
    revalidatePath("/dashboard/chung-thu-so");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard");
    return success(
      `Đã import ${imported} CTS mới. ${skippedExisting} serial đã có được cập nhật. ${skipped} dòng chưa đủ điều kiện được bỏ qua.`
    );
  } catch (error) {
    return failure(error);
  }
}

export async function revokeCertificateAction(input: number | EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const id = typeof input === "number" ? input : requiredNumber(input, "id", "CTS cần thu hồi");
    const reason = typeof input === "number" ? null : nullableText(input, "ly_do_thu_hoi");
    const customRevokeAt =
      typeof input === "number" ? null : nullableText(input, "thoi_diem_thu_hoi");
    const { data: previous, error: previousError } = await supabase
      .from("thiet_bi_chung_thu_so")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (previousError) throw previousError;
    if (!previous) throw new Error("Không tìm thấy chứng thư cần thu hồi.");

    let revokeAt = new Date().toISOString();
    if (customRevokeAt) {
      const parsed = new Date(customRevokeAt);
      if (!Number.isNaN(parsed.getTime())) {
        revokeAt = parsed.toISOString();
      }
    }
    const { error } = await supabase
      .from("thiet_bi_chung_thu_so")
      .update({ thoi_diem_thu_hoi: revokeAt, ly_do_thu_hoi: reason, la_hien_hanh: false })
      .eq("id", id);
    if (error) throw error;

    const { error: historyError } = await supabase.from("lich_su_chung_thu_so").insert({
      thiet_bi_chung_thu_so_id: previous.id,
      thiet_bi_id: previous.thiet_bi_id,
      loai_su_kien: "thu_hoi",
      thoi_diem_su_kien: revokeAt,
      nguoi_su_dung_id_truoc: previous.nguoi_su_dung_id,
      so_hieu_chung_thu_so_truoc: previous.so_hieu_chung_thu_so,
      email_truoc: previous.email,
      ten_chung_thu_so_truoc: previous.ten_chung_thu_so,
      to_chuc_truoc: previous.to_chuc,
      thong_tin_chung_truoc: previous.thong_tin_chung,
      ngay_hieu_luc_truoc: previous.ngay_hieu_luc,
      ngay_het_hieu_luc_truoc: previous.ngay_het_hieu_luc,
      ly_do_thu_hoi: reason,
      ghi_chu: null,
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
      ngay_thu_hoi: null,
      hinh_thuc: nullableText(input, "hinh_thuc"),
      noi_dung: nullableText(input, "noi_dung"),
      ghi_chu: null,
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
    revalidatePath("/dashboard/phong-ban");
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
      ghi_chu: null,
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

export async function saveSystemConfigAction(input: EntityInput): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const days = nullableNumber(input, "cts_canh_bao_so_ngay");
    if (days == null || days < 1 || days > 365) {
      throw new Error("Số ngày cảnh báo phải từ 1 đến 365.");
    }
    const { error } = await supabase
      .from("he_thong_cau_hinh")
      .upsert(
        {
          key: "cts_canh_bao_so_ngay",
          value: days,
          mo_ta: "So ngay truoc khi het hieu luc se danh dau CTS la sap_het_han.",
        },
        { onConflict: "key" }
      );
    if (error) throw error;
    revalidatePath("/dashboard/cau-hinh");
    revalidatePath("/dashboard/chung-thu-so");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard");
    return success("Đã cập nhật cấu hình hệ thống.");
  } catch (error) {
    return failure(error);
  }
}

export async function importDevicesAction(rows: EntityInput[]): Promise<ActionResult> {
  const denied = await ensureActionAllowed();
  if (denied) return denied;

  try {
    if (!rows.length) throw new Error("Không có dòng thiết bị nào để import.");
    const supabase = await createClient();
    const [deviceTypes, models, departments, statuses, sources, staff] = await Promise.all([
      supabase.from("loai_thiet_bi").select("id, ma_loai, ten_loai"),
      supabase.from("hang_model").select("id, ten_hang, ten_model"),
      supabase.from("phong_ban").select("id, ma_phong_ban, ten_phong_ban"),
      supabase.from("tinh_trang_thiet_bi").select("id, ma_tinh_trang, ten_tinh_trang"),
      supabase.from("nguon_goc_tai_san").select("id, ma_nguon_goc, ten_nguon_goc"),
      supabase.from("nguoi_dung").select("id, ho_ten, email, ten_dang_nhap"),
    ]);

    const findDeviceType = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (deviceTypes.data ?? []).find(
          (item) =>
            normalizeText(item.ma_loai ?? "") === term ||
            normalizeText(item.ten_loai) === term
        ) ?? null
      );
    };
    const findDepartment = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (departments.data ?? []).find(
          (item) =>
            normalizeText(item.ma_phong_ban ?? "") === term ||
            normalizeText(item.ten_phong_ban) === term
        ) ?? null
      );
    };
    const findStatus = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (statuses.data ?? []).find(
          (item) =>
            normalizeText(item.ma_tinh_trang ?? "") === term ||
            normalizeText(item.ten_tinh_trang) === term
        ) ?? null
      );
    };
    const findSource = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (sources.data ?? []).find(
          (item) =>
            normalizeText(item.ma_nguon_goc ?? "") === term ||
            normalizeText(item.ten_nguon_goc) === term
        ) ?? null
      );
    };
    const findStaff = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (staff.data ?? []).find(
          (item) =>
            normalizeText(item.email ?? "") === term ||
            normalizeText(item.ten_dang_nhap) === term ||
            normalizeText(item.ho_ten) === term
        ) ?? null
      );
    };
    const findModel = (value: string | null) => {
      const term = normalizeText(value ?? "");
      if (!term) return null;
      return (
        (models.data ?? []).find((item) => {
          const text = normalizeText(`${item.ten_hang ?? ""} ${item.ten_model ?? ""}`);
          return text.includes(term);
        }) ?? null
      );
    };

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      let ma = toOptionalString(String(row.ma_thiet_bi ?? ""));
      const ten = toOptionalString(String(row.ten_thiet_bi ?? ""));
      const loaiText = toOptionalString(String(row.loai_thiet_bi ?? ""));
      if (!ten || !loaiText) {
        skipped += 1;
        errors.push(`Dòng ${index + 1}: thiếu tên/loại thiết bị.`);
        continue;
      }
      const loai = findDeviceType(loaiText);
      if (!loai) {
        skipped += 1;
        errors.push(`Dòng ${index + 1}: không tìm thấy loại "${loaiText}".`);
        continue;
      }
      const department = findDepartment(toOptionalString(String(row.phong_ban ?? "")));
      const status = findStatus(toOptionalString(String(row.tinh_trang ?? "")));
      const source = findSource(toOptionalString(String(row.nguon_goc ?? "")));
      const user = findStaff(toOptionalString(String(row.nguoi_su_dung ?? "")));
      const model = findModel(toOptionalString(String(row.hang_model ?? "")));
      if (!ma) {
        const { data: generated, error: genError } = await supabase.rpc("gen_ma_thiet_bi");
        if (genError) {
          skipped += 1;
          errors.push(`Dòng ${index + 1}: ${genError.message}`);
          continue;
        }
        ma = generated ? String(generated) : null;
        if (!ma) {
          skipped += 1;
          errors.push(`Dòng ${index + 1}: không thể sinh mã thiết bị.`);
          continue;
        }
      }
      const payload = {
        ma_thiet_bi: ma,
        ten_thiet_bi: ten,
        loai_thiet_bi_id: loai.id,
        hang_model_id: model?.id ?? null,
        serial: nullableText(row, "serial"),
        nam_trang_bi: nullableNumber(row, "nam_trang_bi"),
        ngay_tiep_nhan: nullableText(row, "ngay_tiep_nhan"),
        nguon_goc_id: source?.id ?? null,
        tinh_trang_id: status?.id ?? null,
        phong_ban_id: department?.id ?? null,
        nguoi_su_dung_id: user?.id ?? null,
        thiet_bi_mat: boolValue(row, "thiet_bi_mat", false),
        dap_ung_cds: boolValue(row, "dap_ung_cds", false),
        nhom_cds: nullableText(row, "nhom_cds"),
        ghi_chu: nullableText(row, "ghi_chu"),
      };

      const { data: existing } = await supabase
        .from("thiet_bi")
        .select("id")
        .eq("ma_thiet_bi", ma)
        .maybeSingle();

      const result = existing
        ? await supabase.from("thiet_bi").update(payload).eq("id", existing.id)
        : await supabase.from("thiet_bi").insert(payload);
      if (result.error) {
        skipped += 1;
        errors.push(`Dòng ${index + 1}: ${result.error.message}`);
        continue;
      }
      if (existing) updated += 1;
      else imported += 1;
    }

    revalidatePath("/dashboard/thiet-bi");
    revalidatePath("/dashboard/bao-cao");
    revalidatePath("/dashboard");
    const detail = errors.length ? ` Lỗi: ${errors.slice(0, 5).join(" | ")}` : "";
    return success(
      `Đã thêm mới ${imported}, cập nhật ${updated}, bỏ qua ${skipped} dòng.${detail}`
    );
  } catch (error) {
    return failure(error);
  }
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
          ghi_chu: null,
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
          ghi_chu: null,
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
          ghi_chu: null,
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
          ghi_chu: null,
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
          ghi_chu: null,
        };
        const result = id
          ? await supabase.from("nguon_goc_tai_san").update(payload).eq("id", id)
          : await supabase.from("nguon_goc_tai_san").insert(payload);
        if (result.error) throw result.error;
        break;
      }
    }

    revalidatePath("/dashboard/danh-muc");
    revalidatePath("/dashboard/phong-ban");
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
    revalidatePath("/dashboard/phong-ban");
    return success("Đã xóa danh mục.");
  } catch (error) {
    return failure(error);
  }
}
