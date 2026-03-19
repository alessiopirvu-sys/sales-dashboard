import { SheetSourceConfig, SheetsReadMode } from "@/lib/types";

export const sheetsMode: SheetsReadMode =
  (process.env.GOOGLE_SHEETS_MODE as SheetsReadMode) || "csv_public";

export const googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY || "";

export const sheetSources: SheetSourceConfig[] = [
  {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_1 || "INSERISCI_SPREADSHEET_ID",
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME_1 || "Venditore 1",
    sellerName: process.env.GOOGLE_SHEETS_SELLER_NAME_1 || "Giulia Ferri",
    publishedCsvUrl: process.env.GOOGLE_SHEETS_PUBLISHED_CSV_URL_1 || "",
    columns: {
      date: process.env.GOOGLE_SHEETS_COL_DATE_1 || "GIORNO",
      type: process.env.GOOGLE_SHEETS_COL_TYPE_1 || "TIPO",
      callsFr: process.env.GOOGLE_SHEETS_COL_CALLS_FR_1 || "N° CHIAMATE FR",
      notInterestedFr:
        process.env.GOOGLE_SHEETS_COL_NOT_INTERESTED_FR_1 || "NON INTERESSATI",
      nrFr: process.env.GOOGLE_SHEETS_COL_NR_FR_1 || "NR",
      appointmentsBookedFr:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_BOOKED_FR_1 || "APP PRESI FR",
      appointmentsDoneFr:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_FR_1 || "SVOLTI FR",
      noShowFr: process.env.GOOGLE_SHEETS_COL_NO_SHOW_FR_1 || "NO SHOW FR",
      closedFr: process.env.GOOGLE_SHEETS_COL_CLOSED_FR_1 || "CHIUSI FR",
      revenueFr: process.env.GOOGLE_SHEETS_COL_REVENUE_FR_1 || "SOLDI FR",
      contactsFr: process.env.GOOGLE_SHEETS_COL_CONTACTS_FR_1 || "CONTATTI FR",
      d2dBase: process.env.GOOGLE_SHEETS_COL_D2D_BASE_1 || "D2D",
      appointmentsBookedD2d:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_BOOKED_D2D_1 || "APP D2D",
      appointmentsDoneD2d:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_D2D_1 || "SVOLTI D2D",
      noShowD2d: process.env.GOOGLE_SHEETS_COL_NO_SHOW_D2D_1 || "NO SHOW D2D",
      closedD2d: process.env.GOOGLE_SHEETS_COL_CLOSED_D2D_1 || "CHIUSI D2D",
      revenueD2d: process.env.GOOGLE_SHEETS_COL_REVENUE_D2D_1 || "SOLDI D2D",
      officeBase: process.env.GOOGLE_SHEETS_COL_OFFICE_BASE_1 || "UFFICIO",
      appointmentsDoneOffice:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_OFFICE_1 || "UFFICIO SVOLTI",
      noShowOffice:
        process.env.GOOGLE_SHEETS_COL_NO_SHOW_OFFICE_1 || "NO SHOW UFFICIO",
      closedOffice: process.env.GOOGLE_SHEETS_COL_CLOSED_OFFICE_1 || "UFFICIO CHIUSI",
      revenueOffice: process.env.GOOGLE_SHEETS_COL_REVENUE_OFFICE_1 || "UFFICIO SOLDI"
    }
  },
  {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_2 || "",
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME_2 || "",
    sellerName: process.env.GOOGLE_SHEETS_SELLER_NAME_2 || "",
    publishedCsvUrl: process.env.GOOGLE_SHEETS_PUBLISHED_CSV_URL_2 || "",
    columns: {
      date: process.env.GOOGLE_SHEETS_COL_DATE_2 || "GIORNO",
      type: process.env.GOOGLE_SHEETS_COL_TYPE_2 || "TIPO",
      callsFr: process.env.GOOGLE_SHEETS_COL_CALLS_FR_2 || "N° CHIAMATE FR",
      notInterestedFr:
        process.env.GOOGLE_SHEETS_COL_NOT_INTERESTED_FR_2 || "NON INTERESSATI",
      nrFr: process.env.GOOGLE_SHEETS_COL_NR_FR_2 || "NR",
      appointmentsBookedFr:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_BOOKED_FR_2 || "APP PRESI FR",
      appointmentsDoneFr:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_FR_2 || "SVOLTI FR",
      noShowFr: process.env.GOOGLE_SHEETS_COL_NO_SHOW_FR_2 || "NO SHOW FR",
      closedFr: process.env.GOOGLE_SHEETS_COL_CLOSED_FR_2 || "CHIUSI FR",
      revenueFr: process.env.GOOGLE_SHEETS_COL_REVENUE_FR_2 || "SOLDI FR",
      contactsFr: process.env.GOOGLE_SHEETS_COL_CONTACTS_FR_2 || "CONTATTI FR",
      d2dBase: process.env.GOOGLE_SHEETS_COL_D2D_BASE_2 || "D2D",
      appointmentsBookedD2d:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_BOOKED_D2D_2 || "APP D2D",
      appointmentsDoneD2d:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_D2D_2 || "SVOLTI D2D",
      noShowD2d: process.env.GOOGLE_SHEETS_COL_NO_SHOW_D2D_2 || "NO SHOW D2D",
      closedD2d: process.env.GOOGLE_SHEETS_COL_CLOSED_D2D_2 || "CHIUSI D2D",
      revenueD2d: process.env.GOOGLE_SHEETS_COL_REVENUE_D2D_2 || "SOLDI D2D",
      officeBase: process.env.GOOGLE_SHEETS_COL_OFFICE_BASE_2 || "UFFICIO",
      appointmentsDoneOffice:
        process.env.GOOGLE_SHEETS_COL_APPOINTMENTS_DONE_OFFICE_2 || "UFFICIO SVOLTI",
      noShowOffice:
        process.env.GOOGLE_SHEETS_COL_NO_SHOW_OFFICE_2 || "NO SHOW UFFICIO",
      closedOffice: process.env.GOOGLE_SHEETS_COL_CLOSED_OFFICE_2 || "UFFICIO CHIUSI",
      revenueOffice: process.env.GOOGLE_SHEETS_COL_REVENUE_OFFICE_2 || "UFFICIO SOLDI"
    }
  }
].filter(
  (source) =>
    source.spreadsheetId &&
    source.spreadsheetId !== "INSERISCI_SPREADSHEET_ID" &&
    source.sheetName &&
    source.sellerName
);
