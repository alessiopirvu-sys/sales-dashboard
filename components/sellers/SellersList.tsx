"use client";

import { CircleDot, Link2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerRecord } from "@/lib/types";

type SellersListProps = {
  sellers: SellerRecord[];
  isLoading?: boolean;
  onEdit: (seller: SellerRecord) => void;
  onDelete: (seller: SellerRecord) => void;
};

function formatConnectionLabel(sheetUrl: string) {
  try {
    const url = new URL(sheetUrl);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastSegments = pathSegments.slice(-2).join("/");
    return `${url.hostname.replace("www.", "")}/${lastSegments}`;
  } catch {
    return sheetUrl.length > 42 ? `${sheetUrl.slice(0, 42)}...` : sheetUrl;
  }
}

export function SellersList({
  sellers,
  isLoading = false,
  onEdit,
  onDelete
}: SellersListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[1.2rem]">Gestione venditori</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {sellers.length} {sellers.length === 1 ? "connessione attiva" : "connessioni attive"}
            </p>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Admin
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-5 pt-0 sm:p-7 sm:pt-0">
        {isLoading ? (
          <div className="rounded-[1.45rem] bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Caricamento venditori...
          </div>
        ) : sellers.length > 0 ? (
          <div className="subtle-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className="rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(243,247,252,0.94))] p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.4)] sm:rounded-[1.6rem] sm:p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.98rem] font-semibold text-slate-900">{seller.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <CircleDot className="h-3.5 w-3.5" />
                        {seller.is_active ? "Attivo" : "Disattivo"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span className="truncate">{formatConnectionLabel(seller.sheet_url)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">{seller.sheet_url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      className="h-10 rounded-full px-3.5"
                      onClick={() => onEdit(seller)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-10 rounded-full px-3.5 text-rose-600 hover:text-rose-700"
                      onClick={() => onDelete(seller)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.45rem] bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Nessun venditore disponibile.
          </div>
        )}
      </CardContent>
    </div>
  );
}
