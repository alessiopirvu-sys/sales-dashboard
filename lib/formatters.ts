const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

// "notation: compact" e' un'opzione recente di Intl.NumberFormat: su un
// motore JS datato (es. il browser integrato di alcune Smart TV) il
// costruttore puo' lanciare subito un errore, e siccome questo file viene
// importato a livello di modulo, farebbe crashare l'intera pagina prima
// ancora di renderizzare. Costruzione difensiva con fallback manuale.
let compactFormatter: Intl.NumberFormat | null = null;
try {
  compactFormatter = new Intl.NumberFormat("it-IT", {
    notation: "compact",
    maximumFractionDigits: 1
  });
} catch {
  compactFormatter = null;
}

function formatCompactNumberFallback(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} Mln`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} mila`;
  return `${value}`;
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

export function formatCompactNumber(value: number) {
  const safeValue = value || 0;
  if (!compactFormatter) return formatCompactNumberFallback(safeValue);
  try {
    return compactFormatter.format(safeValue);
  } catch {
    return formatCompactNumberFallback(safeValue);
  }
}

export function formatPercentage(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}
