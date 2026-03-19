const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const compactFormatter = new Intl.NumberFormat("it-IT", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

export function formatCompactNumber(value: number) {
  return compactFormatter.format(value || 0);
}

export function formatPercentage(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}
