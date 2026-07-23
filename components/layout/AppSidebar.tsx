"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  House,
  LayoutGrid,
  LogOut,
  Menu,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const menuItems = [
  { href: "/home", label: "Home", icon: House },
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/venditori", label: "Venditori", icon: Users }
];

const toolItems = [
  { href: "/esportazioni", label: "Esportazioni", icon: Download }
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-[#0f0f12] text-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">Cold Sales</p>
              <p className="text-xs text-slate-400">SaaS KPI Workspace</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
          <section>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Menu
            </p>
            <div className="mt-3 space-y-2">
              {menuItems.map((item) => (
                <SidebarLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={
                    pathname === item.href ||
                    (item.href === "/home" && pathname === "/")
                  }
                  onClick={onClose}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Strumenti
            </p>
            <div className="mt-3 space-y-2">
              {toolItems.map((item) => (
                <SidebarLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                  onClick={onClose}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-white">
                D
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Daniele</p>
                <p className="truncate text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4 h-10 w-full justify-center border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
