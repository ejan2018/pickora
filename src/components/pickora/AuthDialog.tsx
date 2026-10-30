"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { loginAccount, registerAccount } from "@/lib/api";
import type { PublicUser } from "@/lib/types";

export function AuthDialog({
  open,
  onOpenChange,
  onAuthed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthed?: (user: PublicUser) => void;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setBusy(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (username.trim().length < 3) {
      setError("Username needs at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const user =
        mode === "signup"
          ? await registerAccount(username.trim(), password, displayName.trim())
          : await loginAccount(username.trim(), password);
      onAuthed?.(user);
      onOpenChange(false);
      setUsername("");
      setDisplayName("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm rounded-2xl border-border bg-card p-0 [&>button]:hidden"
        showCloseButton={false}
      >
        <div className="relative p-6">
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <p className="eyebrow text-primary">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
          <DialogTitle className="mt-2 font-display text-lg font-bold leading-snug">
            {mode === "signup" ? "Sign up to unlock links instantly" : "Sign in to your account"}
          </DialogTitle>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {mode === "signup"
              ? "One account keeps your favorites, cart and links in sync."
              : "Your favorites and cart are waiting for you."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="auth-username" className="eyebrow mb-1.5 block text-muted-foreground">
                Username
              </label>
              <input
                id="auth-username"
                required
                minLength={3}
                maxLength={16}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
                placeholder="e.g. smart_shopper"
              />
            </div>
            {mode === "signup" && (
              <div>
                <label htmlFor="auth-display" className="eyebrow mb-1.5 block text-muted-foreground">
                  Display name <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="auth-display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="How should we greet you?"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password" className="eyebrow mb-1.5 block text-muted-foreground">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                maxLength={100}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
          </p>

          <p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Closing this with the ✕ still shows the item and its link — signing up just
            keeps everything saved.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
