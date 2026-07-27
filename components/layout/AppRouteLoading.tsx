"use client";

import { LoaderCircle } from "lucide-react";

type AppRouteLoadingProps = {
  message?: string;
};

export function AppRouteLoading({ message = "Stiamo aprendo la pagina..." }: AppRouteLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%),#f7f7fa] px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary">
          <LoaderCircle className="h-7 w-7 animate-spin" />
        </div>
        <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-slate-950">
          Caricamento in corso
        </p>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
