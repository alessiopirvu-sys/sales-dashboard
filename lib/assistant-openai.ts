import { DashboardResponse } from "@/lib/types";

const RECENT_TEAM_DAYS = 7;
const RECENT_SELLER_DAILY_ROWS = 24;
export const ASSISTANT_PROMPT_VERSION = "2026-07-23-business-italian-v1";

function compactRanking(data: DashboardResponse) {
  return data.ranking.map((seller) => ({
    venditore: seller.seller,
    chiamate_fr: seller.calls,
    app_presi_fr: seller.appointmentsBooked,
    svolti_fr: seller.appointmentsDone,
    chiusi_fr: seller.dealsClosed,
    fatturato_fr: seller.revenue,
    fatturato_totale: seller.revenueTotal,
    conversione_fr_percento: seller.conversionRate,
    chiusi_totali: seller.dealsClosedTotal,
    show_up_fr_percento: seller.showUpRate,
    closing_fr_percento: seller.closingRate,
    ticket_medio_fr: seller.averageTicket,
    ticket_medio_totale: seller.averageTicketTotal,
    referenze: seller.referenze,
    chiusi_referenze: seller.closedReferenze,
    fatturato_ufficio: seller.revenueOffice,
    fatturato_referenze: seller.revenueReferenze,
    show_up_ufficio_percento: seller.showUpRateOffice,
    closing_ufficio_percento: seller.closingRateOffice
  }));
}

function compactTrend(data: DashboardResponse) {
  return data.trend.slice(-RECENT_TEAM_DAYS).map((point) => ({
    data: point.date,
    chiamate_fr: point.calls,
    app_presi_fr: point.appointmentsBooked,
    svolti_fr: point.appointmentsDone,
    chiusi_fr: point.dealsClosed,
    show_up_fr_percento: point.showUpRate,
    closing_fr_percento: point.closingRate,
    fatturato_totale: point.revenue,
    fatturato_fr: point.revenueFr,
    fatturato_referenze: point.revenueReferenze,
    fatturato_ufficio: point.revenueOffice
  }));
}

function compactSellerBreakdown(data: DashboardResponse) {
  return (data.sellerBreakdown ?? []).map((item) => ({
    venditore: item.seller,
    chiamate_fr: item.summary.calls,
    app_presi_fr: item.summary.appointmentsBooked,
    svolti_fr: item.summary.appointmentsDone,
    chiusi_fr: item.summary.dealsClosed,
    fatturato_totale: item.summary.revenueTotal,
    fatturato_fr: item.summary.revenue,
    fatturato_referenze: item.summary.revenueReferenze,
    fatturato_ufficio: item.summary.revenueOffice,
    show_up_fr_percento: item.summary.showUpRate,
    closing_fr_percento: item.summary.closingRate,
    conversione_fr_percento: item.summary.conversionRate,
    show_up_ufficio_percento: item.summary.showUpRateOffice,
    closing_ufficio_percento: item.summary.closingRateOffice,
    conversione_referenze_percento: item.summary.conversionRateReferenze
  }));
}

function compactSellerDailyTrend(data: DashboardResponse) {
  return (data.sellerDailyTrend ?? [])
    .filter(
      (item) =>
        item.calls > 0 ||
        item.appointmentsBooked > 0 ||
        item.appointmentsDone > 0 ||
        item.dealsClosed > 0 ||
        item.revenueTotal > 0
    )
    .slice(-RECENT_SELLER_DAILY_ROWS)
    .map((item) => ({
      venditore: item.seller,
      data: item.date,
      chiamate_fr: item.calls,
      app_presi_fr: item.appointmentsBooked,
      svolti_fr: item.appointmentsDone,
      chiusi_fr: item.dealsClosed,
      fatturato_totale: item.revenueTotal,
      show_up_fr_percento: item.showUpRate,
      closing_fr_percento: item.closingRate,
      conversione_fr_percento: item.conversionRate
    }));
}

export function buildAssistantSystemPrompt() {
  return [
    "Sei l'assistente KPI di Cold Sales.",
    "Rispondi sempre in italiano, in modo chiaro, operativo, concreto e professionale.",
    "Usa solo i dati forniti nel contesto e non inventare numeri, venditori o trend.",
    "Quando citi metriche, usa i valori presenti nel contesto.",
    "Devi considerare tutto il funnel, non solo il fatturato: chiamate, contatti, app presi, app svolti, chiusi, ticket medio, referenze, ufficio e percentuali.",
    "Se la domanda riguarda andamento recente o ultimi giorni, usa il dettaglio giornaliero per venditore presente nel contesto.",
    "Concentrati su performance commerciali, colli di bottiglia, percentuali, trend, rischi, opportunita e priorita immediate.",
    "Parla come un responsabile vendite, non come un analista tecnico.",
    "Non usare inglesismi tecnici o nomi di campo del payload come booked, done, showUpRate, closingRate, revenueTotal, rifissatoOffice o recoveryRateOffice.",
    "Usa invece formulazioni naturali come: appuntamenti presi, appuntamenti svolti, tasso di svolti, tasso di chiusura, fatturato totale, venditore da recuperare, giorno critico, priorita commerciale.",
    "Quando suggerisci un'azione, rendila specifica per persona o canale: per esempio 'migliorare il tasso di svolti su Angelica' oppure 'aumentare i chiusi da svolti su Emanuele'.",
    "Mantieni la risposta sintetica ma utile: massimo 6-8 frasi brevi.",
    "Organizza quasi sempre la risposta in blocchi brevi e visivi.",
    "Quando possibile usa etichette come 'Sintesi:', 'Punto critico:', 'Impatto:', 'Azione subito:' o simili.",
    "Se l'utente chiede confronti tra venditori o metriche, puoi usare una semplice tabella markdown."
  ].join(" ");
}

export function buildAssistantResponseFormatPrompt() {
  return [
    "Restituisci solo JSON valido.",
    "Usa esattamente questa struttura:",
    "{",
    '  "headline": "string",',
    '  "summary": "string",',
    '  "sections": [',
    '    { "title": "string", "tone": "neutral|positive|negative|action", "items": ["string"] }',
    "  ],",
    '  "metrics": [',
    '    { "label": "string", "value": "string", "note": "string opzionale" }',
    "  ],",
    '  "sellerRows": [',
    '    { "seller": "string", "calls": "string", "booked": "string", "done": "string", "closed": "string", "closing": "string", "revenue": "string" }',
    "  ]",
    "}",
    "Massimo 4 sections, massimo 4 items per section, massimo 8 metrics, massimo 5 sellerRows.",
    "Le tabelle devono riflettere la domanda dell'utente e usare solo dati presenti nel contesto.",
    "Il testo nelle sections deve essere scritto in italiano naturale commerciale, senza nomi tecnici dei campi."
  ].join(" ");
}

export function buildAssistantUserPrompt(prompt: string, data: DashboardResponse) {
  const context = {
    riepilogo_team: {
      chiamate_fr: data.summary.calls,
      app_presi_fr: data.summary.appointmentsBooked,
      svolti_fr: data.summary.appointmentsDone,
      chiusi_fr: data.summary.dealsClosed,
      fatturato_fr: data.summary.revenue,
      fatturato_totale: data.summary.revenueTotal,
      show_up_fr_percento: data.summary.showUpRate,
      closing_fr_percento: data.summary.closingRate,
      conversione_fr_percento: data.summary.conversionRate,
      referenze: data.summary.referenze,
      chiusi_referenze: data.summary.closedReferenze,
      fatturato_referenze: data.summary.revenueReferenze,
      base_ufficio: data.summary.officeBase,
      svolti_ufficio: data.summary.appointmentsDoneOffice,
      chiusi_ufficio: data.summary.closedOffice,
      fatturato_ufficio: data.summary.revenueOffice
    },
    confronto_con_periodo_precedente: {
      fatturato_totale_corrente: data.comparison.current.revenueTotal,
      fatturato_totale_precedente: data.comparison.previous.revenueTotal,
      chiusi_totali_correnti: data.comparison.current.dealsClosedTotal,
      chiusi_totali_precedenti: data.comparison.previous.dealsClosedTotal,
      closing_corrente_percento: data.comparison.current.closingRate,
      closing_precedente_percento: data.comparison.previous.closingRate
    },
    ranking_venditori: compactRanking(data),
    dettaglio_venditori: compactSellerBreakdown(data),
    andamento_team_ultimi_giorni: compactTrend(data),
    andamento_venditori_ultimi_giorni: compactSellerDailyTrend(data),
    venditori_disponibili: data.meta.availableSellers,
    righe_utili_lette: data.meta.totalRows,
    ultimo_aggiornamento: data.meta.lastUpdated
  };

  return [
    "Contesto KPI dashboard:",
    JSON.stringify(context, null, 2),
    "",
    "Formatta la risposta in modo visivo per una dashboard manageriale.",
    "Scrivi come se stessi parlando al titolare o al responsabile commerciale.",
    "Evita termini tecnici del dataset e privilegia azioni pratiche sui venditori.",
    "",
    `Domanda utente: ${prompt}`
  ].join("\n");
}
