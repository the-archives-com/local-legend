"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleRegister() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password || !confirmPassword) {
      setMessage("Enter your email and password twice.");
      return;
    }

    if (password.length < 8) {
      setMessage("Choose a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/record");
      router.refresh();
      return;
    }

    setRegistered(true);
    setMessage(
      "Check your email and confirm your address. You can then return here and sign in.",
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
            Begin your field journal.
          </h1>

          <p className="leading-7 text-legend-muted">
            Create an account to record the things you want to remember.
          </p>
        </header>

        <section className="legend-paper legend-shadow space-y-5 rounded-3xl p-8">
          {!registered && (
            <>
              <div>
                <label htmlFor="email" className="legend-label text-legend-green">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
                />
              </div>

              <div>
                <label htmlFor="password" className="legend-label text-legend-green">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
                />
                <p className="mt-2 text-xs text-legend-muted">
                  At least 8 characters.
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="legend-label text-legend-green">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleRegister();
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
                />
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create My Account"}
              </button>
            </>
          )}

          {message && (
            <p role="status" className="text-center text-sm leading-6 text-legend-muted">
              {message}
            </p>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-legend-muted transition-colors hover:text-legend-green"
            >
              {registered ? "Continue to sign in →" : "Already have an account? Sign in"}
            </Link>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            ← Back to Local Legend
          </Link>
        </div>
      </div>
    </main>
  );
}
