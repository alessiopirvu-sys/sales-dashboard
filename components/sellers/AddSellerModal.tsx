"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Unlink2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getDuplicateSellerSheetError,
  INVALID_SHEETS_CSV_MESSAGE,
  isValidGoogleSheetsCsvUrl
} from "@/lib/google-sheets-url";
import { sellerPlatformAccessSchema, type PlatformAccountState } from "@/lib/sellers/access";
import { getCurrentSellerSheetYear, getSellerSheetEntries, getSellerSheetsMap } from "@/lib/seller-sheets";
import { SellerRecord, SellerSheetsMap } from "@/lib/types";

type AddSellerModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  seller?: SellerRecord | null;
};

type MonthModalState = {
  open: boolean;
  editingKey: string | null;
  year: string;
  month: string;
  url: string;
  error: string | null;
};

type AccessFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  accountStatus: PlatformAccountState;
};

const currentYear = getCurrentSellerSheetYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => String(currentYear - 1 + index));
const monthOptions = [
  { value: "01", label: "Gennaio" },
  { value: "02", label: "Febbraio" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Aprile" },
  { value: "05", label: "Maggio" },
  { value: "06", label: "Giugno" },
  { value: "07", label: "Luglio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Settembre" },
  { value: "10", label: "Ottobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Dicembre" }
];

const initialForm = {
  name: "",
  sheets: {} as SellerSheetsMap
};

const initialAccessForm: AccessFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  accountStatus: "none"
};

const initialMonthModalState: MonthModalState = {
  open: false,
  editingKey: null,
  year: String(currentYear),
  month: "01",
  url: "",
  error: null
};

function formatTruncatedUrl(url: string) {
  return url.length > 44 ? `${url.slice(0, 44)}...` : url;
}

function formatLastLogin(value?: string | null) {
  if (!value) {
    return "Mai";
  }

  return new Date(value).toLocaleString("it-IT");
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null
  );
}

function getInitialAccessState(seller?: SellerRecord | null): AccessFormState {
  if (!seller?.profile_id) {
    return initialAccessForm;
  }

  return {
    email: seller.email ?? "",
    password: "",
    confirmPassword: "",
    accountStatus: seller.is_active ? "active" : "disabled"
  };
}

function getAccountBadge(accountStatus: PlatformAccountState, hasLinkedProfile: boolean) {
  if (!hasLinkedProfile && accountStatus === "none") {
    return {
      label: "Accesso non configurato",
      className: "bg-amber-50 text-amber-700"
    };
  }

  if (accountStatus === "disabled") {
    return {
      label: "Account disattivato",
      className: "bg-rose-50 text-rose-700"
    };
  }

  return {
    label: "Account attivo",
    className: "bg-emerald-50 text-emerald-700"
  };
}

export function AddSellerModal({ open, onClose, onSaved, seller }: AddSellerModalProps) {
  const dialogTitleId = useId();
  const [form, setForm] = useState(initialForm);
  const [accessForm, setAccessForm] = useState<AccessFormState>(initialAccessForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [monthModal, setMonthModal] = useState<MonthModalState>(initialMonthModalState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [isAccountActionLoading, setIsAccountActionLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const monthDialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const monthUrlInputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string>("");

  const hasLinkedProfile = Boolean(seller?.profile_id);
  const accountBadge = getAccountBadge(accessForm.accountStatus, hasLinkedProfile);

  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      previousBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setForm({
        name: seller?.name ?? "",
        sheets: getSellerSheetsMap(seller ?? {})
      });
      setAccessForm(getInitialAccessState(seller));
      setError(null);
      setMessage(null);
      setMonthModal(initialMonthModalState);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordEditor(!seller?.profile_id);
      setIsAccountActionLoading(false);
      window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = previousBodyOverflowRef.current;
      previousActiveElementRef.current?.focus();
      setForm(initialForm);
      setAccessForm(initialAccessForm);
      setError(null);
      setMessage(null);
      setIsSaving(false);
      setMonthModal(initialMonthModalState);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordEditor(false);
      setIsAccountActionLoading(false);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
    };
  }, [open, seller]);

  useEffect(() => {
    if (!monthModal.open) {
      return;
    }

    window.setTimeout(() => {
      monthUrlInputRef.current?.focus();
    }, 0);
  }, [monthModal.open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (monthModal.open) {
          closeMonthModal();
          return;
        }
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const activeContainer = monthModal.open ? monthDialogRef.current : dialogRef.current;
      const focusableElements = getFocusableElements(activeContainer);
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === firstElement || !activeContainer?.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement || !activeContainer?.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [monthModal.open, onClose, open]);

  const sheetEntries = useMemo(() => getSellerSheetEntries({ sheets: form.sheets }), [form.sheets]);

  const duplicateSheetError = useMemo(
    () =>
      getDuplicateSellerSheetError(sheetEntries.map((entry) => ({ label: entry.label, url: entry.url }))),
    [sheetEntries]
  );

  const openAddMonthModal = () => {
    setMonthModal({
      open: true,
      editingKey: null,
      year: String(currentYear),
      month: "01",
      url: "",
      error: null
    });
  };

  const openEditMonthModal = (key: string) => {
    const [year, month] = key.split("-");
    setMonthModal({
      open: true,
      editingKey: key,
      year,
      month,
      url: form.sheets[key] ?? "",
      error: null
    });
  };

  const closeMonthModal = () => {
    setMonthModal(initialMonthModalState);
  };

  const handleSaveMonth = () => {
    const nextKey = `${monthModal.year}-${monthModal.month}`;
    const trimmedUrl = monthModal.url.trim();

    if (!trimmedUrl) {
      setMonthModal((current) => ({ ...current, error: "Il link CSV e obbligatorio." }));
      return;
    }

    if (!isValidGoogleSheetsCsvUrl(trimmedUrl)) {
      setMonthModal((current) => ({ ...current, error: INVALID_SHEETS_CSV_MESSAGE }));
      return;
    }

    if (monthModal.editingKey !== nextKey && form.sheets[nextKey]) {
      setMonthModal((current) => ({
        ...current,
        error: "Esiste gia un collegamento configurato per questo mese."
      }));
      return;
    }

    const nextSheets = { ...form.sheets };
    if (monthModal.editingKey && monthModal.editingKey !== nextKey) {
      delete nextSheets[monthModal.editingKey];
    }
    nextSheets[nextKey] = trimmedUrl;

    const nextDuplicateError = getDuplicateSellerSheetError([
      ...getSellerSheetEntries({ sheets: nextSheets }).map((entry) => ({
        label: entry.label,
        url: entry.url
      }))
    ]);

    if (nextDuplicateError) {
      setMonthModal((current) => ({ ...current, error: nextDuplicateError }));
      return;
    }

    setForm((current) => ({ ...current, sheets: nextSheets }));
    closeMonthModal();
  };

  const handleDeleteMonth = (key: string) => {
    setForm((current) => {
      const nextSheets = { ...current.sheets };
      delete nextSheets[key];
      return { ...current, sheets: nextSheets };
    });
  };

  const updateAccessForm = (patch: Partial<AccessFormState>) => {
    setAccessForm((current) => {
      const next = { ...current, ...patch };
      const isPreparingAccount =
        !hasLinkedProfile &&
        (next.email.trim().length > 0 || next.password.length > 0 || next.confirmPassword.length > 0);

      if (isPreparingAccount && next.accountStatus === "none") {
        next.accountStatus = "active";
      }

      return next;
    });
  };

  const clearPasswordFields = () => {
    setAccessForm((current) => ({
      ...current,
      password: "",
      confirmPassword: ""
    }));
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (hasLinkedProfile) {
      setShowPasswordEditor(false);
    }
  };

  const performAccountAction = async (
    requestFactory: () => Promise<Response>,
    successMessage: string,
    confirmationMessage?: string
  ) => {
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return;
    }

    setIsAccountActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestFactory();
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Operazione non riuscita.");
      }

      setMessage(successMessage);
      await onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante la gestione dell'account."
      );
    } finally {
      setIsAccountActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (duplicateSheetError) {
        throw new Error(duplicateSheetError);
      }

      const accessValidation = sellerPlatformAccessSchema.safeParse(accessForm);
      if (!accessValidation.success) {
        throw new Error(accessValidation.error.issues[0]?.message ?? "Dati accesso non validi.");
      }

      const method = seller ? "PATCH" : "POST";
      const url = seller ? `/api/sellers/${seller.id}` : "/api/sellers";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          sheets: form.sheets,
          access: accessValidation.data
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        const baseMessage = payload.message || payload.error || "Impossibile salvare il venditore.";
        const detailedMessage =
          process.env.NODE_ENV === "development"
            ? `Errore API ${response.status}: ${baseMessage}`
            : baseMessage;

        throw new Error(detailedMessage);
      }

      clearPasswordFields();
      setMessage(
        seller
          ? "Venditore aggiornato correttamente."
          : "Venditore creato correttamente."
      );
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il salvataggio."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="w-full max-w-5xl"
      >
        <Card className="flex max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-[2rem] border-white/90 sm:max-h-[calc(100vh-32px)]">
          <CardHeader className="shrink-0 border-b border-slate-100 pb-4">
            <CardTitle className="text-[1.35rem]">
              <span id={dialogTitleId}>
              {seller ? "Modifica venditore" : "Aggiungi venditore"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-0 py-0">
            <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
            <section className="space-y-4 rounded-[1.8rem] border border-slate-100 bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Dati venditore
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-600">Nome venditore</label>
                <Input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Mario Rossi"
                  className="h-12"
                />
              </div>

              <section className="space-y-4 rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Google Sheets</h3>
                    <p className="text-xs text-slate-500">
                      Configura solo i mesi realmente necessari. Il venditore usera soltanto i fogli mensili.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 rounded-full px-4"
                    onClick={openAddMonthModal}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi mese
                  </Button>
                </div>

                {sheetEntries.length > 0 ? (
                  <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anno</TableHead>
                          <TableHead>Mese</TableHead>
                          <TableHead>Link CSV</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sheetEntries.map((entry) => (
                          <TableRow key={entry.key}>
                            <TableCell>{entry.year}</TableCell>
                            <TableCell>{entry.label.split(" ")[0]}</TableCell>
                            <TableCell className="max-w-[260px]">
                              <span title={entry.url} className="block truncate">
                                {formatTruncatedUrl(entry.url)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="h-9 rounded-full px-3"
                                  onClick={() => openEditMonthModal(entry.key)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifica
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="h-9 rounded-full px-3 text-rose-600 hover:text-rose-700"
                                  onClick={() => handleDeleteMonth(entry.key)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Elimina
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Nessun foglio Google Sheets configurato.
                  </div>
                )}
              </section>
            </section>

            <section className="space-y-5 rounded-[1.8rem] border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Accesso alla piattaforma
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Crea o aggiorna l'accesso del venditore senza uscire da questa scheda.
                  </p>
                </div>
                <Badge variant="secondary" className={accountBadge.className}>
                  {accountBadge.label}
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-600">Email di accesso</label>
                    <Input
                      type="email"
                      value={accessForm.email}
                      onChange={(event) => updateAccessForm({ email: event.target.value })}
                      placeholder="mario.rossi@azienda.it"
                      className="h-12"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-slate-600">
                          Password temporanea
                        </label>
                        {hasLinkedProfile ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-primary"
                            onClick={() => setShowPasswordEditor((current) => !current)}
                          >
                            {showPasswordEditor ? "Annulla" : "Cambia password"}
                          </button>
                        ) : null}
                      </div>
                      {showPasswordEditor || !hasLinkedProfile ? (
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={accessForm.password}
                            onChange={(event) => updateAccessForm({ password: event.target.value })}
                            placeholder="Minimo 8 caratteri"
                            className="h-12 pr-12"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            onClick={() => setShowPassword((current) => !current)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-12 items-center rounded-2xl border border-slate-200 px-4 text-sm text-slate-400">
                          Password nascosta
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-600">
                        Conferma password
                      </label>
                      {showPasswordEditor || !hasLinkedProfile ? (
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={accessForm.confirmPassword}
                            onChange={(event) =>
                              updateAccessForm({ confirmPassword: event.target.value })
                            }
                            placeholder="Ripeti la password"
                            className="h-12 pr-12"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            onClick={() => setShowConfirmPassword((current) => !current)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-12 items-center rounded-2xl border border-slate-200 px-4 text-sm text-slate-400">
                          Compila solo se vuoi sostituirla
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Minimo 8 caratteri, almeno una lettera e un numero. Questa password e provvisoria: al primo accesso il venditore dovra sceglierne una nuova. Il recupero password avviene via email.
                  </p>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-600">Stato account</label>
                    <Select
                      value={accessForm.accountStatus}
                      onValueChange={(value: PlatformAccountState) =>
                        updateAccessForm({ accountStatus: value })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Seleziona stato account" />
                      </SelectTrigger>
                      <SelectContent>
                        {!hasLinkedProfile ? <SelectItem value="none">Nessun account</SelectItem> : null}
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="disabled">Disattivato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Email attuale:</span>{" "}
                      {seller?.email || accessForm.email || "Non configurata"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Ultimo accesso:</span>{" "}
                      {formatLastLogin(seller?.last_login_at)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Stato account:</span>{" "}
                      {accountBadge.label}
                    </p>
                  </div>

                  {hasLinkedProfile ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-full px-4"
                        onClick={() => setShowPasswordEditor(true)}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Cambia password
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-full px-4"
                        onClick={() =>
                          updateAccessForm({
                            accountStatus:
                              accessForm.accountStatus === "disabled" ? "active" : "disabled"
                          })
                        }
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {accessForm.accountStatus === "disabled" ? "Riattiva" : "Disattiva"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-full px-4"
                        disabled={isAccountActionLoading}
                        onClick={() =>
                          void performAccountAction(
                            () =>
                              fetch(`/api/admin/sellers/${seller?.id}/reset-password`, {
                                method: "POST"
                              }),
                            "Email di reset password inviata."
                          )
                        }
                      >
                        {isAccountActionLoading ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Reset password
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-full border-rose-200 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={isAccountActionLoading}
                        onClick={() =>
                          void performAccountAction(
                            () =>
                              fetch(`/api/admin/sellers/${seller?.id}/unlink`, {
                                method: "POST"
                              }),
                            "Account scollegato dal venditore.",
                            "Confermi lo scollegamento dell'account da questo venditore?"
                          )
                        }
                      >
                        <Unlink2 className="mr-2 h-4 w-4" />
                        Scollega account
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Se compili email e password verra creato subito l'accesso alla piattaforma con password provvisoria.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {duplicateSheetError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {duplicateSheetError}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            </div>
          </CardContent>
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="h-12 rounded-full px-5"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Annulla
                </Button>
                <Button
                  className="h-12 rounded-full px-5"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvataggio..." : seller ? "Salva modifiche" : "Crea venditore"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {monthModal.open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/20 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMonthModal();
            }
          }}
        >
          <Card
            ref={monthDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogTitleId}-month`}
            className="w-full max-w-lg rounded-[2rem] border-white/90"
          >
            <CardHeader className="pb-3">
              <CardTitle id={`${dialogTitleId}-month`} className="text-xl">
                {monthModal.editingKey ? "Modifica mese" : "Aggiungi mese"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-600">Anno</label>
                  <Select
                    value={monthModal.year}
                    onValueChange={(value) =>
                      setMonthModal((current) => ({ ...current, year: value, error: null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona anno" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((yearOption) => (
                        <SelectItem key={yearOption} value={yearOption}>
                          {yearOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-600">Mese</label>
                  <Select
                    value={monthModal.month}
                    onValueChange={(value) =>
                      setMonthModal((current) => ({ ...current, month: value, error: null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona mese" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((monthOption) => (
                        <SelectItem key={monthOption.value} value={monthOption.value}>
                          {monthOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-600">Link CSV</label>
                <Input
                  ref={monthUrlInputRef}
                  value={monthModal.url}
                  onChange={(event) =>
                    setMonthModal((current) => ({
                      ...current,
                      url: event.target.value,
                      error: null
                    }))
                  }
                  placeholder="https://docs.google.com/spreadsheets/.../output=csv"
                  className="h-12"
                />
              </div>

              {monthModal.error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {monthModal.error}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" className="rounded-full" onClick={closeMonthModal}>
                  Annulla
                </Button>
                <Button className="rounded-full" onClick={handleSaveMonth}>
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
