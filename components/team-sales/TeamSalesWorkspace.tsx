"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deriveDashboardData, formatCurrency, formatPercent } from "@/lib/team-sales/workbook";
import { RegisteredSeller, TeamSalesMonthData, TeamSalesPendingRow, TeamSalesSeller } from "@/lib/team-sales/types";

const MONTH_LABELS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre"
];

function formatMonthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1] ?? month} ${year}`;
}

type TabId = "dashboard" | "setup" | "inserimenti" | "pending";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "setup", label: "Setup mese" },
  { id: "inserimenti", label: "Inserimenti" },
  { id: "pending", label: "Pending" }
];

type Feedback = { type: "success" | "error"; message: string };

function ModalShell({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}

export function TeamSalesWorkspace({
  teamId,
  activeTab,
  canManageSetup
}: {
  teamId: string;
  activeTab: TabId;
  canManageSetup: boolean;
}) {
  const [data, setData] = useState<TeamSalesMonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/team-sales/${teamId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Impossibile caricare la squadra.");
      }
      setData(payload as TeamSalesMonthData);
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Errore di caricamento." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const dashboard = useMemo(() => (data ? deriveDashboardData(data) : null), [data]);

  // Salva prima sul server e ricarica solo dopo la conferma: se il salvataggio
  // fallisce l'utente non vede mai in UI un dato che non e' stato persistito.
  const persist = async (next: TeamSalesMonthData, successMessage: string) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/team-sales/${teamId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMonthId: next.teamMonthId,
          setup: next.setup,
          pending: next.pending
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Salvataggio fallito.");
      }
      await load();
      setFeedback({ type: "success", message: successMessage });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Errore durante il salvataggio."
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !data || !dashboard) {
    return (
      <main className="mx-auto max-w-[1480px]">
        <Card>
          <CardContent className="flex min-h-[320px] items-center justify-center p-6">
            <div className="flex items-center gap-3 text-slate-500">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
              <span>Caricamento squadra…</span>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Team Sales</p>
          <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
            {data.setup.teamName}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 md:text-sm">
            <Clock3 className="h-4 w-4 text-primary" />
            {data.setup.monthLabel}
          </div>
        </div>
        <Link href="/team-sales" className="text-sm font-semibold text-primary">
          &larr; Torna alle squadre
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/team-sales/${teamId}/${tab.id}`}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {feedback ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      {activeTab === "dashboard" ? <DashboardTab dashboard={dashboard} /> : null}
      {activeTab === "setup" ? (
        <SetupTab data={data} canManage={canManageSetup} isSaving={isSaving} onSave={persist} />
      ) : null}
      {activeTab === "inserimenti" ? (
        <InserimentiTab data={data} dashboard={dashboard} />
      ) : null}
      {activeTab === "pending" ? (
        <PendingTab data={data} dashboard={dashboard} isSaving={isSaving} onSave={persist} />
      ) : null}
    </div>
  );
}

// !bg-* forza l'important: il componente Card applica di default la classe
// "surface-card" (globals.css) che fissa `background: #ffffff` in CSS puro,
// e vince a parita' di specificita' su una normale utility bg-* di Tailwind.
const STAT_TONE_STYLES = {
  hero: "border-transparent !bg-primary text-white",
  positive: "border-emerald-200 !bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 !bg-amber-50 text-amber-950",
  info: "border-[#3B5BFF]/20 !bg-[#EEF2FF] text-slate-950",
  plain: "text-slate-950"
} as const;

const STAT_LABEL_TONE_STYLES = {
  hero: "text-white/70",
  positive: "text-emerald-700",
  warning: "text-amber-700",
  info: "text-[#3B5BFF]",
  plain: "text-slate-500"
} as const;

const STAT_DESCRIPTION_TONE_STYLES = {
  hero: "text-white/60",
  positive: "text-emerald-700/80",
  warning: "text-amber-700/80",
  info: "text-slate-500",
  plain: "text-slate-500"
} as const;

function StatCard({
  label,
  value,
  description,
  tone = "plain"
}: {
  label: string;
  value: string;
  description: string;
  tone?: keyof typeof STAT_TONE_STYLES;
}) {
  return (
    <Card className={cn("overflow-hidden", STAT_TONE_STYLES[tone])}>
      <CardContent className="p-4 sm:p-6">
        <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", STAT_LABEL_TONE_STYLES[tone])}>
          {label}
        </p>
        <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] sm:text-[1.9rem]">{value}</p>
        <p className={cn("mt-2 text-sm", STAT_DESCRIPTION_TONE_STYLES[tone])}>{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardTab({ dashboard }: { dashboard: ReturnType<typeof deriveDashboardData> }) {
  const { summary } = dashboard;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Obiettivo del mese"
          value={formatCurrency(summary.targetTotal)}
          description="Target complessivo del team"
          tone="hero"
        />
        <StatCard
          label="Venduto finora"
          value={formatCurrency(summary.soldTotal)}
          description="Cumulato aggiornato"
          tone="positive"
        />
        <StatCard
          label="Manca all'obiettivo"
          value={formatCurrency(summary.missingToTarget)}
          description="Gap residuo da chiudere"
          tone={summary.missingToTarget > 0 ? "warning" : "positive"}
        />
        <StatCard
          label="Avanzamento"
          value={formatPercent(summary.progress)}
          description="Percentuale del target raggiunta"
          tone="info"
        />

        <StatCard
          label="Media/giorno da tenere"
          value={formatCurrency(summary.targetDaily)}
          description="Ritmo ideale giornaliero"
        />
        <StatCard
          label="Media/giorno attuale"
          value={formatCurrency(summary.currentDaily)}
          description="Venduto medio per giorno compilato"
        />
        <StatCard
          label="Nuova media richiesta"
          value={formatCurrency(summary.requiredDaily)}
          description="Media da tenere da domani"
        />
        <StatCard
          label="Media settimanale target"
          value={formatCurrency(summary.targetWeekly)}
          description="Target teorico su 5 giorni"
        />

        <StatCard
          label="Giorni rimasti"
          value={String(summary.daysRemaining)}
          description="Giorni lavorativi ancora aperti"
        />
        <StatCard
          label="Proiezione fine mese"
          value={formatCurrency(summary.monthProjection)}
          description="Se mantenete il ritmo attuale"
        />
        <StatCard
          label="Giorni compilati"
          value={String(summary.daysElapsed)}
          description="Righe giornaliere valorizzate"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classifica venditori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Venditore</TableHead>
                  <TableHead className="text-right">Venduto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.salesBySeller.length > 0 ? (
                  dashboard.salesBySeller.map((row) => (
                    <TableRow key={row.name} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-900">{row.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-32 text-center text-slate-500">
                      Nessun venditore in questa squadra.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SetupTab({
  data,
  canManage,
  isSaving,
  onSave
}: {
  data: TeamSalesMonthData;
  canManage: boolean;
  isSaving: boolean;
  onSave: (next: TeamSalesMonthData, message: string) => Promise<void>;
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [isEditing, setIsEditing] = useState(false);
  const [year, setYear] = useState(data.setup.year);
  const [month, setMonth] = useState(data.setup.month);
  const [workingDays, setWorkingDays] = useState(String(data.setup.workingDays));
  const [sellers, setSellers] = useState<TeamSalesSeller[]>(data.setup.sellers);
  const [registeredSellers, setRegisteredSellers] = useState<RegisteredSeller[]>([]);
  const [sellerToAdd, setSellerToAdd] = useState("");

  useEffect(() => {
    setYear(data.setup.year);
    setMonth(data.setup.month);
    setWorkingDays(String(data.setup.workingDays));
    setSellers(data.setup.sellers);
  }, [data]);

  useEffect(() => {
    if (!canManage) return;
    fetch("/api/sellers", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { sellers?: RegisteredSeller[] }) => {
        setRegisteredSellers((payload.sellers ?? []).filter((seller) => seller.is_active));
      })
      .catch(() => setRegisteredSellers([]));
  }, [canManage]);

  const targetTotal = sellers.reduce((sum, seller) => sum + Number(seller.target || 0), 0);
  const availableSellers = registeredSellers.filter(
    (seller) => !sellers.some((row) => row.sellerId === seller.id)
  );

  const handleSave = async () => {
    const next: TeamSalesMonthData = {
      ...data,
      setup: {
        ...data.setup,
        year,
        month,
        monthLabel: formatMonthLabel(year, month),
        workingDays: Number(workingDays) || data.setup.workingDays,
        targetTotal,
        sellers
      }
    };
    await onSave(next, "Setup salvato.");
    setIsEditing(false);
  };

  const addSeller = () => {
    const seller = registeredSellers.find((row) => row.id === sellerToAdd);
    if (!seller) return;
    setSellers((current) => [...current, { sellerId: seller.id, name: seller.name, target: 0 }]);
    setSellerToAdd("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Parametri del mese</CardTitle>
        {canManage ? (
          isEditing ? (
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
              Modifica
            </Button>
          )
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Mese</label>
            {isEditing ? (
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_LABELS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-slate-800">{formatMonthLabel(data.setup.year, data.setup.month)}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Anno</label>
            {isEditing ? (
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((yearOption) => (
                    <SelectItem key={yearOption} value={String(yearOption)}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-slate-800">{data.setup.year}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Giorni lavorativi</label>
            {isEditing ? (
              <Input
                type="number"
                min={1}
                max={31}
                value={workingDays}
                onChange={(event) => setWorkingDays(event.target.value)}
              />
            ) : (
              <p className="text-sm text-slate-800">{data.setup.workingDays}</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Obiettivi personali</p>
            <p className="text-sm text-slate-500">Target totale: {formatCurrency(targetTotal)}</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Venditore</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  {isEditing ? <TableHead className="text-right">Azioni</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.length > 0 ? (
                  sellers.map((seller, index) => (
                    <TableRow key={seller.sellerId ?? index} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-900">
                        {seller.name}
                        {!seller.sellerId ? (
                          <span className="ml-2 text-xs font-normal text-amber-600">(non collegato)</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            min={0}
                            value={seller.target}
                            onChange={(event) =>
                              setSellers((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index ? { ...row, target: Number(event.target.value) } : row
                                )
                              )
                            }
                            className="text-right"
                          />
                        ) : (
                          formatCurrency(seller.target)
                        )}
                      </TableCell>
                      {isEditing ? (
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setSellers((current) => current.filter((_, rowIndex) => rowIndex !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isEditing ? 3 : 2} className="h-24 text-center text-slate-500">
                      Nessun venditore in questa squadra.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {isEditing ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select value={sellerToAdd} onValueChange={setSellerToAdd}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleziona un venditore registrato" />
                </SelectTrigger>
                <SelectContent>
                  {availableSellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" onClick={addSeller} disabled={!sellerToAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi alla squadra
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function InserimentiTab({
  data,
  dashboard
}: {
  data: TeamSalesMonthData;
  dashboard: ReturnType<typeof deriveDashboardData>;
}) {
  const sellerNames = data.setup.sellers.map((seller) => seller.name);
  const hasUnlinkedSellers = data.setup.sellers.some((seller) => !seller.sellerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inserimenti</CardTitle>
        <p className="text-sm text-slate-500">
          Le vendite sono calcolate automaticamente dai KPI giornalieri di ogni venditore collegato.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUnlinkedSellers ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Uno o piu' venditori di questa squadra non sono collegati a un account Cold Team: per loro le vendite
            risultano sempre a 0. Collegali dal tab Setup.
          </div>
        ) : null}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data</TableHead>
                {sellerNames.map((name) => (
                  <TableHead key={name} className="text-right">
                    {name}
                  </TableHead>
                ))}
                <TableHead className="text-right">Totale</TableHead>
                <TableHead className="text-right">Cumulato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.days.map((day) => (
                <TableRow key={day.day} className="hover:bg-slate-50">
                  <TableCell>{day.date || "-"}</TableCell>
                  {sellerNames.map((name) => (
                    <TableCell key={name} className="text-right">
                      {formatCurrency(day.salesBySeller[name] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(day.dayTotal)}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{formatCurrency(day.cumulative)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const emptyPendingForm = { client: "", sellerName: "", value: "", phase: "", closeDate: "", notes: "" };

function PendingTab({
  data,
  dashboard,
  isSaving,
  onSave
}: {
  data: TeamSalesMonthData;
  dashboard: ReturnType<typeof deriveDashboardData>;
  isSaving: boolean;
  onSave: (next: TeamSalesMonthData, message: string) => Promise<void>;
}) {
  const sellerNames = data.setup.sellers.map((seller) => seller.name);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState(emptyPendingForm);

  const openNew = () => {
    setForm({ ...emptyPendingForm, sellerName: sellerNames[0] ?? "" });
    setEditIndex(-1);
  };

  const openEdit = (index: number) => {
    const row = data.pending[index];
    setForm({
      client: row.client,
      sellerName: row.sellerName,
      value: String(row.value),
      phase: row.phase,
      closeDate: row.closeDate ?? "",
      notes: row.notes
    });
    setEditIndex(index);
  };

  const submit = async () => {
    if (!form.client.trim() || !form.sellerName || !form.phase.trim() || Number(form.value) <= 0) {
      return;
    }
    const row: TeamSalesPendingRow = {
      client: form.client.trim(),
      sellerName: form.sellerName,
      value: Number(form.value),
      phase: form.phase.trim(),
      closeDate: form.closeDate || null,
      notes: form.notes.trim()
    };
    const nextPending =
      editIndex !== null && editIndex >= 0
        ? data.pending.map((existing, index) => (index === editIndex ? row : existing))
        : [...data.pending, row];

    await onSave({ ...data, pending: nextPending }, editIndex !== null && editIndex >= 0 ? "Pending aggiornato." : "Pending salvato.");
    setEditIndex(null);
  };

  const remove = async (index: number) => {
    const nextPending = data.pending.filter((_, rowIndex) => rowIndex !== index);
    await onSave({ ...data, pending: nextPending }, "Pending eliminato.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending ({formatCurrency(dashboard.summary.pendingValue)})</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo pending
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Venditore</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead className="text-right">Valore</TableHead>
                <TableHead>Chiusura prevista</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pending.length > 0 ? (
                data.pending.map((row, index) => (
                  <TableRow key={index} className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">{row.client}</TableCell>
                    <TableCell>{row.sellerName}</TableCell>
                    <TableCell>{row.phase}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                    <TableCell>{row.closeDate ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(index)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => void remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Nessun pending in questa squadra.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editIndex !== null ? (
        <ModalShell title={editIndex >= 0 ? "Modifica pending" : "Nuovo pending"} onClose={() => setEditIndex(null)}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Cliente</label>
            <Input value={form.client} onChange={(event) => setForm((f) => ({ ...f, client: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Venditore</label>
            <Select value={form.sellerName} onValueChange={(value) => setForm((f) => ({ ...f, sellerName: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona venditore" />
              </SelectTrigger>
              <SelectContent>
                {sellerNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Fase</label>
            <Input value={form.phase} onChange={(event) => setForm((f) => ({ ...f, phase: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Valore</label>
            <Input type="number" min={0} value={form.value} onChange={(event) => setForm((f) => ({ ...f, value: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Chiusura prevista</label>
            <Input type="date" value={form.closeDate} onChange={(event) => setForm((f) => ({ ...f, closeDate: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Note</label>
            <Input value={form.notes} onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditIndex(null)}>
              Annulla
            </Button>
            <Button onClick={() => void submit()} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : editIndex >= 0 ? "Salva modifica" : "Salva pending"}
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </Card>
  );
}
