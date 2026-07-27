"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PASSWORD_CHANGE_REQUIRED_KEY,
  PASSWORD_CHANGED_AT_KEY
} from "@/lib/auth/password-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La nuova password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          ...(userData.user?.user_metadata ?? {}),
          [PASSWORD_CHANGE_REQUIRED_KEY]: false,
          [PASSWORD_CHANGED_AT_KEY]: new Date().toISOString()
        }
      });

      if (updateError) {
        throw updateError;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error("Missing session after password update.");
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: sessionData.session.access_token,
          refreshToken: sessionData.session.refresh_token
        })
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; redirectTo?: string }
        | null;

      if (!response.ok || !body?.redirectTo) {
        throw new Error(body?.message ?? "Session sync failed.");
      }

      window.location.assign(body.redirectTo);
    } catch {
      setError("Il link non e piu valido oppure non e stato possibile aggiornare la password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[2rem] border-slate-200">
      <CardHeader className="space-y-2 pb-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Nuova password</p>
        <CardTitle className="font-display text-3xl font-semibold tracking-[-0.04em]">
          Imposta una nuova password
        </CardTitle>
        <p className="text-sm text-slate-500">
          Al primo accesso devi sostituire la password provvisoria con una personale.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nuova password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 pl-11"
                placeholder="Almeno 8 caratteri"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Conferma password</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 rounded-2xl border-slate-200"
              placeholder="Ripeti la password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Salva password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
