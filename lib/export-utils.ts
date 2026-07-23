import { format } from "date-fns";
import { it } from "date-fns/locale";

import { resolveDateRange } from "@/lib/data/filters";
import { formatCompactNumber, formatCurrency, formatPercentage } from "@/lib/formatters";
import { DashboardFilters, DashboardResponse } from "@/lib/types";

export type ExportFormat = "csv" | "json" | "pdf";
export type ExportScope = "full" | "summary" | "ranking" | "trend";

function escapeCsvValue(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function rowsToCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(escapeCsvValue).join(";")).join("\n");
}

function formatDateRange(filters: DashboardFilters) {
  const range = resolveDateRange(filters);
  return `${format(new Date(range.startDate), "dd MMMM yyyy", { locale: it })} - ${format(
    new Date(range.endDate),
    "dd MMMM yyyy",
    { locale: it }
  )}`;
}

export function buildExportFilename(
  filename: string,
  formatType: ExportFormat,
  filters: DashboardFilters,
  scope: ExportScope
) {
  const range = resolveDateRange(filters);
  const safeBase = filename
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "") || "export";

  return `${safeBase}-${scope}-${range.startDate}_${range.endDate}.${formatType === "pdf" ? "html" : formatType}`;
}

export function createExportJson(
  data: DashboardResponse,
  filters: DashboardFilters,
  scope: ExportScope,
  sellerLabel: string
) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      filters: {
        ...filters,
        sellerLabel,
        periodLabel: formatDateRange(filters)
      },
      scope,
      data
    },
    null,
    2
  );
}

export function createExportCsv(
  data: DashboardResponse,
  filters: DashboardFilters,
  scope: ExportScope,
  sellerLabel: string
) {
  const blocks: string[] = [];

  const metadataRows = [
    ["Report", "Cold Sales Export"],
    ["Periodo", formatDateRange(filters)],
    ["Venditore", sellerLabel],
    ["Ambito", scope],
    ["Generato il", format(new Date(), "dd/MM/yyyy HH:mm")],
    ["Ultimo aggiornamento", format(new Date(data.meta.lastUpdated), "dd/MM/yyyy HH:mm")]
  ];
  blocks.push(rowsToCsv(metadataRows));

  if (scope === "full" || scope === "summary") {
    blocks.push(
      rowsToCsv([
        [],
        ["Riepilogo KPI"],
        ["Metrica", "Valore"],
        ["Chiamate FR", formatCompactNumber(data.summary.calls)],
        ["App presi FR", formatCompactNumber(data.summary.appointmentsBooked)],
        ["Svolti FR", formatCompactNumber(data.summary.appointmentsDone)],
        ["Chiusi FR", formatCompactNumber(data.summary.dealsClosed)],
        ["Fatturato FR", formatCurrency(data.summary.revenue)],
        ["Referenze", formatCompactNumber(data.summary.referenze)],
        ["Chiusi referenze", formatCompactNumber(data.summary.closedReferenze)],
        ["Fatturato referenze", formatCurrency(data.summary.revenueReferenze)],
        ["Ufficio", formatCompactNumber(data.summary.officeBase)],
        ["Chiusi ufficio", formatCompactNumber(data.summary.closedOffice)],
        ["Fatturato ufficio", formatCurrency(data.summary.revenueOffice)],
        ["Chiusi totali", formatCompactNumber(data.summary.dealsClosedTotal)],
        ["Fatturato totale", formatCurrency(data.summary.revenueTotal)],
        ["Show-up FR", formatPercentage(data.summary.showUpRate)],
        ["Closing FR", formatPercentage(data.summary.closingRate)]
      ])
    );
  }

  if (scope === "full" || scope === "ranking") {
    blocks.push(
      rowsToCsv([
        [],
        ["Ranking venditori"],
        [
          "Venditore",
          "Chiamate FR",
          "App presi FR",
          "Svolti FR",
          "Referenze",
          "Chiusi referenze",
          "Fatturato referenze",
          "Ufficio",
          "Svolti ufficio",
          "Chiusi ufficio",
          "Fatturato ufficio",
          "Chiusi totali",
          "Fatturato totale",
          "Show-up FR",
          "Closing FR"
        ],
        ...data.ranking.map((row) => [
          row.seller,
          row.calls,
          row.appointmentsBooked,
          row.appointmentsDone,
          row.referenze,
          row.closedReferenze,
          row.revenueReferenze,
          row.officeBase,
          row.appointmentsDoneOffice,
          row.closedOffice,
          row.revenueOffice,
          row.dealsClosedTotal,
          row.revenueTotal,
          row.showUpRate,
          row.closingRate
        ])
      ])
    );
  }

  if (scope === "full" || scope === "trend") {
    blocks.push(
      rowsToCsv([
        [],
        ["Trend fatturato"],
        ["Data", "Label", "FR", "Referenze", "Ufficio", "Totale"],
        ...data.trend.map((point) => [
          point.date,
          point.label,
          point.revenueFr,
          point.revenueReferenze,
          point.revenueOffice,
          point.revenue
        ])
      ])
    );
  }

  return blocks.join("\n\n");
}

export function createPrintableReportHtml(
  data: DashboardResponse,
  filters: DashboardFilters,
  scope: ExportScope,
  sellerLabel: string
) {
  const rankingRows =
    scope === "summary"
      ? ""
      : data.ranking
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.seller}</td>
                <td>${formatCurrency(row.revenueTotal)}</td>
                <td>${formatCompactNumber(row.dealsClosedTotal)}</td>
                <td>${formatPercentage(row.closingRate)}</td>
              </tr>
            `
          )
          .join("");

  const trendRows =
    scope === "summary" || scope === "ranking"
      ? ""
      : data.trend
          .map(
            (point) => `
              <tr>
                <td>${point.label}</td>
                <td>${formatCurrency(point.revenueFr)}</td>
                <td>${formatCurrency(point.revenueReferenze)}</td>
                <td>${formatCurrency(point.revenueOffice)}</td>
                <td>${formatCurrency(point.revenue)}</td>
              </tr>
            `
          )
          .join("");

  return `<!DOCTYPE html>
  <html lang="it">
    <head>
      <meta charset="utf-8" />
      <title>Cold Sales Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
        h1, h2 { margin: 0 0 12px; }
        .meta, .grid { margin-bottom: 24px; }
        .meta p { margin: 4px 0; color: #475569; }
        .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
        .label { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
        .value { font-size: 24px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; }
      </style>
    </head>
    <body>
      <h1>Cold Sales Export</h1>
      <div class="meta">
        <p><strong>Periodo:</strong> ${formatDateRange(filters)}</p>
        <p><strong>Venditore:</strong> ${sellerLabel}</p>
        <p><strong>Ambito:</strong> ${scope}</p>
        <p><strong>Generato il:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      </div>

      <h2>Riepilogo KPI</h2>
      <div class="grid">
        <div class="card"><div class="label">Fatturato totale</div><div class="value">${formatCurrency(data.summary.revenueTotal)}</div></div>
        <div class="card"><div class="label">Chiusi totali</div><div class="value">${formatCompactNumber(data.summary.dealsClosedTotal)}</div></div>
        <div class="card"><div class="label">Closing FR</div><div class="value">${formatPercentage(data.summary.closingRate)}</div></div>
        <div class="card"><div class="label">Fatturato FR</div><div class="value">${formatCurrency(data.summary.revenue)}</div></div>
        <div class="card"><div class="label">Fatturato Referenze</div><div class="value">${formatCurrency(data.summary.revenueReferenze)}</div></div>
        <div class="card"><div class="label">Fatturato Ufficio</div><div class="value">${formatCurrency(data.summary.revenueOffice)}</div></div>
      </div>

      ${
        rankingRows
          ? `<h2>Ranking venditori</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Venditore</th><th>Fatturato totale</th><th>Chiusi totali</th><th>Closing FR</th></tr>
          </thead>
          <tbody>${rankingRows}</tbody>
        </table>`
          : ""
      }

      ${
        trendRows
          ? `<h2>Trend fatturato</h2>
        <table>
          <thead>
            <tr><th>Periodo</th><th>FR</th><th>Referenze</th><th>Ufficio</th><th>Totale</th></tr>
          </thead>
          <tbody>${trendRows}</tbody>
        </table>`
          : ""
      }
    </body>
  </html>`;
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

