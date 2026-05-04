import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ADMIN_ROLES } from "@/lib/constants";
import { createClient } from "@/lib/server";
import type { Tables } from "@/lib/database.types";

export type AdminProfile = Tables<"nguoi_dung">;

export type AdminGateState =
  | { status: "unauthenticated"; profile: null; userId: null }
  | { status: "missing-profile"; profile: null; userId: string }
  | { status: "forbidden"; profile: AdminProfile; userId: string }
  | { status: "authorized"; profile: AdminProfile; userId: string };

export const getAdminGateState = cache(async (): Promise<AdminGateState> => {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"));

  if (!hasAuthCookie) {
    return { status: "unauthenticated", profile: null, userId: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return { status: "unauthenticated", profile: null, userId: null };
  }

  const { data: profile } = await supabase
    .from("nguoi_dung")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!profile || !profile.trang_thai) {
    return { status: "missing-profile", profile: null, userId };
  }

  if (!(ADMIN_ROLES as readonly string[]).includes(profile.vai_tro)) {
    return { status: "forbidden", profile, userId };
  }

  return { status: "authorized", profile, userId };
});

export async function requireAdminProfile() {
  const gate = await getAdminGateState();
  if (gate.status === "unauthenticated") {
    redirect("/auth/login");
  }
  if (gate.status !== "authorized") {
    throw new Error("Tài khoản chưa được cấp quyền quản trị");
  }
  return gate.profile;
}

export async function requireAdminForAction() {
  const gate = await getAdminGateState();
  if (gate.status !== "authorized") {
    return {
      ok: false as const,
      message:
        gate.status === "unauthenticated"
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Tài khoản chưa được cấp quyền quản trị.",
    };
  }
  return { ok: true as const, profile: gate.profile };
}
