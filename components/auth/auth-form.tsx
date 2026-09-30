"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl bg-surface-container-low p-space-lg text-body-md">
        Authentication requires <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Add them to <code>.env.local</code> then restart the
        dev server. Eligibility matching still works without login.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        });
        if (resetError) throw resetError;
        setMessage("If that account exists, a reset email has been sent.");
        return;
      }
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({ email, password });
        if (signError) throw signError;
        setMessage("Check your email to confirm the account, then sign in.");
        return;
      }
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <h1 className="font-headline-xl text-primary">
        {mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Reset password"}
      </h1>
      <div>
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode !== "forgot" ? (
        <div>
          <Label>Password</Label>
          <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      ) : null}
      {error ? <p className="text-body-sm text-error">{error}</p> : null}
      {message ? <p className="text-body-sm text-secondary">{message}</p> : null}
      <Button type="submit" className="w-full">
        {mode === "login" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}
      </Button>
      <div className="space-y-1 text-body-sm">
        {mode !== "login" ? <Link href="/login" className="block text-primary">Back to login</Link> : null}
        {mode === "login" ? (
          <>
            <Link href="/signup" className="block text-primary">Create an account</Link>
            <Link href="/forgot-password" className="block text-primary">Forgot password</Link>
          </>
        ) : null}
      </div>
    </form>
  );
}
