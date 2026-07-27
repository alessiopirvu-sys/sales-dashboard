"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const GENERIC_LOGIN_ERROR =
  "Credenziali non valide o account non disponibile. Verifica i dati e riprova.";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);

  const handleSelectAllShortcut = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.currentTarget.select();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.session) {
        throw new Error("Missing session after sign in.");
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          nextPath: nextPath ?? undefined
        })
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; redirectTo?: string }
        | null;

      if (!response.ok || !body?.redirectTo) {
        const message =
          process.env.NODE_ENV === "development" && body?.message ? body.message : GENERIC_LOGIN_ERROR;
        throw new Error(message);
      }

      window.location.assign(body.redirectTo);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : GENERIC_LOGIN_ERROR;
      setError(message || GENERIC_LOGIN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[2rem] border-slate-200">
      <CardHeader className="space-y-2 pb-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Accesso</p>
        <CardTitle className="font-display text-3xl font-semibold tracking-[-0.04em]">
          Entra nella piattaforma
        </CardTitle>
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={handleSelectAllShortcut}
                className="h-12 rounded-2xl border-slate-200 pl-11"
                placeholder="nome@azienda.it"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={handleSelectAllShortcut}
                className="h-12 rounded-2xl border-slate-200 pl-11"
                placeholder="Inserisci la password"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Accedi"}
          </Button>

          <div className="text-center text-sm text-slate-500">
            <a href="/reset-password" className="font-medium text-primary hover:underline">
              Password dimenticata?
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
