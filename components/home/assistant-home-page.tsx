"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  LoaderCircle,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";

import { AppHeader } from "@/components/dashboard/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildAssistantOverview, generateAssistantAnswer } from "@/lib/assistant-insights";
import { buildDashboardUrl } from "@/lib/data/filters";
import {
  AssistantReply,
  AssistantSectionTone,
  AssistantStructuredReply,
  DashboardFilters,
  DashboardResponse
} from "@/lib/types";

const HOME_FILTERS: DashboardFilters = {
  preset: "month",
  seller: "all"
};

const SUGGESTED_PROMPTS = [
  "Chi sta andando meglio questo mese?",
  "Dove stiamo andando peggio?",
  "Cosa devo fare adesso per migliorare i risultati?",
  "Come stiamo andando rispetto al periodo precedente?"
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function buildAnswerHighlights(answer: string) {
  return answer
    .replace(/\n+/g, " ")
    .split(/\s+-\s+|^-+\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

const toneStyles: Record<AssistantSectionTone, string> = {
  neutral: "border-slate-200 bg-slate-50",
  positive: "border-blue-200 bg-blue-50/70",
  negative: "border-rose-200 bg-rose-50/70",
  action: "border-violet-200 bg-violet-50/70"
};

export function AssistantHomePage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerSource, setAnswerSource] = useState<AssistantReply["source"] | null>(null);
  const [answerModel, setAnswerModel] = useState<string | null>(null);
  const [structuredReply, setStructuredReply] = useState<AssistantStructuredReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(buildDashboardUrl(HOME_FILTERS), {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Impossibile caricare i dati per l'assistente KPI.");
        }

        const payload = (await response.json()) as DashboardResponse;
        setData(payload);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Errore sconosciuto durante il caricamento della home."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadHomeData();

    return () => controller.abort();
  }, []);

  const overview = useMemo(() => (data ? buildAssistantOverview(data) : null), [data]);
  const answerHighlights = useMemo(() => buildAnswerHighlights(answer), [answer]);
  const lastUpdatedLabel = data?.meta.lastUpdated
    ? format(new Date(data.meta.lastUpdated), "dd MMM yyyy, HH:mm", { locale: it })
    : "In attesa di sincronizzazione";

  const handleAsk = (nextPrompt?: string) => {
    if (!data) {
      return;
    }

    const value = (nextPrompt ?? prompt).trim();
    if (!value) {
      return;
    }

    setIsAnswering(true);
    setPrompt(value);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: value,
            data
          })
        });

        if (!response.ok) {
          throw new Error("Impossibile ottenere la risposta AI.");
        }

        const payload = (await response.json()) as AssistantReply;
        setAnswer(payload.answer);
        setAnswerSource(payload.source);
        setAnswerModel(payload.model ?? null);
        setStructuredReply(payload.structured ?? null);
      } catch {
        setAnswer(generateAssistantAnswer(value, data));
        setAnswerSource("fallback");
        setAnswerModel(null);
        setStructuredReply(null);
      } finally {
        setIsAnswering(false);
      }
    })();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleAsk();
  };

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <AppHeader
        title="Home"
        subtitle="Assistente KPI"
        lastUpdatedLabel={lastUpdatedLabel}
        onExport={() => window.location.assign("/esportazioni")}
      />

      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(59,91,255,0.1),_transparent_36%)] px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Ciao! Sono l&apos;assistente KPI di Cold Sales
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
                Chiedimi chi sta andando meglio, dove stiamo rallentando e quali sono le priorita commerciali del momento.
              </p>

              <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-3xl">
                <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Chiedimi qualsiasi cosa sui KPI..."
                      rows={2}
                      className="min-h-[72px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-base text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <Button type="submit" className="h-12 rounded-2xl px-5 sm:self-end" disabled={!data || isAnswering}>
                      {isAnswering ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Chiedi
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTED_PROMPTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAsk(item)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/30 hover:text-slate-900"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1.55fr,1fr] lg:p-8">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <MessageSquareText className="h-4 w-4 text-primary" />
                        Risposta assistente
                      </p>
                      {answerSource ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {answerSource === "openai"
                            ? `Generata con OpenAI${answerModel ? ` · ${answerModel}` : ""}`
                            : "Fallback KPI locale attivo"}
                        </p>
                      ) : null}
                    </div>
                    {prompt ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Domanda attiva
                        </p>
                        <p className="mt-1 max-w-[300px] text-sm text-slate-700">{prompt}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr,0.92fr]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {structuredReply?.headline || "Risposta sintetica"}
                      </p>
                      <div className="mt-3 text-[15px] leading-8 text-slate-700">
                        {isAnswering
                          ? "Sto preparando la lettura del periodo..."
                          : structuredReply?.summary ||
                            answer ||
                            "Scegli una domanda rapida oppure scrivi una richiesta libera per ricevere un commento sui KPI."}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Punti chiave
                      </p>
                      <div className="mt-3 space-y-3">
                        {(
                          structuredReply?.sections?.[0]?.items?.length
                            ? structuredReply.sections[0].items
                            : answerHighlights.length > 0
                              ? answerHighlights
                              : overview?.actions ?? []
                        ).map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm leading-6 text-slate-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {structuredReply?.sections?.length ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  {structuredReply.sections.map((section, index) => (
                    <Card key={`${section.title}-${index}`} className="border-slate-200">
                      <CardContent className="p-6">
                        <div className={`rounded-3xl border p-5 ${toneStyles[section.tone]}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {section.title}
                          </p>
                          <div className="mt-4 space-y-3">
                            {section.items.map((item) => (
                              <div key={item} className="flex items-start gap-3">
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p className="text-sm leading-7 text-slate-700">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

            </div>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-900">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">Insight AI Home</h2>
                </div>

                {isLoading ? (
                  <div className="flex min-h-[180px] items-center gap-3 text-slate-500">
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    Analizzo i KPI del periodo corrente...
                  </div>
                ) : error ? (
                  <p className="mt-4 text-sm text-rose-600">{error}</p>
                ) : overview ? (
                  <div className="mt-5 space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Sintesi
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">{overview.headline}</p>
                      <p className="mt-2 text-sm text-slate-600">{overview.summary}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <TrendingUp className="h-4 w-4 text-[#3B5BFF]" />
                          Dove stai andando meglio
                        </p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {overview.strengths.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <TrendingDown className="h-4 w-4 text-rose-500" />
                          Dove stai andando peggio
                        </p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {overview.risks.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <Target className="h-4 w-4 text-primary" />
                          Cosa fare adesso
                        </p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {overview.actions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Fatturato totale
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {data ? formatCurrency(data.summary.revenueTotal) : "--"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Totale del periodo corrente su tutti i canali attivi.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Miglior venditore
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">
                      {overview?.topSeller?.seller ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {overview?.topSeller
                        ? `${formatCurrency(overview.topSeller.revenueTotal)} di fatturato totale`
                        : "In attesa di dati utili."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Stato AI
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">Insight live attivi</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Questa home usa gia i dati reali della dashboard. Se vuoi, nel prossimo step la colleghiamo anche a OpenAI con una chiave API dedicata.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
