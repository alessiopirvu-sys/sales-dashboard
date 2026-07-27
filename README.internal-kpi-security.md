# Internal KPI Security Checklist

Questa checklist serve per validare la sicurezza del modulo KPI interno prima della FASE 2B.
Non modifica il database remoto ed e pensata come verifica manuale/di staging dopo l'applicazione locale delle migration.

## Obiettivi da verificare

- Un seller non puo promuoversi ad admin.
- Un seller non puo riattivare il proprio account.
- Un seller non puo creare o modificare direttamente periodi mensili.
- Un seller non puo inserire KPI per un altro venditore.
- Un seller non puo scrivere KPI su un periodo locked.
- Un seller non puo alterare `seller_id`, `reporting_period_id`, `report_date`, `day_number`, `day_type`, `created_at`, `updated_by`, `validation_status`, `validation_errors`.
- Un utente senza `profiles` non puo leggere o scrivere.
- Un utente disattivato non puo leggere o scrivere.
- Un admin puo gestire periodi e KPI.
- I dati legacy Google Sheets restano fuori da questo modulo.

## Verifiche SQL/RLS suggerite

### 1. Seller non puo promuoversi ad admin

Atteso: `UPDATE 0` o errore RLS.

```sql
update public.profiles
set role = 'admin'
where id = auth.uid();
```

### 2. Seller non puo riattivare il proprio account

Atteso: `UPDATE 0` o errore RLS.

```sql
update public.profiles
set is_active = true
where id = auth.uid();
```

### 3. Seller non puo creare un periodo per se o per altri direttamente

Atteso: errore RLS.

```sql
insert into public.seller_reporting_periods (seller_id, year, month, status, source)
values ('00000000-0000-0000-0000-000000000000', 2026, 8, 'open', 'manual');
```

### 4. Seller non puo scrivere KPI direttamente

Atteso: errore RLS su `INSERT` e `UPDATE`.

```sql
insert into public.seller_daily_kpis (
  reporting_period_id,
  seller_id,
  report_date,
  day_number,
  day_type,
  fr_calls
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '2026-07-01',
  1,
  'FERIALE',
  10
);
```

### 5. Seller non puo alterare un periodo locked

Atteso: impossibile tramite DML diretto seller; la futura API dovra anche verificare `status = 'open'`.

### 6. Seller non puo modificare audit log

Atteso: errore RLS o trigger append-only.

```sql
update public.seller_kpi_audit_logs
set payload = '{"tampered":true}'::jsonb
where id = '00000000-0000-0000-0000-000000000000';
```

### 7. Admin puo gestire i periodi

Atteso: consentito via policy admin.

```sql
update public.seller_reporting_periods
set status = 'locked'
where id = '00000000-0000-0000-0000-000000000000';
```

## Note architetturali deliberate

- La creazione dei periodi seller avverra solo via API server-side controllata.
- Il salvataggio KPI seller avverra solo via API server-side controllata.
- `seller_kpi_audit_logs` e append-only.
- Il modulo Google Sheets legacy non viene letto o scritto da queste migration.
