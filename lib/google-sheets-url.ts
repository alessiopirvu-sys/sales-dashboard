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
