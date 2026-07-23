import {
  AssistantStructuredReply,
  DashboardResponse,
  RankingRow
} from "@/lib/types";

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

function getTopSeller(ranking: RankingRow[]) {
  return ranking[0] ?? null;
}

function getWeakestSeller(ranking: RankingRow[]) {
  const withRevenue = ranking.filter((row) => row.revenueTotal > 0);
  if (withRevenue.length === 0) {
    return ranking[ranking.length - 1] ?? null;
  }

  return [...withRevenue].sort((left, right) => {
    if (left.revenueTotal !== right.revenueTotal) {
      return left.revenueTotal - right.revenueTotal;
    }

    return left.dealsClosedTotal - right.dealsClosedTotal;
  })[0] ?? null;
}

function getBestChannel(data: DashboardResponse) {
  const channels = [
    { label: "FR", value: data.summary.revenue },
    { label: "Referenze", value: data.summary.revenueReferenze },
    { label: "Ufficio", value: data.summary.revenueOffice }
  ];

  return channels.sort((left, right) => right.value - left.value)[0];
}

function getWorstChannel(data: DashboardResponse) {
  const channels = [
    { label: "FR", value: data.summary.revenue },
    { label: "Referenze", value: data.summary.revenueReferenze },
    { label: "Ufficio", value: data.summary.revenueOffice }
  ];

  return channels.sort((left, right) => left.value - right.value)[0];
}

function getMainStrength(data: DashboardResponse) {
  const topSeller = getTopSeller(data.ranking);
  const bestChannel = getBestChannel(data);

  if (topSeller && topSeller.revenueTotal > 0) {
    return `${topSeller.seller} sta trainando il periodo con ${formatCurrency(topSeller.revenueTotal)} di fatturato totale.`;
  }

  return `Il canale ${bestChannel.label} e al momento quello con il contributo maggiore, pari a ${formatCurrency(bestChannel.value)}.`;
}

function getMainRisk(data: DashboardResponse) {
  const weakestSeller = getWeakestSeller(data.ranking);
  const worstChannel = getWorstChannel(data);

  if (weakestSeller && weakestSeller.revenueTotal > 0) {
    return `${weakestSeller.seller} e il venditore da recuperare prima: ha portato ${formatCurrency(weakestSeller.revenueTotal)} con ${weakestSeller.dealsClosedTotal} chiusi totali.`;
  }

  return `Il canale ${worstChannel.label} e quello piu debole nel periodo e richiede attenzione immediata.`;
}

function buildPriorities(data: DashboardResponse) {
  const priorities: string[] = [];
  const topSeller = getTopSeller(data.ranking);
  const weakestSeller = getWeakestSeller(data.ranking);
  const sellerWithLowestShowUp = [...data.ranking]
    .filter((row) => row.appointmentsBooked > 0)
    .sort((left, right) => left.showUpRate - right.showUpRate)[0];
  const sellerWithLowestClosing = [...data.ranking]
    .filter((row) => row.appointmentsDone > 0)
    .sort((left, right) => left.closingRate - right.closingRate)[0];

  if (data.summary.showUpRate < 50) {
    if (sellerWithLowestShowUp) {
      priorities.push(
        `Migliora il tasso di svolti su ${sellerWithLowestShowUp.seller}: oggi e al ${formatPercent(sellerWithLowestShowUp.showUpRate)} e sta frenando i chiusi.`
      );
    } else {
      priorities.push(
        `Migliora il tasso di svolti del team: oggi e al ${formatPercent(data.summary.showUpRate)} e sta limitando i chiusi.`
      );
    }
  }

  if (data.summary.closingRate < 10) {
    if (sellerWithLowestClosing) {
      priorities.push(
        `Aumenta i chiusi da svolti su ${sellerWithLowestClosing.seller}: oggi converte solo il ${formatPercent(sellerWithLowestClosing.closingRate)}.`
      );
    } else {
      priorities.push(
        `Lavora sulla chiusura dagli appuntamenti svolti: il tasso attuale del team e ${formatPercent(data.summary.closingRate)}.`
      );
    }
  }

  if (data.summary.revenueOffice === 0 && data.summary.officeBase > 0) {
    priorities.push(
      "Il canale Ufficio sta generando attivita ma non sta ancora trasformando il lavoro in fatturato: serve piu spinta sul follow-up."
    );
  }

  if (topSeller && weakestSeller && topSeller.seller !== weakestSeller.seller) {
    priorities.push(
      `Replica il metodo di ${topSeller.seller} e affiancalo a ${weakestSeller.seller} per accelerare il recupero.`
    );
  }

  if (priorities.length === 0) {
    priorities.push("Il mese e bilanciato: concentrati sul mantenere costante il ritmo commerciale.");
  }

  return priorities.slice(0, 3);
}

export function buildAssistantOverview(data: DashboardResponse) {
  const topSeller = getTopSeller(data.ranking);
  const weakestSeller = getWeakestSeller(data.ranking);
  const bestChannel = getBestChannel(data);
  const worstChannel = getWorstChannel(data);

  return {
    headline:
      data.comparison.current.revenueTotal >= data.comparison.previous.revenueTotal
        ? "Il team sta tenendo un passo positivo rispetto al periodo precedente."
        : "Il team sta rallentando rispetto al periodo precedente e conviene intervenire adesso.",
    summary: `Nel periodo corrente il team ha generato ${formatCurrency(data.summary.revenueTotal)} con ${data.summary.dealsClosedTotal} chiusi totali.`,
    strengths: [
      getMainStrength(data),
      `Il canale piu forte e ${bestChannel.label} con ${formatCurrency(bestChannel.value)}.`
    ],
    risks: [
      getMainRisk(data),
      `Il canale piu debole e ${worstChannel.label} con ${formatCurrency(worstChannel.value)}.`
    ],
    actions: buildPriorities(data),
    topSeller,
    weakestSeller
  };
}

function buildTopSellerAnswer(data: DashboardResponse) {
  const topSeller = getTopSeller(data.ranking);
  if (!topSeller) {
    return "Non ho ancora abbastanza dati per identificare il miglior venditore del periodo.";
  }

  return `${topSeller.seller} e il migliore del periodo: ${formatCurrency(topSeller.revenueTotal)} di fatturato totale, ${topSeller.dealsClosedTotal} chiusi e un ticket medio di ${formatCurrency(topSeller.averageTicketTotal)}.`;
}

function buildWeakAreaAnswer(data: DashboardResponse) {
  const weakestSeller = getWeakestSeller(data.ranking);
  const worstChannel = getWorstChannel(data);

  if (weakestSeller && weakestSeller.revenueTotal > 0) {
    return `L'area piu fragile oggi e ${weakestSeller.seller}: ha portato ${formatCurrency(weakestSeller.revenueTotal)} e ${weakestSeller.dealsClosedTotal} chiusi. A livello canale, il piu debole e ${worstChannel.label} con ${formatCurrency(worstChannel.value)}.`;
  }

  return `L'area da recuperare e il canale ${worstChannel.label}, che in questo momento porta ${formatCurrency(worstChannel.value)}.`;
}

function buildTrendAnswer(data: DashboardResponse) {
  const deltaRevenue =
    data.comparison.current.revenueTotal - data.comparison.previous.revenueTotal;
  const direction = deltaRevenue >= 0 ? "meglio" : "peggio";

  return `Rispetto al periodo precedente stai andando ${direction}: ${formatCurrency(data.comparison.current.revenueTotal)} contro ${formatCurrency(data.comparison.previous.revenueTotal)}. Il tasso di svolti e ${formatPercent(data.summary.showUpRate)} e il tasso di chiusura e ${formatPercent(data.summary.closingRate)}.`;
}

function buildPriorityAnswer(data: DashboardResponse) {
  return buildPriorities(data)
    .map((item, index) => `${index + 1}. ${item}`)
    .join(" ");
}

export function generateAssistantAnswer(prompt: string, data: DashboardResponse) {
  const normalized = prompt.trim().toLowerCase();

  if (!normalized) {
    const overview = buildAssistantOverview(data);
    return `${overview.headline} ${overview.summary}`;
  }

  if (
    normalized.includes("meglio") ||
    normalized.includes("top") ||
    normalized.includes("miglior")
  ) {
    return buildTopSellerAnswer(data);
  }

  if (
    normalized.includes("peggio") ||
    normalized.includes("crit") ||
    normalized.includes("debole") ||
    normalized.includes("recuper")
  ) {
    return buildWeakAreaAnswer(data);
  }

  if (
    normalized.includes("trend") ||
    normalized.includes("andando") ||
    normalized.includes("rispetto") ||
    normalized.includes("periodo precedente")
  ) {
    return buildTrendAnswer(data);
  }

  if (
    normalized.includes("fare") ||
    normalized.includes("priorit") ||
    normalized.includes("azione") ||
    normalized.includes("adesso")
  ) {
    return buildPriorityAnswer(data);
  }

  const overview = buildAssistantOverview(data);
  return `${overview.headline} ${overview.summary} Priorita immediate: ${overview.actions.join(" ")}`;
}

export function buildStructuredAssistantFallback(
  prompt: string,
  data: DashboardResponse
): AssistantStructuredReply {
  const overview = buildAssistantOverview(data);
  const topRows = data.ranking.slice(0, 5);

  return {
    headline: prompt || "Lettura KPI del periodo corrente",
    summary: generateAssistantAnswer(prompt, data),
    sections: [
      {
        title: "Sintesi",
        tone: "neutral",
        items: [overview.headline, overview.summary]
      },
      {
        title: "Dove va bene",
        tone: "positive",
        items: overview.strengths
      },
      {
        title: "Dove intervenire",
        tone: "negative",
        items: overview.risks
      },
      {
        title: "Azioni consigliate",
        tone: "action",
        items: overview.actions
      }
    ],
    metrics: [
      { label: "Chiamate FR", value: data.summary.calls.toLocaleString("it-IT") },
      { label: "App presi FR", value: data.summary.appointmentsBooked.toLocaleString("it-IT") },
      { label: "App svolti FR", value: data.summary.appointmentsDone.toLocaleString("it-IT") },
      { label: "Chiusi FR", value: data.summary.dealsClosed.toLocaleString("it-IT") },
      { label: "Show-up FR", value: formatPercent(data.summary.showUpRate) },
      { label: "Closing FR", value: formatPercent(data.summary.closingRate) },
      { label: "Conversione FR", value: formatPercent(data.summary.conversionRate) },
      { label: "Fatturato totale", value: formatCurrency(data.summary.revenueTotal) }
    ],
    sellerRows: topRows.map((row) => ({
      seller: row.seller,
      calls: row.calls.toLocaleString("it-IT"),
      booked: row.appointmentsBooked.toLocaleString("it-IT"),
      done: row.appointmentsDone.toLocaleString("it-IT"),
      closed: row.dealsClosedTotal.toLocaleString("it-IT"),
      closing: formatPercent(row.closingRate),
      revenue: formatCurrency(row.revenueTotal)
    }))
  };
}
