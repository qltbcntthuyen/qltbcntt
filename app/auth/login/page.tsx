import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { getAdminGateState } from "@/lib/auth";

export default async function LoginPage() {
  const gate = await getAdminGateState();

  if (gate.status === "authorized") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-slate-950">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            QLTBCNTT dành riêng cho tài khoản quản trị hoặc cán bộ IT đã được
            cấp quyền.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 border-t border-border pt-4 text-center text-xs leading-5 text-slate-500">
          Không lưu trữ mật khẩu trong hệ thống nội bộ. Việc xác thực được xử lý
          bằng Supabase Auth.
        </p>
      </section>
    </main>
  );
}

