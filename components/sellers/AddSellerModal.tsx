"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getDuplicateSellerSheetError,
  INVALID_SHEETS_CSV_MESSAGE,
  isValidGoogleSheetsCsvUrl
} from "@/lib/google-sheets-url";
import { getCurrentSellerSheetYear, getSellerSheetEntries, getSellerSheetsMap } from "@/lib/seller-sheets";
import { SellerRecord, SellerSheetsMap } from "@/lib/types";

type AddSellerModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  seller?: SellerRecord | null;
};

type MonthModalState = {
  open: boolean;
  editingKey: string | null;
  year: string;
  month: string;
  url: string;
  error: string | null;
};

const currentYear = getCurrentSellerSheetYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => String(currentYear - 1 + index));
const monthOptions = [
  { value: "01", label: "Gennaio" },
  { value: "02", label: "Febbraio" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Aprile" },
  { value: "05", label: "Maggio" },
  { value: "06", label: "Giugno" },
  { value: "07", label: "Luglio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Settembre" },
  { value: "10", label: "Ottobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Dicembre" }
];

const initialForm = {
  name: "",
  sheets: {} as SellerSheetsMap
};

const initialMonthModalState: MonthModalState = {
  open: false,
  editingKey: null,
  year: String(currentYear),
  month: "01",
  url: "",
  error: null
};

function formatTruncatedUrl(url: string) {
  return url.length > 44 ? `${url.slice(0, 44)}...` : url;
}

export function AddSellerModal({ open, onClose, onSaved, seller }: AddSellerModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthModal, setMonthModal] = useState<MonthModalState>(initialMonthModalState);

  useEffect(() => {
    if (open) {
      setForm({
        name: seller?.name ?? "",
        sheets: getSellerSheetsMap(seller ?? {})
      });
      setError(null);
      setMonthModal(initialMonthModalState);
    } else {
      setForm(initialForm);
      setError(null);
      setIsSaving(false);
      setMonthModal(initialMonthModalState);
    }
  }, [open, seller]);

  const sheetEntries = useMemo(() => getSellerSheetEntries({ sheets: form.sheets }), [form.sheets]);

  const duplicateSheetError = useMemo(
    () =>
      getDuplicateSellerSheetError(sheetEntries.map((entry) => ({ label: entry.label, url: entry.url }))),
    [sheetEntries]
  );

  const openAddMonthModal = () => {
    setMonthModal({
      open: true,
      editingKey: null,
      year: String(currentYear),
      month: "01",
      url: "",
      error: null
    });
  };

  const openEditMonthModal = (key: string) => {
    const [year, month] = key.split("-");
    setMonthModal({
      open: true,
      editingKey: key,
      year,
      month,
      url: form.sheets[key] ?? "",
      error: null
    });
  };

  const closeMonthModal = () => {
    setMonthModal(initialMonthModalState);
  };

  const handleSaveMonth = () => {
    const nextKey = `${monthModal.year}-${monthModal.month}`;
    const trimmedUrl = monthModal.url.trim();

    if (!trimmedUrl) {
      setMonthModal((current) => ({ ...current, error: "Il link CSV e obbligatorio." }));
      return;
    }

    if (!isValidGoogleSheetsCsvUrl(trimmedUrl)) {
      setMonthModal((current) => ({ ...current, error: INVALID_SHEETS_CSV_MESSAGE }));
      return;
    }

    if (monthModal.editingKey !== nextKey && form.sheets[nextKey]) {
      setMonthModal((current) => ({
        ...current,
        error: "Esiste gia un collegamento configurato per questo mese."
      }));
      return;
    }

    const nextSheets = { ...form.sheets };
    if (monthModal.editingKey && monthModal.editingKey !== nextKey) {
      delete nextSheets[monthModal.editingKey];
    }
    nextSheets[nextKey] = trimmedUrl;

    const nextDuplicateError = getDuplicateSellerSheetError([
      ...getSellerSheetEntries({ sheets: nextSheets }).map((entry) => ({
        label: entry.label,
        url: entry.url
      }))
    ]);

    if (nextDuplicateError) {
      setMonthModal((current) => ({ ...current, error: nextDuplicateError }));
      return;
    }

    setForm((current) => ({ ...current, sheets: nextSheets }));
    closeMonthModal();
  };

  const handleDeleteMonth = (key: string) => {
    setForm((current) => {
      const nextSheets = { ...current.sheets };
      delete nextSheets[key];
      return { ...current, sheets: nextSheets };
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (duplicateSheetError) {
        throw new Error(duplicateSheetError);
      }

      if (sheetEntries.length === 0) {
        throw new Error("Aggiungi almeno un foglio mensile prima di salvare.");
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
          sheets: form.sheets
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
      <div className="w-full max-w-4xl">
        <Card className="rounded-[2.2rem] border-white/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-[1.35rem]">
              {seller ? "Modifica venditore" : "Aggiungi venditore"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <section className="space-y-4 rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Google Sheets</h3>
                  <p className="text-xs text-slate-500">
                    Configura solo i mesi realmente necessari. Il venditore usera soltanto i fogli mensili.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 rounded-full px-4"
                  onClick={openAddMonthModal}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi mese
                </Button>
              </div>

              {sheetEntries.length > 0 ? (
                <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anno</TableHead>
                        <TableHead>Mese</TableHead>
                        <TableHead>Link CSV</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetEntries.map((entry) => (
                        <TableRow key={entry.key}>
                          <TableCell>{entry.year}</TableCell>
                          <TableCell>{entry.label.split(" ")[0]}</TableCell>
                          <TableCell className="max-w-[260px]">
                            <span title={entry.url} className="block truncate">
                              {formatTruncatedUrl(entry.url)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 rounded-full px-3"
                                onClick={() => openEditMonthModal(entry.key)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifica
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 rounded-full px-3 text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteMonth(entry.key)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                  Nessun mese configurato.
                </div>
              )}
            </section>

            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="h-12 rounded-full px-5"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Annulla
                </Button>
                <Button
                  className="h-12 rounded-full px-5"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvataggio..." : seller ? "Salva modifiche" : "Crea venditore"}
                </Button>
              </div>
            </div>

            {duplicateSheetError ? (
              <p className="text-sm text-amber-600">{duplicateSheetError}</p>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </CardContent>
        </Card>
      </div>

      {monthModal.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/20 px-4">
          <Card className="w-full max-w-lg rounded-[2rem] border-white/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">
                {monthModal.editingKey ? "Modifica mese" : "Aggiungi mese"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-600">Anno</label>
                  <Select
                    value={monthModal.year}
                    onValueChange={(value) =>
                      setMonthModal((current) => ({ ...current, year: value, error: null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona anno" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((yearOption) => (
                        <SelectItem key={yearOption} value={yearOption}>
                          {yearOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-600">Mese</label>
                  <Select
                    value={monthModal.month}
                    onValueChange={(value) =>
                      setMonthModal((current) => ({ ...current, month: value, error: null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona mese" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((monthOption) => (
                        <SelectItem key={monthOption.value} value={monthOption.value}>
                          {monthOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-600">Link CSV</label>
                <Input
                  value={monthModal.url}
                  onChange={(event) =>
                    setMonthModal((current) => ({
                      ...current,
                      url: event.target.value,
                      error: null
                    }))
                  }
                  placeholder="https://docs.google.com/spreadsheets/.../output=csv"
                  className="h-12"
                />
              </div>

              {monthModal.error ? (
                <p className="text-sm text-amber-600">{monthModal.error}</p>
              ) : null}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 rounded-full px-4"
                  onClick={closeMonthModal}
                >
                  Annulla
                </Button>
                <Button type="button" className="h-11 rounded-full px-4" onClick={handleSaveMonth}>
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
