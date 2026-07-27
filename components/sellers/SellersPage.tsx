"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react";

import { AddSellerModal } from "@/components/sellers/AddSellerModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSellerSheetEntries } from "@/lib/seller-sheets";
import { SellerRecord } from "@/lib/types";

export function SellersPage() {
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerRecord | null>(null);
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null);

  const loadSellers = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSellers();
  }, []);

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      const matchesQuery = seller.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && seller.is_active) ||
        (statusFilter === "inactive" && !seller.is_active);

      return matchesQuery && matchesStatus;
    });
  }, [query, sellers, statusFilter]);

  const activeCount = useMemo(() => sellers.filter((seller) => seller.is_active).length, [sellers]);

  const handleDeleteSeller = async (seller: SellerRecord) => {
    try {
      const response = await fetch(`/api/sellers/${seller.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Impossibile eliminare il venditore.");
      }

      await loadSellers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante l'eliminazione."
      );
    }
  };

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
            Gestione team
          </p>
          <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
            Venditori
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {activeCount} venditori attivi gestiti con collegamenti Google Sheets dinamici.
          </p>
        </div>

        <Button
          className="h-11 rounded-2xl px-5"
          onClick={() => {
            setEditingSeller(null);
            setIsSellerModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi venditore
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Totale venditori
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{sellers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Attivi
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Mesi configurati
            </p>
            <p className="mt-3 text-3xl font-semibold text-primary">
              {sellers.reduce((total, seller) => total + getSellerSheetEntries(seller).length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Elenco venditori</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ricerca, modifica e gestione dei fogli collegati per mese.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cerca venditore"
                  className="h-11 min-w-0 rounded-2xl border-slate-200 pl-11 xl:w-[280px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 xl:w-[180px]">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="inactive">Inattivi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-slate-500">
              <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-primary" />
              Caricamento venditori...
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-slate-200 md:block">
                <Table>
                  <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Venditore</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Accesso</TableHead>
                        <TableHead>Fogli collegati</TableHead>
                        <TableHead>Ultimo mese</TableHead>
                        <TableHead>Ultimo accesso</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.length > 0 ? (
                      filteredSellers.map((seller) => {
                        const sheetEntries = getSellerSheetEntries(seller);
                        const latestMonth = sheetEntries[sheetEntries.length - 1];

                        return (
                          <TableRow key={seller.id} className="bg-white hover:bg-slate-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                  {seller.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-950">{seller.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {sheetEntries.length} mesi configurati
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={seller.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}
                              >
                                {seller.is_active ? "Attivo" : "Inattivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={seller.profile_id ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}
                              >
                                {seller.profile_id ? seller.status ?? "Collegato" : "Da invitare"}
                              </Badge>
                            </TableCell>
                            <TableCell>{sheetEntries.length}</TableCell>
                            <TableCell>{latestMonth?.label ?? "Nessuno"}</TableCell>
                            <TableCell>
                              {seller.last_login_at
                                ? new Date(seller.last_login_at).toLocaleDateString("it-IT")
                                : "Mai"}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => {
                                    setEditingSeller(seller);
                                    setIsSellerModalOpen(true);
                                  }}
                                >
                                  Accesso
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() =>
                                    setExpandedSellerId((current) =>
                                      current === seller.id ? null : seller.id
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Dettagli
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => {
                                    setEditingSeller(seller);
                                    setIsSellerModalOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifica
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => void handleDeleteSeller(seller)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Elimina
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-slate-500">
                          Nessun venditore trovato con i filtri attivi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredSellers.length > 0 ? (
                  filteredSellers.map((seller) => {
                    const sheetEntries = getSellerSheetEntries(seller);
                    const latestMonth = sheetEntries[sheetEntries.length - 1];
                    const isExpanded = expandedSellerId === seller.id;

                    return (
                      <div key={seller.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-slate-950">{seller.name}</p>
                              <Badge
                                variant="secondary"
                                className={seller.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}
                              >
                                {seller.is_active ? "Attivo" : "Inattivo"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {sheetEntries.length} fogli collegati
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Ultimo mese: {latestMonth?.label ?? "Nessuno"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Accesso: {seller.profile_id ? seller.status ?? "Collegato" : "Da invitare"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Ultimo accesso: {seller.last_login_at ? new Date(seller.last_login_at).toLocaleDateString("it-IT") : "Mai"}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-xl border border-slate-200 p-2 text-slate-500"
                            onClick={() =>
                              setExpandedSellerId((current) => (current === seller.id ? null : seller.id))
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                        {isExpanded ? (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                            {sheetEntries.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {sheetEntries.map((entry) => (
                                  <span
                                    key={entry.key}
                                    className="rounded-full bg-white px-3 py-1 text-xs text-slate-500"
                                  >
                                    {entry.label}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingSeller(seller);
                              setIsSellerModalOpen(true);
                            }}
                          >
                            Accesso
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingSeller(seller);
                              setIsSellerModalOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifica
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => void handleDeleteSeller(seller)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    Nessun venditore trovato con i filtri attivi.
                  </div>
                )}
              </div>

              {expandedSellerId && filteredSellers.some((seller) => seller.id === expandedSellerId) ? (
                <Card className="hidden md:block">
                  <CardContent className="p-6">
                    {(() => {
                      const seller = filteredSellers.find((item) => item.id === expandedSellerId);
                      if (!seller) {
                        return null;
                      }

                      const sheetEntries = getSellerSheetEntries(seller);
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-slate-950">{seller.name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Mesi configurati
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sheetEntries.length > 0 ? (
                                sheetEntries.map((entry) => (
                                  <span
                                    key={entry.key}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                                  >
                                    {entry.label}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">Nessun mese configurato.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <AddSellerModal
        open={isSellerModalOpen}
        onClose={() => {
          setIsSellerModalOpen(false);
          setEditingSeller(null);
        }}
        onSaved={async () => {
          await loadSellers();
        }}
        seller={editingSeller}
      />
    </main>
  );
}
