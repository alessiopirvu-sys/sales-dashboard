"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SellerRecord } from "@/lib/types";

type SellerManagementModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const initialForm = {
  name: ""
};

export function SellerManagementModal({
  open,
  onClose,
  onSaved
}: SellerManagementModalProps) {
  const [form, setForm] = useState(initialForm);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSellers = async () => {
    setIsLoadingSellers(true);
    setError(null);
    try {
      const response = await fetch("/api/sellers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossibile caricare i venditori.");
      }
      const payload = (await response.json()) as { sellers: SellerRecord[] };
      setSellers(payload.sellers ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il caricamento venditori."
      );
    } finally {
      setIsLoadingSellers(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadSellers();
    }
  }, [open]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/sellers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile salvare il venditore.");
      }

      setForm(initialForm);
      await loadSellers();
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il salvataggio."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sellerId: string) => {
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Impossibile eliminare il venditore.");
      }

      await loadSellers();
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante l'eliminazione."
      );
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl">
        <Card className="rounded-[2.4rem] border-white/90">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-[1.45rem]">Aggiungi venditore</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                Gestione venditori collegata ai KPI interni su Supabase.
              </p>
            </div>
            <Button variant="secondary" className="h-10 rounded-full px-4" onClick={onClose}>
              Chiudi
            </Button>
          </CardHeader>

          <CardContent className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-[1.8rem] bg-slate-50/90 p-5">
                <div className="grid gap-3">
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Nome venditore"
                    className="h-12"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="h-11 rounded-full px-4"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Salva
                  </Button>
                </div>

                {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-slate-50/90 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Venditori attivi
                </h3>
                {isLoadingSellers ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {sellers.length > 0 ? (
                  sellers.map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between rounded-[1.4rem] bg-white px-4 py-3 shadow-[0_18px_36px_-34px_rgba(35,77,153,0.28)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {seller.name}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        className="h-10 rounded-full px-3"
                        onClick={() => void handleDelete(seller.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] bg-white px-4 py-6 text-sm text-slate-500">
                    Nessun venditore configurato.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
