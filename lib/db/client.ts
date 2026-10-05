import type { Pool, PoolClient, QueryResult } from "pg";

import { getPool } from "@/lib/db/pool";

/**
 * Piccolo client Postgres che replica la parte dell'API di supabase-js usata
 * dall'app (from/select/insert/update/upsert/delete/rpc), cosi' i punti di
 * chiamata restano invariati dopo la migrazione dei dati su Railway.
 *
 * - Client "admin": usa direttamente il pool (utente proprietario, bypassa RLS).
 * - Client "utente": ogni query gira in una transazione con ruolo `authenticated`
 *   e con le claim JWT impostate, cosi' auth.uid() e le policy RLS funzionano
 *   come prima (l'autenticazione resta su Supabase Auth).
 */

export type DbError = {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
};

export type DbResult<T = any> = {
  data: T | null;
  error: DbError | null;
};

export type DbClaims = { sub: string; role?: string; email?: string | null } | null;

export type ClaimsResolver = () => Promise<DbClaims>;

type Executor = (sql: string, params: unknown[]) => Promise<QueryResult>;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function ident(name: string) {
  if (!IDENTIFIER.test(name)) {
    throw new Error(`Identificatore SQL non valido: ${name}`);
  }
  return `"${name}"`;
}

function toDbError(error: unknown): DbError {
  const candidate = error as { message?: string; code?: string; detail?: string; hint?: string };
  return {
    message: candidate?.message ?? "Errore database sconosciuto.",
    code: candidate?.code ?? null,
    details: candidate?.detail ?? null,
    hint: candidate?.hint ?? null
  };
}

// Array e oggetti finiscono in colonne jsonb: il driver pg altrimenti
// serializzerebbe gli array come array Postgres.
function toParam(value: unknown) {
  if (value === undefined) {
    return null;
  }

  if (value === null || value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function parseColumns(columns: string | undefined) {
  if (!columns || columns.trim() === "" || columns.trim() === "*") {
    return "*";
  }

  return columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .map((column) => (column === "*" ? "*" : ident(column)))
    .join(", ");
}

type Filter =
  | { op: "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "ilike" | "like"; column: string; value: unknown }
  | { op: "in"; column: string; value: unknown[] };

type Mutation =
  | { kind: "insert"; rows: Record<string, unknown>[] }
  | { kind: "update"; values: Record<string, unknown> }
  | { kind: "upsert"; rows: Record<string, unknown>[]; onConflict: string[] }
  | { kind: "delete" };

const OPERATORS: Record<string, string> = {
  eq: "=",
  neq: "<>",
  gte: ">=",
  lte: "<=",
  gt: ">",
  lt: "<",
  ilike: "ILIKE",
  like: "LIKE"
};

export class QueryBuilder<R = any[]> implements PromiseLike<DbResult<R>> {
  private columns: string | undefined;
  private hasSelect = false;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean; nullsFirst?: boolean }[] = [];
  private limitValue: number | null = null;
  private mode: "many" | "single" | "maybeSingle" = "many";
  private mutation: Mutation | null = null;

  constructor(
    private readonly table: string,
    private readonly execute: Executor
  ) {}

  select(columns?: string) {
    this.hasSelect = true;
    this.columns = columns;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = { kind: "insert", rows: Array.isArray(values) ? values : [values] };
    return this;
  }

  update(values: Record<string, unknown>) {
    this.mutation = { kind: "update", values };
    return this;
  }

  upsert(
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ) {
    this.mutation = {
      kind: "upsert",
      rows: Array.isArray(values) ? values : [values],
      onConflict: (options?.onConflict ?? "id").split(",").map((column) => column.trim())
    };
    return this;
  }

  delete() {
    this.mutation = { kind: "delete" };
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ op: "gt", column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ op: "lt", column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ op: "ilike", column, value });
    return this;
  }

  like(column: string, value: string) {
    this.filters.push({ op: "like", column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ op: "in", column, value: values });
    return this;
  }

  match(values: Record<string, unknown>) {
    Object.entries(values).forEach(([column, value]) => this.eq(column, value));
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst
    });
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single<T = any>() {
    this.mode = "single";
    return this as unknown as QueryBuilder<T>;
  }

  maybeSingle<T = any>() {
    this.mode = "maybeSingle";
    return this as unknown as QueryBuilder<T>;
  }

  private buildWhere(params: unknown[]) {
    if (this.filters.length === 0) {
      return "";
    }

    const clauses = this.filters.map((filter) => {
      const column = ident(filter.column);

      if (filter.op === "in") {
        params.push(filter.value.map((item) => (item === undefined ? null : item)));
        return `${column} = ANY($${params.length})`;
      }

      if (filter.op === "eq" && filter.value === null) {
        return `${column} IS NULL`;
      }

      if (filter.op === "neq" && filter.value === null) {
        return `${column} IS NOT NULL`;
      }

      params.push(toParam(filter.value));
      return `${column} ${OPERATORS[filter.op]} $${params.length}`;
    });

    return ` WHERE ${clauses.join(" AND ")}`;
  }

  private buildReturning() {
    return this.hasSelect ? ` RETURNING ${parseColumns(this.columns)}` : "";
  }

  private buildSql(): { sql: string; params: unknown[] } {
    const table = `"public".${ident(this.table)}`;
    const params: unknown[] = [];

    if (!this.mutation) {
      let sql = `SELECT ${parseColumns(this.columns)} FROM ${table}${this.buildWhere(params)}`;

      if (this.orders.length > 0) {
        sql += ` ORDER BY ${this.orders
          .map(
            (order) =>
              `${ident(order.column)} ${order.ascending ? "ASC" : "DESC"}${
                order.nullsFirst === undefined ? "" : order.nullsFirst ? " NULLS FIRST" : " NULLS LAST"
              }`
          )
          .join(", ")}`;
      }

      if (this.limitValue !== null) {
        sql += ` LIMIT ${Math.max(0, Math.floor(this.limitValue))}`;
      }

      return { sql, params };
    }

    if (this.mutation.kind === "delete") {
      return { sql: `DELETE FROM ${table}${this.buildWhere(params)}${this.buildReturning()}`, params };
    }

    if (this.mutation.kind === "update") {
      const entries = Object.entries(this.mutation.values).filter(([, value]) => value !== undefined);

      if (entries.length === 0) {
        throw new Error("UPDATE senza campi da modificare.");
      }

      const sets = entries.map(([column, value]) => {
        params.push(toParam(value));
        return `${ident(column)} = $${params.length}`;
      });

      return {
        sql: `UPDATE ${table} SET ${sets.join(", ")}${this.buildWhere(params)}${this.buildReturning()}`,
        params
      };
    }

    const rows = this.mutation.rows;

    if (rows.length === 0) {
      return { sql: `SELECT 1 WHERE false`, params };
    }

    const columns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row).filter((key) => row[key] !== undefined)))
    );

    if (columns.length === 0) {
      return { sql: `INSERT INTO ${table} DEFAULT VALUES${this.buildReturning()}`, params };
    }

    const valueTuples = rows.map((row) => {
      const placeholders = columns.map((column) => {
        if (row[column] === undefined) {
          return "DEFAULT";
        }
        params.push(toParam(row[column]));
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    let sql = `INSERT INTO ${table} (${columns.map(ident).join(", ")}) VALUES ${valueTuples.join(", ")}`;

    if (this.mutation.kind === "upsert") {
      const conflict = this.mutation.onConflict;
      const updatable = columns.filter((column) => !conflict.includes(column));
      sql += ` ON CONFLICT (${conflict.map(ident).join(", ")}) `;
      sql +=
        updatable.length > 0
          ? `DO UPDATE SET ${updatable.map((column) => `${ident(column)} = EXCLUDED.${ident(column)}`).join(", ")}`
          : "DO NOTHING";
    }

    return { sql: sql + this.buildReturning(), params };
  }

  private async run(): Promise<DbResult> {
    try {
      const { sql, params } = this.buildSql();
      const result = await this.execute(sql, params);

      if (this.mutation && !this.hasSelect) {
        return { data: null, error: null };
      }

      if (this.mode === "many") {
        return { data: result.rows, error: null };
      }

      if (result.rows.length === 1) {
        return { data: result.rows[0], error: null };
      }

      if (result.rows.length === 0 && this.mode === "maybeSingle") {
        return { data: null, error: null };
      }

      return {
        data: null,
        error: {
          message: "JSON object requested, multiple (or no) rows returned",
          code: "PGRST116",
          details: `The result contains ${result.rows.length} rows`,
          hint: null
        }
      };
    } catch (error) {
      return { data: null, error: toDbError(error) };
    }
  }

  then<TResult1 = DbResult<R>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<R>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return (this.run() as Promise<DbResult<R>>).then(onfulfilled, onrejected);
  }
}

const functionMetaCache = new Map<string, { retset: boolean; scalar: boolean }>();

async function loadFunctionMeta(name: string, execute: Executor) {
  const cached = functionMetaCache.get(name);
  if (cached) {
    return cached;
  }

  const result = await execute(
    `SELECT p.proretset AS retset, (t.typtype <> 'c' AND p.prorettype <> 'record'::regtype) AS scalar
       FROM pg_proc p
       JOIN pg_type t ON t.oid = p.prorettype
      WHERE p.pronamespace = 'public'::regnamespace AND p.proname = $1
      LIMIT 1`,
    [name]
  );

  const meta = {
    retset: Boolean(result.rows[0]?.retset),
    scalar: result.rows[0] ? Boolean(result.rows[0].scalar) : true
  };
  functionMetaCache.set(name, meta);
  return meta;
}

async function callRpc(name: string, args: Record<string, unknown> | undefined, execute: Executor): Promise<DbResult> {
  try {
    const meta = await loadFunctionMeta(name, execute);
    const params: unknown[] = [];
    const argSql = Object.entries(args ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        params.push(toParam(value));
        return `${ident(key)} := $${params.length}`;
      })
      .join(", ");

    const result = await execute(`SELECT * FROM "public".${ident(name)}(${argSql})`, params);

    if (meta.scalar) {
      const values = result.rows.map((row) => row[name] ?? Object.values(row)[0] ?? null);
      return { data: meta.retset ? values : (values[0] ?? null), error: null };
    }

    return { data: meta.retset ? result.rows : (result.rows[0] ?? null), error: null };
  } catch (error) {
    return { data: null, error: toDbError(error) };
  }
}

function buildPoolExecutor(pool: Pool): Executor {
  return (sql, params) => pool.query(sql, params as any[]);
}

function buildUserExecutor(pool: Pool, resolveClaims: ClaimsResolver): Executor {
  return async (sql, params) => {
    const claims = await resolveClaims();
    const client: PoolClient = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(`SET LOCAL ROLE ${claims ? "authenticated" : "anon"}`);

      if (claims) {
        const payload = JSON.stringify({ role: "authenticated", ...claims });
        await client.query("SELECT set_config('request.jwt.claims', $1, true)", [payload]);
      }

      const result = await client.query(sql, params as any[]);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  };
}

function buildDbApi(execute: Executor) {
  return {
    from: (table: string) => new QueryBuilder(table, execute),
    rpc: (name: string, args?: Record<string, unknown>) => callRpc(name, args, execute)
  };
}

/** Accesso con privilegi pieni (equivalente al service role di Supabase). */
export function createAdminDb() {
  return buildDbApi(buildPoolExecutor(getPool()));
}

/** Accesso con le claim dell'utente autenticato (RLS attiva). */
export function createUserDb(resolveClaims: ClaimsResolver) {
  return buildDbApi(buildUserExecutor(getPool(), resolveClaims));
}

export type DbApi = ReturnType<typeof buildDbApi>;
