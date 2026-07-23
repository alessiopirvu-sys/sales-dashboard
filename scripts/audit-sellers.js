const fs = require("fs");
const Papa = require("papaparse");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

function normalizeCell(value) {
  return value == null ? "" : String(value).trim();
}

function parseFlexibleNumber(value) {
  const raw = normalizeCell(value);
  if (!raw) {
    return 0;
  }

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildDuplicateWarnings(sources) {
  const seen = new Map();
  const warnings = [];

  for (const source of sources) {
    if (!source.url) {
      continue;
    }

    const current = seen.get(source.url);
    if (current) {
      warnings.push(`URL duplicata tra ${current} e ${source.label}`);
      continue;
    }

    seen.set(source.url, source.label);
  }

  return warnings;
}

function getDynamicSheetEntries(seller) {
  const sheets = seller.sheets && typeof seller.sheets === "object" ? seller.sheets : {};

  return Object.entries(sheets)
    .filter(([, url]) => typeof url === "string" && url.trim())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, url]) => ({
      label: key,
      url: url.trim()
    }));
}

async function inspectSheet(label, url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const csvText = await response.text();
  const matrix = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
    transform: (value) => normalizeCell(value)
  }).data;

  const title = normalizeCell(matrix[0]?.[0]);
  const totalRow = matrix.find((row) => normalizeCell(row[0]).toUpperCase() === "TOTALI");

  return {
    label,
    url,
    title,
    calls: parseFlexibleNumber(totalRow?.[2]),
    closedFr: parseFlexibleNumber(totalRow?.[8]),
    revenueFr: parseFlexibleNumber(totalRow?.[9]),
    warnings: [
      ...(totalRow ? [] : ["Riga TOTALI non trovata"]),
      ...(parseFlexibleNumber(totalRow?.[2]) === 0 ? ["Chiamate totali a 0"] : [])
    ]
  };
}

async function main() {
  const env = loadEnv(".env.local");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const sellerFilter = process.argv[2]?.trim().toLowerCase();

  const { data: sellers, error } = await supabase
    .from("sellers")
    .select("name,sheet_url,sheets,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const filteredSellers = (sellers || []).filter((seller) =>
    sellerFilter ? seller.name.toLowerCase().includes(sellerFilter) : true
  );

  for (const seller of filteredSellers) {
    const sources = getDynamicSheetEntries(seller).filter((source) => source.url);

    const duplicateWarnings = buildDuplicateWarnings(sources);
    console.log(`\n=== ${seller.name} ===`);
    if (duplicateWarnings.length > 0) {
      console.log(`WARN: ${duplicateWarnings.join(" | ")}`);
    }

    for (const source of sources) {
      try {
        const report = await inspectSheet(source.label, source.url);
        const warnings = [...duplicateWarnings, ...report.warnings];
        console.log(
          [
            `${report.label}`,
            `calls=${report.calls}`,
            `closedFr=${report.closedFr}`,
            `revenueFr=${report.revenueFr}`,
            `title="${report.title}"`,
            warnings.length ? `warnings="${warnings.join(" | ")}"` : ""
          ]
            .filter(Boolean)
            .join(" | ")
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${source.label} | ERROR="${message}" | url="${source.url}"`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
