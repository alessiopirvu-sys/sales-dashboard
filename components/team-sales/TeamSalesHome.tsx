"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Plus, Trash2, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/team-sales/workbook";
import { TeamSalesOverviewRow } from "@/lib/team-sales/types";

type Team = { id: string; name: string };

function TeamOverviewCard({ row }: { row: TeamSalesOverviewRow }) {
  const progress = row.targetTotal > 0 ? row.soldTotal / row.targetTotal : 0;
  const missingToTarget = Math.max(0, row.targetTotal - row.soldTotal);
  const isOnTrack = missingToTarget === 0 && row.targetTotal > 0;

  return (
    <Link href={`/team-sales/${row.teamId}`}>
      <Card className="h-full transition-shadow hover:shadow-float">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">{row.teamName}</CardTitle>
            <p className="text-sm text-slate-500">{row.monthLabel || "Mese non configurato"}</p>
          </div>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isOnTrack ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"
            )}
          >
            {formatPercent(progress)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Venduto</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(row.soldTotal)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Target</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(row.targetTotal)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-600">Manca</p>
              <p className="mt-1 text-sm font-semibold text-amber-700">{formatCurrency(missingToTarget)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Pending</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatCurrency(row.pendingValue)} ({row.pendingCount})
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Top venditore: </span>
            {row.topSellerName ? `${row.topSellerName} (${formatCurrency(row.topSellerTotal)})` : "Nessun dato"}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TeamSalesHome({ canCreateTeam }: { canCreateTeam: boolean }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [overview, setOverview] = useState<TeamSalesOverviewRow[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/team-sales", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Impossibile caricare le squadre.");
      }
      setTeams(payload.teams ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Errore sconosciuto.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverview = async () => {
    setIsOverviewLoading(true);
    try {
      const response = await fetch("/api/team-sales/overview", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setOverview(payload.teams ?? []);
      }
    } finally {
      setIsOverviewLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadOverview();
  }, []);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/team-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Impossibile creare la squadra.");
      }
      setNewTeamName("");
      setIsCreating(false);
      await Promise.all([load(), loadOverview()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Errore sconosciuto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTeam = async (team: Team) => {
    if (!window.confirm(`Eliminare definitivamente la squadra "${team.name}"? L'operazione non e' reversibile.`)) {
      return;
    }
    setDeletingId(team.id);
    setError(null);
    try {
      const response = await fetch(`/api/team-sales/${team.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Impossibile eliminare la squadra.");
      }
      await Promise.all([load(), loadOverview()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Errore sconosciuto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-[1480px] space-y-8">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-slate-950">Andamento squadre</h2>
        </div>

        {isOverviewLoading ? (
          <Card>
            <CardContent className="flex min-h-[160px] items-center justify-center p-6">
              <div className="flex items-center gap-3 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                <span>Caricamento andamento…</span>
              </div>
            </CardContent>
          </Card>
        ) : overview.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-slate-500">
              Crea una squadra per vedere qui il suo andamento.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overview.map((row) => (
              <TeamOverviewCard key={row.teamId} row={row} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Team Sales</p>
            <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
              Squadre
            </h1>
          </div>
          {canCreateTeam ? (
            <Button className="h-11 rounded-2xl px-5" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuova squadra
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isCreating ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <Input
                autoFocus
                placeholder="Nome squadra"
                value={newTeamName}
                onChange={(event) => setNewTeamName(event.target.value)}
                className="h-11"
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsCreating(false)}>
                  Annulla
                </Button>
                <Button onClick={() => void createTeam()} disabled={isSubmitting}>
                  {isSubmitting ? "Creazione..." : "Crea"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center p-6">
              <div className="flex items-center gap-3 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                <span>Caricamento squadre…</span>
              </div>
            </CardContent>
          </Card>
        ) : teams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-slate-500">
              <Users className="h-8 w-8" />
              <p>Nessuna squadra configurata.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="h-full transition-shadow hover:shadow-float">
                <CardContent className="flex items-center gap-3 p-5">
                  <Link href={`/team-sales/${team.id}`} className="flex flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-slate-950">{team.name}</p>
                  </Link>
                  {canCreateTeam ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      disabled={deletingId === team.id}
                      onClick={() => void deleteTeam(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
