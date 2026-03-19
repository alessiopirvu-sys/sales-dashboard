"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { SellerRecord, SellerValidationResult } from "@/lib/types";

type AddSellerModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  seller?: SellerRecord | null;
};

const initialForm = {
  name: "",
  sheetUrl: ""
};

export function AddSellerModal({ open, onClose, onSaved, seller }: AddSellerModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<SellerValidationResult | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: seller?.name ?? "",
        sheetUrl: seller?.sheet_url ?? ""
      });
      setError(null);
      setValidation(null);
    } else {
      setForm(initialForm);
      setError(null);
      setValidation(null);
      setIsSaving(false);
      setIsVerifying(false);
    }
  }, [open, seller]);

  const localUrlError = useMemo(() => {
    if (!form.sheetUrl.trim()) {
      return null;
    }

    return isValidGoogleSheetsCsvUrl(form.sheetUrl.trim()) ? null : INVALID_SHEETS_CSV_MESSAGE;
  }, [form.sheetUrl]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    setValidation(null);

    try {
      const response = await fetch("/api/sellers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sheetUrl: form.sheetUrl })
      });

      const payload = (await response.json()) as SellerValidationResult & { error?: string };
      setValidation(payload);
      if (!response.ok && payload.message) {
        setError(payload.message);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante la verifica del foglio."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (localUrlError) {
        throw new Error(localUrlError);
      }

      const method = seller ? "PATCH" : "POST";
      const url = seller ? `/api/sellers/${seller.id}` : "/api/sellers";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          sheetUrl: form.sheetUrl
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile salvare il venditore.");
      }

      await onSaved();
      onClose();
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl">
        <Card className="rounded-[2.2rem] border-white/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-[1.35rem]">
              {seller ? "Modifica venditore" : "Aggiungi venditore"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-600">Nome venditore</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Mario Rossi"
                className="h-12"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-600">
                Link Google Sheet (CSV)
              </label>
              <Input
                value={form.sheetUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sheetUrl: event.target.value }))
                }
                placeholder="https://docs.google.com/spreadsheets/.../output=csv"
                className="h-12"
              />
              <p className="text-xs text-slate-500">
                Usa solo un Google Sheets published CSV link con `output=csv`. I link `pubhtml`
                non sono validi.
              </p>
              {localUrlError ? <p className="text-sm text-amber-600">{localUrlError}</p> : null}
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="secondary"
                className="h-11 rounded-full px-5"
                onClick={() => void handleVerify()}
                disabled={isVerifying || !!localUrlError || !form.sheetUrl.trim()}
              >
                {isVerifying ? "Verifica..." : "Verifica foglio"}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-11 rounded-full px-5" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="h-11 rounded-full px-5"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving || !!localUrlError}
                >
                  {isSaving ? "Salvataggio..." : "Salva venditore"}
                </Button>
              </div>
            </div>

            {validation ? (
              <div
                className={`rounded-[1.2rem] px-4 py-3 text-sm ${
                  validation.valid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {validation.message}
              </div>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
