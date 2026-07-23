# Sales KPI Dashboard

Dashboard premium in Next.js 14+ per monitorare le performance dei venditori con dati letti da Google Sheets o mock data.

## Struttura progetto

```text
app/
  api/dashboard/route.ts       API route server-side per lettura e aggregazione
  globals.css                  tema chiaro premium
  layout.tsx
  page.tsx
components/
  dashboard/                   header, filtri, KPI grid, grafico, podio, tabella
  ui/                          componenti shadcn-style
config/
  sheets.ts                    configurazione multi-foglio Google Sheets
lib/
  google-sheets.ts             adapter robusto CSV/API e merge dataset
  normalize.ts                 parsing date/numeri e normalizzazione righe
  kpi.ts                       utility KPI aggregate
  data/                        mock, filtri e dashboard service
  formatters.ts
```

## Setup locale

1. Installa le dipendenze con `npm install`
2. Configura `.env.local`
3. Avvia il progetto con `npm run dev`
4. Apri `http://localhost:3000`

### Variabili ambiente AI

Per attivare l'assistente KPI con OpenAI aggiungi anche:

```env
OPENAI_API_KEY=la_tua_chiave_openai
OPENAI_MODEL=gpt-5.6
```

Se `OPENAI_API_KEY` manca, la Home continua a funzionare usando il fallback KPI locale.

## Configurazione Google Sheets

La configurazione principale è in [sheets.ts](/Users/pirvu/Desktop/Cold%20Team/config/sheets.ts).

Puoi scegliere:

- `GOOGLE_SHEETS_MODE=csv_public` per leggere fogli pubblicati come CSV
- `GOOGLE_SHEETS_MODE=google_api` per usare Google Sheets API

Ogni sorgente definisce:

- `spreadsheetId`
- `sheetName`
- `sellerName`
- `columns`

Inserisci gli ID nei seguenti env:

- `GOOGLE_SHEETS_SPREADSHEET_ID_1`
- `GOOGLE_SHEETS_SHEET_NAME_1`
- `GOOGLE_SHEETS_SELLER_NAME_1`
- `GOOGLE_SHEETS_PUBLISHED_CSV_URL_1`
- `GOOGLE_SHEETS_API_KEY`

## KPI implementati

- Chiamate totali
- Appuntamenti presi
- Appuntamenti svolti
- Chiusi
- Fatturato totale
- Ticket medio
- Conversione generale
- Show-up rate
- Closing rate

## Note implementative

- Le date in formato `gg/mm/aaaa` vengono convertite in ISO
- Numeri con virgola o punto vengono normalizzati correttamente
- Celle vuote o valori null usano fallback sicuro a `0`
- Più fogli vengono aggregati in un dataset unico
- I filtri aggiornano KPI, trend e classifica via API route

## Deploy su Vercel

1. Importa il repository su Vercel
2. Aggiungi le variabili ambiente del file `.env.example`
3. Esegui il deploy

La struttura è pronta per esecuzione serverless.
