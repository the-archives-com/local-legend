"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import { supabase } from "../../lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  const [message, setMessage] =
    useState(
      "Checking your recovery link...",
    );

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: {
          session,
        },
      } = await supabase.auth
        .getSession();

      if (
        mounted &&
        session
      ) {
        setReady(true);
        setMessage("");
      }
    }

    checkSession();

    const {
      data: listener,
    } = supabase.auth
      .onAuthStateChange(
        (event, session) => {
          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setReady(true);
            setMessage("");
          }
        },
      );

    const timeout =
      window.setTimeout(() => {
        if (mounted) {
          setMessage(
            "This password link may have expired. Request a new one if needed.",
          );
        }
      }, 5000);

    return () => {
      mounted = false;
      window.clearTimeout(
        timeout,
      );

      listener.subscription
        .unsubscribe();
    };
  }, []);

  async function handleUpdate() {
    if (!ready) {
      setMessage(
        "Open this page using the link from your password email.",
      );
      return;
    }

    if (
      password.length < 8
    ) {
      setMessage(
        "Use at least 8 characters for your new password.",
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Those passwords do not match.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      error,
    } = await supabase.auth
      .updateUser({
        password,
      });

    if (error) {
      setMessage(
        error.message,
      );

      setLoading(false);
      return;
    }

    setMessage(
      "Password updated. Opening your field journal...",
    );

    window.setTimeout(() => {
      router.replace(
        "/record",
      );

      router.refresh();
    }, 700);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground fade-in">

      <div className="mx-auto max-w-md space-y-8">

        <header className="space-y-4 text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title text-4xl font-medium text-legend-ink sm:text-5xl">
            Choose a new password.
          </h1>

          <p className="leading-7 text-legend-muted">
            Set a password for your
            Local Legend field journal.
          </p>

        </header>

        <section className="legend-paper legend-shadow space-y-5 rounded-3xl p-8">

          <div>

            <label
              htmlFor="password"
              className="legend-label text-legend-green"
            >
              New password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              disabled={!ready}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss disabled:opacity-50"
            />

          </div>

          <div>

            <label
              htmlFor="confirm-password"
              className="legend-label text-legend-green"
            >
              Confirm password
            </label>

            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={
                confirmPassword
              }
              disabled={!ready}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleUpdate();
                }
              }}
              className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss disabled:opacity-50"
            />

          </div>

          <button
            type="button"
            onClick={
              handleUpdate
            }
            disabled={
              loading ||
              !ready
            }
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : "Set new password"}
          </button>

          {message && (
            <p className="text-center text-sm leading-6 text-legend-muted">
              {message}
            </p>
          )}

        </section>

        <div className="text-center">

          <Link
            href="/reset-password"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            Request another link
          </Link>

        </div>

      </div>

    </main>
  );
}