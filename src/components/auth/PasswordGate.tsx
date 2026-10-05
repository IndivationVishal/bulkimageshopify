"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Hexagon, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { APP_NAME } from "@/lib/constants/app";
import { sha256 } from "@/lib/utils/sha256";

/** sha256(SALT + password). The password itself is never stored in the code. */
const SALT = "sbs-gate-v1:";
const PASSWORD_HASH = "f34608da630da37d6d4f7a791336d8d5e3bb26ea327617e916643e842604f74a";
/** Per tab: closing the tab or browser asks for the password again. */
const SESSION_KEY = "sbs-gate";
const EVENT = "sbs-gate-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === PASSWORD_HASH;
  } catch {
    return false;
  }
}

/** Nothing of the app renders until the right password is entered. */
export function PasswordGate({ children }: { children: ReactNode }) {
  // null on the server / first paint, so neither the app nor the form flashes.
  const unlocked = useSyncExternalStore(subscribe, isUnlocked, () => null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;
  if (unlocked === null) return <div className="min-h-dvh bg-bg" />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sha256(SALT + password) !== PASSWORD_HASH) {
      setError(true);
      setPassword("");
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, PASSWORD_HASH);
    } catch {
      /* storage blocked: stays unlocked until reload */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Hexagon className="size-8 fill-accent-soft text-accent" aria-hidden />
          <h1 className="text-base font-semibold">{APP_NAME}</h1>
          <p className="text-sm text-muted">Enter the password to continue.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gate-password" className="text-xs font-medium text-muted">
            Password
          </label>
          <div className="relative">
            <Input
              id="gate-password"
              type={show ? "text" : "password"}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              aria-invalid={error}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-subtle hover:text-text"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-danger">Incorrect password. Please try again.</p>}
        </div>

        <Button type="submit" size="lg" className="justify-center" disabled={!password}>
          <Lock className="size-4" /> Unlock
        </Button>
      </form>
    </div>
  );
}
