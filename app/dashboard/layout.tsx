import { AppShell } from "@/components/layout/app-shell";
import { UnauthorizedAdmin } from "@/components/layout/unauthorized-admin";
import { getAdminGateState } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await getAdminGateState();

  if (gate.status === "unauthenticated") {
    redirect("/auth/login");
  }

  if (gate.status !== "authorized") {
    return <UnauthorizedAdmin />;
  }

  return <AppShell profile={gate.profile}>{children}</AppShell>;
}

