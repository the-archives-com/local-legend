"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

type Legend = {
  id: number;
  created_at: string;
  title: string;
  reflection: string | null;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
};

export default function HomePage() {
  const [latestLegend, setLatestLegend] =
    useState<Legend | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [signedIn, setSignedIn] =
    useState(false);

  /*
   * LOAD LATEST LEGEND
   */

  useEffect(() => {
    async function loadLatestLegend() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("legends")
        .select(
          "id, created_at, title, reflection, image_url, latitude, longitude",
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Could not load latest Legend:",
          error,
        );

        setErrorMessage(
          "The latest Legend could not be opened.",
        );

        setLoading(false);
        return;
      }

      setLatestLegend(
        data ?? null,
      );

      setLoading(false);
    }

    loadLatestLegend();
  }, []);

  /*
   * AUTH STATE
   */

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedIn(
        Boolean(user),
      );
    }

    checkAuth();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSignedIn(
          Boolean(session?.user),
        );
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
  }

  const recordedDate =
    latestLegend
      ? new Date(
          latestLegend.created_at,
        ).toLocaleDateString(
          "en-AU",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )
      : "";

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-4xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <p className="text-sm font-medium text-legend-ink">
            Local Legend
          </p>

          <p className="legend-label text-legend-muted">
            Field Journal
          </p>

        </div>

        {/* INTRO */}

        <header className="mx-auto max-w-2xl py-14 text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title mt-5 text-5xl font-medium tracking-tight text-legend-ink sm:text-6xl">
            Mindful exploration.
          </h1>

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">

            <span className="h-px w-14 bg-legend-border" />

            <span className="text-sm text-legend-green">
              ◆
            </span>

            <span className="h-px w-14 bg-legend-border" />

          </div>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            Notice what is worth remembering.
          </p>

        </header>

        {/* PRIMARY ACTION */}

        <div className="mx-auto flex max-w-md justify-center">

          <Link
            href="/record"
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Record a Legend
          </Link>

        </div>

        {/* LATEST LEGEND */}

        <section className="mt-16">

          <div className="mb-6 flex items-end justify-between gap-6 border-b border-legend-border pb-4">

            <div>

              <p className="legend-label text-legend-green">
                Latest Legend
              </p>

              <h2 className="legend-title mt-2 text-3xl text-legend-ink">
                Something worth keeping.
              </h2>

            </div>

            <p className="hidden text-xs uppercase tracking-[0.14em] text-legend-muted sm:block">
              Look closely
            </p>

          </div>

          {loading && (
            <div className="rounded-3xl border border-legend-border bg-legend-surface p-10 text-center">

              <p className="text-sm italic text-legend-muted">
                Finding the latest Legend...
              </p>

            </div>
          )}

          {!loading &&
            errorMessage && (
              <div className="rounded-3xl border border-legend-border bg-legend-surface p-8 text-center">

                <p className="text-sm text-legend-muted">
                  {errorMessage}
                </p>

              </div>
            )}

          {!loading &&
            !errorMessage &&
            !latestLegend && (
              <div className="rounded-3xl border border-dashed border-legend-border bg-legend-surface/70 p-10 text-center">

                <p className="legend-title text-2xl text-legend-ink">
                  The first Legend is still out there.
                </p>

                <p className="mt-3 text-sm leading-7 text-legend-muted">
                  Go for a walk. Notice something.
                </p>

                <Link
                  href="/record"
                  className="mt-6 inline-block text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
                >
                  Record the first Legend →
                </Link>

              </div>
            )}

          {latestLegend && (
            <Link
              href={`/legends/${latestLegend.id}`}
              className="group block"
            >

              <article className="legend-paper legend-shadow overflow-hidden rounded-3xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">

                {/* IMAGE */}

                <div className="overflow-hidden bg-legend-paper">

                  <img
                    src={
                      latestLegend.image_url
                    }
                    alt={
                      latestLegend.title
                    }
                    className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.01]"
                  />

                </div>

                {/* CAPTION */}

                <div className="border-t border-legend-border px-7 py-6 sm:px-8">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                      <p className="legend-label text-legend-earth">
                        Legend{" "}
                        {String(
                          latestLegend.id,
                        ).padStart(
                          5,
                          "0",
                        )}
                      </p>

                      <h3 className="legend-title mt-2 text-3xl text-legend-ink">
                        {
                          latestLegend.title
                        }
                      </h3>

                      <p className="mt-2 text-xs text-legend-muted">
                        {recordedDate}
                      </p>

                    </div>

                    <span className="text-sm text-legend-green transition-transform duration-300 group-hover:translate-x-1">
                      View Legend →
                    </span>

                  </div>

                  {latestLegend.reflection && (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-legend-muted">
                      {
                        latestLegend.reflection
                      }
                    </p>
                  )}

                </div>

              </article>

            </Link>
          )}

        </section>

        {/* EXPLORE BY PLACE */}

        <section className="mx-auto mt-10 max-w-xl text-center">

          <p className="legend-label text-legend-moss">
            Explore by Place
          </p>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-legend-muted">
            Wander the map and see what was noticed there.
          </p>

          <Link
            href="/map"
            className="mt-5 inline-flex items-center justify-center text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
          >
            Open the map →
          </Link>

        </section>

        {/* BAILEY'S CHALLENGE */}

        <section className="mx-auto mt-12 max-w-2xl">

          <div className="rounded-3xl border border-dashed border-legend-border bg-legend-surface/70 px-8 py-8 text-center">

            <p className="legend-label text-legend-earth">
              Bailey&apos;s Challenge
            </p>

            <h2 className="legend-title mt-3 text-2xl text-legend-ink">
              Something to look for while you&apos;re out.
            </h2>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-legend-green">

              <span>
                Green
              </span>

              <span className="text-legend-border">
                ·
              </span>

              <span>
                Round
              </span>

              <span className="text-legend-border">
                ·
              </span>

              <span>
                Checkers
              </span>

            </div>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-legend-muted">
              Three prompts. Three photographs.
              See what catches your eye.
            </p>

            <Link
              href="/challenge"
              className="mt-6 inline-flex items-center justify-center text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
            >
              Take the challenge →
            </Link>

          </div>

        </section>

        {/* RECORD AGAIN */}

        <section className="mx-auto mt-14 max-w-xl text-center">

          <p className="legend-label text-legend-moss">
            Found something?
          </p>

          <h2 className="legend-title mt-3 text-2xl text-legend-ink">
            Leave something for your future self.
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-legend-muted">
            A photograph, a place, and the thing
            you want to remember about it.
          </p>

          <Link
            href="/record"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-legend-border bg-legend-surface px-8 py-3 text-sm text-legend-ink transition-all hover:border-legend-moss hover:bg-legend-paper active:scale-[0.98]"
          >
            Record another Legend
          </Link>

        </section>

        {/* FOOTER */}

        <footer className="mt-16 border-t border-legend-border pt-8 text-center">

          <p className="text-xs italic text-legend-muted">
            Walk first. Technology serves observation.
          </p>

          <p className="mt-5 text-xs text-legend-muted">
            Built with care by{" "}
            <strong className="font-medium text-legend-ink">
              Studio Nebari
            </strong>
          </p>

          <div className="mt-5">

            {signedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-legend-muted transition-colors hover:text-legend-green"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-xs text-legend-muted transition-colors hover:text-legend-green"
              >
                Sign in
              </Link>
            )}

          </div>

        </footer>

      </div>

    </main>
  );
}