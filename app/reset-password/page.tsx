"use client";

import Link from "next/link";
import { useState } from "react";

import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleReset() {
    if (!email.trim()) {
      setMessage(
        "Enter your email address.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      error,
    } = await supabase.auth
      .resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/update-password`,
        },
      );

    if (error) {
      setMessage(
        error.message,
      );

      setLoading(false);
      return;
    }

    setMessage(
      "Check your email. We’ve sent you a link to choose a new password.",
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground fade-in">

      <div className="mx-auto max-w-md space-y-8">

        <header className="space-y-4 text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title text-4xl font-medium text-legend-ink sm:text-5xl">
            Find your way back.
          </h1>

          <p className="leading-7 text-legend-muted">
            Enter the email attached to your
            field journal and we&apos;ll send you
            a password reset link.
          </p>

        </header>

        <section className="legend-paper legend-shadow space-y-5 rounded-3xl p-8">

          <div>

            <label
              htmlFor="email"
              className="legend-label text-legend-green"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleReset();
                }
              }}
              className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
            />

          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? "Sending..."
              : "Send password link"}
          </button>

          {message && (
            <p className="text-center text-sm leading-6 text-legend-muted">
              {message}
            </p>
          )}

        </section>

        <div className="text-center">

          <Link
            href="/login"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            ← Back to sign in
          </Link>

        </div>

      </div>

    </main>
  );
}