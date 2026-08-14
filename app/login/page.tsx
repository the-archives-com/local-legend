"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/record");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground fade-in">
      <div className="mx-auto max-w-md space-y-8">
        <header className="space-y-4 text-center">
          <p className="legend-label text-legend-earth">Local Legend</p>
          <h1 className="legend-title text-4xl font-medium text-legend-ink sm:text-5xl">
            Return to your field journal.
          </h1>
          <p className="leading-7 text-legend-muted">
            Sign in to record the things you want to remember.
          </p>
        </header>

        <section className="legend-paper legend-shadow space-y-5 rounded-3xl p-8">
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleLogin();
                }
              }}
              className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Opening..." : "Open My Field Journal"}
          </button>

          {message && (
            <p role="status" className="text-center text-sm leading-6 text-legend-muted">
              {message}
            </p>
          )}

          <div className="space-y-3 text-center">
            <Link
              href="/reset-password"
              className="block text-sm text-legend-muted transition-colors hover:text-legend-green"
            >
              Forgotten your password?
            </Link>

            <Link
              href="/register"
              className="block text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
            >
              New to Local Legend? Create an account
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
