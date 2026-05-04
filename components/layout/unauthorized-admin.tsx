import { ShieldAlert } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function UnauthorizedAdmin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-lg border border-border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold text-slate-950">
          Tài khoản chưa được cấp quyền quản trị
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Hệ thống chỉ cho phép tài khoản có vai trò Quản trị hoặc IT truy cập.
          Vui lòng liên hệ bộ phận kỹ thuật để liên kết tài khoản Supabase Auth
          với hồ sơ nhân sự phù hợp.
        </p>
        <form action={signOutAction} className="mt-5">
          <Button type="submit">Đăng xuất</Button>
        </form>
      </section>
    </main>
  );
}

