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
          <h1 className="mt-4 font-heading text-xl font-bold leading-8 tracking-tight text-slate-950">
            Hệ thống quản lí thiết bị công nghệ thông tin Sở Dân Tộc và Tôn Giáo
          </h1>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
