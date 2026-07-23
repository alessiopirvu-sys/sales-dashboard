"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  CalendarDays,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  RefreshCw
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildDashboardUrlWithOptions, resolveDateRange } from "@/lib/data/filters";
import {
  buildExportFilename,
  createExportCsv,
  createExportJson,
  createPrintableReportHtml,
  downloadTextFile,
  ExportFormat,
  ExportScope
} from "@/lib/export-utils";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import { DashboardFilters, DashboardResponse, SellerRecord } from "@/lib/types";

const presets: Array<{ label: string; value: DashboardFilters["preset"] }> = [
  { label: "Oggi", value: "today" },
  { label: "Settimana", value: "week" },
  { label: "Mese", value: "month" },
  { label: "Range personalizzato", value: "custom" }
];

const formatOptions: Array<{ value: ExportFormat; label: string; icon: typeof FileSpreadsheet }> = [
  { value: "csv", label: "CSV / Excel", icon: FileSpreadsheet },
  { value: "json", label: "JSON", icon: FileJson },
  { value: "pdf", label: "PDF stampabile", icon: FileText }
];

const scopeOptions: Array<{ value: ExportScope; label: string }> = [
  { value: "full", label: "Report completo" },
  { value: "summary", label: "Solo riepilogo KPI" },
  { value: "ranking", label: "Solo ranking venditori" },
  { value: "trend", label: "Solo trend fatturato" }
];

const initialFilters: DashboardFilters = {
  preset: "month",
  seller: "all"
};

export function ExportsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [formatType, setFormatType] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>("full");
  const [filename, setFilename] = useState("cold-sales-report");
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSellers = async () => {
    const response = await fetch("/api/sellers", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Impossibile caricare i venditori.");
    }

    const payload = (await response.json()) as { sellers: SellerRecord[] };
    setSellers(payload.sellers ?? []);
  };

  const loadPreviewData = async (nextFilters: DashboardFilters, forceFresh = false) => {
    const response = await fetch(
      buildDashboardUrlWithOptions(
        nextFilters,
        forceFresh
          ? { cacheBust: String(Date.now()), details: "lite" }
          : { details: "lite" }
      ),
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Impossibile caricare i dati per l'esportazione.");
    }

    const payload = (await response.json()) as DashboardResponse;
    setData(payload);
  };

  const refreshAll = async (nextFilters = filters, forceFresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([loadSellers(), loadPreviewData(nextFilters, forceFresh)]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il caricamento export."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll(filters);
  }, [filters]);

  const sellerOptions = useMemo(
    () => [{ label: "Tutti i venditori", value: "all" }, ...sellers.map((seller) => ({ label: seller.name, value: seller.name }))],
    [sellers]
  );

  const sellerLabel = sellerOptions.find((option) => option.value === filters.seller)?.label ?? "Tutti i venditori";
  const activeRange = resolveDateRange(filters);
  const activeRangeLabel = `${format(new Date(activeRange.startDate), "dd MMMM yyyy", {
    locale: it
  })} - ${format(new Date(activeRange.endDate), "dd MMMM yyyy", { locale: it })}`;

  const handleExport = async () => {
    if (!data) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const finalFilename = buildExportFilename(filename, formatType, filters, scope);

      if (formatType === "csv") {
        const csvContent = createExportCsv(data, filters, scope, sellerLabel);
        downloadTextFile(csvContent, finalFilename, "text/csv;charset=utf-8;");
      } else if (formatType === "json") {
        const jsonContent = createExportJson(data, filters, scope, sellerLabel);
        downloadTextFile(jsonContent, finalFilename, "application/json;charset=utf-8;");
      } else {
        const printableHtml = createPrintableReportHtml(data, filters, scope, sellerLabel);
        const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
        if (!printWindow) {
          throw new Error("Il browser ha bloccato la finestra di stampa PDF.");
        }

        printWindow.document.open();
        printWindow.document.write(printableHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante l'esportazione."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
            Strumenti
          </p>
          <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
            Esportazioni
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Prepara export in formato CSV, JSON o PDF in base a periodo, venditore e contenuto del report.
          </p>
        </div>

        <Button variant="secondary" className="h-11 rounded-2xl px-5" onClick={() => void refreshAll(filters, true)}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Aggiorna dati
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Periodo</p>
            <p className="mt-3 text-sm font-semibold text-slate-950">{activeRangeLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Venditore</p>
            <p className="mt-3 text-sm font-semibold text-slate-950">{sellerLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Righe ranking</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{data ? data.ranking.length : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ultimo aggiornamento</p>
            <p className="mt-3 text-sm font-semibold text-slate-950">
              {data?.meta.lastUpdated
                ? format(new Date(data.meta.lastUpdated), "dd MMM yyyy, HH:mm", { locale: it })
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Configurazione export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Periodo</p>
              <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
                {presets.map((preset) => {
                  const isActive = filters.preset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFilters((current) => ({ ...current, preset: preset.value }))}
                      className={`h-10 rounded-xl px-4 text-sm font-semibold transition-colors ${
                        isActive ? "bg-primary text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {filters.preset === "custom" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <Input
                      type="date"
                      value={filters.startDate ?? ""}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, startDate: event.target.value }))
                      }
                      className="h-11 rounded-2xl border-slate-200 pl-11"
                    />
                  </div>
                  <Input
                    type="date"
                    value={filters.endDate ?? ""}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, endDate: event.target.value }))
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
              ) : null}
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Venditore</label>
                <Select
                  value={filters.seller}
                  onValueChange={(value) => setFilters((current) => ({ ...current, seller: value }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                    <SelectValue placeholder="Seleziona venditore" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Formato</label>
                <Select value={formatType} onValueChange={(value) => setFormatType(value as ExportFormat)}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                    <SelectValue placeholder="Formato export" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Contenuto report</label>
                <Select value={scope} onValueChange={(value) => setScope(value as ExportScope)}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                    <SelectValue placeholder="Contenuto export" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Nome file</label>
                <Input
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  placeholder="cold-sales-report"
                  className="h-11 rounded-2xl border-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="h-11 rounded-2xl px-5" disabled={isExporting || isLoading || !data} onClick={() => void handleExport()}>
                {isExporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {formatType === "pdf" ? "Apri report PDF" : "Scarica export"}
              </Button>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                {scopeOptions.find((option) => option.value === scope)?.label}
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                {formatOptions.find((option) => option.value === formatType)?.label}
              </Badge>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Anteprima contenuto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formato selezionato</p>
              <div className="mt-3 flex items-center gap-3">
                {(() => {
                  const selectedFormat = formatOptions.find((option) => option.value === formatType);
                  const Icon = selectedFormat?.icon ?? FileText;
                  return (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{selectedFormat?.label}</p>
                        <p className="text-sm text-slate-500">
                          {formatType === "pdf" ? "Report pronto per stampa o salvataggio PDF." : "Download diretto del file."}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fatturato totale</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {data ? formatCurrency(data.summary.revenueTotal) : "—"}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chiusi totali</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {data ? formatCompactNumber(data.summary.dealsClosedTotal) : "—"}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Punti trend inclusi</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data ? data.trend.length : "—"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File generato</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-700">
                {buildExportFilename(filename, formatType, filters, scope)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
