"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const GENERIC_RESET_MESSAGE =
  "Se l'account esiste e puo ricevere il reset, abbiamo inviato le istruzioni via email alla casella indicata.";

export function ResetPasswordRequestForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok && response.status !== 200) {
        throw new Error("Richiesta non completata.");
      }

      setMessage(GENERIC_RESET_MESSAGE);
    } catch {
      setError("Non e stato possibile completare la richiesta. Riprova tra poco.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[2rem] border-slate-200">
      <CardHeader className="space-y-2 pb-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Recupero accesso</p>
        <CardTitle className="font-display text-3xl font-semibold tracking-[-0.04em]">
          Reimposta la password
        </CardTitle>
        <p className="text-sm text-slate-500">
          Il recupero password avviene sempre tramite email.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 pl-11"
                placeholder="nome@azienda.it"
                required
              />
            </div>
          </div>

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

          <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Invia istruzioni"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
