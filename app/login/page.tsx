import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getServerDevAuthRole, isDevAuthBypassEnabled } from "@/lib/auth/dev-mode";
import { requireActiveProfile } from "@/lib/auth/session";
import { resolveRoleHome } from "@/lib/auth/navigation";

export default async function LoginPage() {
  if (isDevAuthBypassEnabled()) {
    const devRole = getServerDevAuthRole();
    redirect(devRole === "admin" ? "/dashboard" : "/area-venditore/kpi");
  }

  try {
    const context = await requireActiveProfile();
    redirect(resolveRoleHome(context.profile.role));
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7fa] px-4 py-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    );
  }
}
