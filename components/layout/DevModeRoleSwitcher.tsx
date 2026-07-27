"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AppRole } from "@/lib/internal-kpi/types";
import { cn } from "@/lib/utils";

type DevModeRoleSwitcherProps = {
  currentRole: AppRole;
};

export function DevModeRoleSwitcher({ currentRole }: DevModeRoleSwitcherProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const switchRole = (role: AppRole) => {
    if (role === selectedRole || isPending) {
      return;
    }

    setSelectedRole(role);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/dev-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role })
        });

        const payload = (await response.json()) as { message?: string; redirectTo?: string };

        if (!response.ok || !payload.redirectTo) {
          throw new Error(payload.message || "Impossibile aggiornare la modalita DEV.");
        }

        router.push(payload.redirectTo);
        router.refresh();
      } catch (requestError) {
        setSelectedRole(currentRole);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Impossibile aggiornare la modalita DEV."
        );
      }
    });
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(["admin", "seller"] as AppRole[]).map((role) => (
          <Button
            key={role}
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              "h-9 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
              selectedRole === role && "bg-primary text-white hover:bg-primary/95"
            )}
            onClick={() => switchRole(role)}
            disabled={isPending}
          >
            {role === "admin" ? "Admin" : "Seller"}
          </Button>
        ))}
      </div>
      {error ? <p className="text-[11px] text-rose-200">{error}</p> : null}
    </div>
  );
}
