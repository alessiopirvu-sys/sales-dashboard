"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Download,
  ExternalLink,
  House,
  LayoutGrid,
  LoaderCircle,
  Menu,
  Users
} from "lucide-react";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { DevModeRoleSwitcher } from "@/components/layout/DevModeRoleSwitcher";
import { getSidebarItems } from "@/lib/auth/navigation";
import { AppRole } from "@/lib/internal-kpi/types";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  role: AppRole;
  displayName: string;
  roleLabel: string;
  devMode: boolean;
  open: boolean;
  onClose: () => void;
  onNavigateStart?: (label: string) => void;
};

const iconMap = {
  home: House,
  dashboard: LayoutGrid,
  users: Users,
  download: Download
} as const;

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
  isPending,
  external = false,
  onClick
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: boolean;
  isPending: boolean;
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span className="flex-1 text-left">{label}</span>
      {external ? <ExternalLink className="h-3.5 w-3.5 opacity-70" /> : null}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
    isActive || isPending
      ? "bg-primary text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}

export function AppSidebar({
  role,
  displayName,
  roleLabel,
  devMode,
  open,
  onClose,
  onNavigateStart
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sidebarItems = getSidebarItems(role);
  const menuItems = sidebarItems.slice(0, role === "seller" ? 3 : 3);
  const toolItems = role === "admin" ? sidebarItems.slice(3) : [];
  const initials = displayName
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigate = (href: string, label: string) => {
    if (pathname === href || (href === "/home" && pathname === "/")) {
      onClose();
      return;
    }

    onNavigateStart?.(label);
    onClose();

    startTransition(() => {
      router.push(href);
    });
  };

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
                  icon={iconMap[item.icon]}
                  isPending={isPending}
                  external={item.external}
                  isActive={
                    (!item.external && pathname === item.href) ||
                    (item.href === "/home" && pathname === "/")
                  }
                  onClick={
                    item.external
                      ? () => {
                          onClose();
                        }
                      : () => handleNavigate(item.href, item.label)
                  }
                />
              ))}
            </div>
          </section>

          {toolItems.length > 0 ? (
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
                    icon={iconMap[item.icon]}
                    isPending={isPending}
                    isActive={pathname === item.href}
                    onClick={() => handleNavigate(item.href, item.label)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            {devMode ? (
              <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">DEV MODE</p>
                <p className="mt-1 text-xs text-amber-100">Autenticazione simulata</p>
                <DevModeRoleSwitcher currentRole={role} />
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-white">
                {initials || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-xs text-slate-400">{roleLabel}</p>
              </div>
            </div>
            <LogoutButton
              className="mt-4 h-10 w-full justify-center border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
