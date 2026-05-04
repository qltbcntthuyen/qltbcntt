"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AdminProfile } from "@/lib/auth";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
              active
                ? "bg-blue-50 text-blue-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-slate-950">
              QLTBCNTT
            </p>
            <p className="text-xs text-slate-500">Quản trị thiết bị CNTT</p>
          </div>
        </div>
        <div className="py-4">
          <NavList />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Mở điều hướng</span>
            </Button>
            <div>
              <p className="font-heading text-sm font-semibold text-slate-950">
                Hệ thống quản lý trang thiết bị CNTT
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Quản lý thiết bị, chứng thư số, bàn giao, bảo trì và báo cáo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{profile.ho_ten}</p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[profile.vai_tro] ?? profile.vai_tro}
              </p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" />
                Đăng xuất
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1440px] px-4 py-5 lg:px-6">
          {children}
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Đóng điều hướng"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold">QLTBCNTT</p>
                  <p className="text-xs text-slate-500">Quản trị hệ thống</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
                <span className="sr-only">Đóng</span>
              </Button>
            </div>
            <div className="py-4">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

