#!/usr/bin/env bash
# Copia lo schema `public` (struttura, dati, RLS, funzioni) da Supabase a Railway.
# Supabase resta in uso SOLO per l'autenticazione (auth.users non viene toccata).
#
# Uso:  scripts/db/migrate-to-railway.sh
# Legge SUPABASE_DB_URL e RAILWAY_DB_URL da .env.migration.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -x "$(brew --prefix libpq 2>/dev/null)/bin/pg_dump" ]; then
  export PATH="$(brew --prefix libpq)/bin:$PATH"
fi

set -a
# shellcheck disable=SC1091
. ./.env.migration
set +a

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL mancante in .env.migration}"
: "${RAILWAY_DB_URL:?RAILWAY_DB_URL mancante in .env.migration}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="backups/supabase-public-${STAMP}.dump"
LIST="$(mktemp)"
mkdir -p backups

echo "==> 1/6 Verifica connessioni"
psql "$SUPABASE_DB_URL" -Atc "select 'supabase ok: ' || split_part(version(), ' ', 2)"
psql "$RAILWAY_DB_URL" -Atc "select 'railway ok: ' || split_part(version(), ' ', 2)"

EXISTING="$(psql "$RAILWAY_DB_URL" -Atc "select count(*) from information_schema.tables where table_schema = 'public'")"
if [ "$EXISTING" != "0" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "Il database Railway contiene gia $EXISTING tabelle in public." >&2
  echo "Per sovrascriverle rilancia con FORCE=1 (le tabelle esistenti vengono eliminate)." >&2
  exit 1
fi

echo "==> 2/6 Bootstrap Railway (ruoli + auth.uid())"
psql "$RAILWAY_DB_URL" -v ON_ERROR_STOP=1 -q -f scripts/db/bootstrap.sql

echo "==> 3/6 Dump dello schema public da Supabase -> $DUMP"
pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner -Fc -f "$DUMP"

echo "==> 4/6 Preparo la lista di restore (senza FK verso auth.users)"
# Le FK verso auth.users non hanno senso su Railway: gli utenti stanno su Supabase.
AUTH_FKS="$(psql "$SUPABASE_DB_URL" -Atc "select conname from pg_constraint where contype = 'f' and confrelid = 'auth.users'::regclass")"
pg_restore -l "$DUMP" > "$LIST"
if [ -n "$AUTH_FKS" ]; then
  FK_REGEX="$(echo "$AUTH_FKS" | paste -sd'|' -)"
  grep -vE "FK CONSTRAINT public [^ ]+ (${FK_REGEX})( |$)" "$LIST" > "${LIST}.filtered"
  mv "${LIST}.filtered" "$LIST"
fi

echo "==> 5/6 Restore su Railway"
if [ "${FORCE:-0}" = "1" ]; then
  pg_restore --no-owner --clean --if-exists -L "$LIST" -d "$RAILWAY_DB_URL" "$DUMP" || true
else
  pg_restore --no-owner -L "$LIST" -d "$RAILWAY_DB_URL" "$DUMP" || true
fi

echo "==> 6/6 Confronto righe per tabella (supabase vs railway)"
TABLES="$(psql "$SUPABASE_DB_URL" -Atc "select tablename from pg_tables where schemaname = 'public' order by 1")"
STATUS=0
printf '%-34s %10s %10s\n' tabella supabase railway
for t in $TABLES; do
  a="$(psql "$SUPABASE_DB_URL" -Atc "select count(*) from public.\"$t\"")"
  b="$(psql "$RAILWAY_DB_URL" -Atc "select count(*) from public.\"$t\"" 2>/dev/null || echo MANCA)"
  flag=""
  [ "$a" != "$b" ] && flag="  <-- DIVERSO" && STATUS=1
  printf '%-34s %10s %10s%s\n' "$t" "$a" "$b" "$flag"
done

rm -f "$LIST"
if [ "$STATUS" -ne 0 ]; then
  echo "ATTENZIONE: alcune tabelle non coincidono." >&2
  exit 1
fi
echo "Migrazione completata. Backup: $DUMP"
