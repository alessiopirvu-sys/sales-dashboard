export const INVALID_SHEETS_CSV_MESSAGE =
  "Inserisci un Google Sheets published CSV URL valido con output=csv. I link /pubhtml non sono supportati.";

export function isValidGoogleSheetsCsvUrl(url: string) {
  try {
    const parsed = new URL(url);
    const isGoogleSheets = parsed.hostname.includes("docs.google.com");
    const hasCsvOutput = parsed.searchParams.get("output") === "csv";
    const isPubHtml = parsed.pathname.includes("/pubhtml") || parsed.search.includes("pubhtml");

    return isGoogleSheets && hasCsvOutput && !isPubHtml;
  } catch {
    return false;
  }
}

export function getGoogleSheetsCsvIdentity(url: string) {
  if (!isValidGoogleSheetsCsvUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const gid = parsed.searchParams.get("gid") || "";
    return `${parsed.hostname}${parsed.pathname}?gid=${gid}`;
  } catch {
    return null;
  }
}

type SellerSheetEntry = {
  label: string;
  url?: string | null;
};

export function getDuplicateSellerSheetError(entries: SellerSheetEntry[]) {
  const seen = new Map<string, string>();

  for (const entry of entries) {
    const trimmedUrl = entry.url?.trim();
    if (!trimmedUrl) {
      continue;
    }

    const identity = getGoogleSheetsCsvIdentity(trimmedUrl);
    if (!identity) {
      continue;
    }

    const previousLabel = seen.get(identity);
    if (previousLabel) {
      return `I fogli ${previousLabel.toLowerCase()} e ${entry.label.toLowerCase()} puntano allo stesso tab Google Sheets. Usa link diversi.`;
    }

    seen.set(identity, entry.label);
  }

  return null;
}
