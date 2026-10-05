import { Pool, types } from "pg";

// PostgREST (Supabase) restituiva numeri e date gia' in formato JSON-friendly.
// Il driver pg di default restituisce stringhe/oggetti Date: allineiamo i tipi
// cosi' il resto del codice non cambia.
types.setTypeParser(20, (value) => Number(value)); // int8
types.setTypeParser(1700, (value) => Number(value)); // numeric
types.setTypeParser(1082, (value) => value); // date -> "YYYY-MM-DD"
types.setTypeParser(1184, (value) => new Date(value).toISOString()); // timestamptz

const globalForDb = globalThis as unknown as { __kpiPgPool?: Pool };

export function getPool() {
  if (!globalForDb.__kpiPgPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("La variabile DATABASE_URL non e configurata.");
    }

    globalForDb.__kpiPgPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
    });

    globalForDb.__kpiPgPool.on("error", (error) => {
      console.error("Errore sul pool Postgres", error);
    });
  }

  return globalForDb.__kpiPgPool;
}
