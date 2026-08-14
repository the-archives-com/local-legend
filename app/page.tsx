"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
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

type WeeklyChallenge = {
  out_week_start: string;
  prompt_1_id: number;
  prompt_1_word: string;
  prompt_2_id: number;
  prompt_2_word: string;
  prompt_3_id: number;
  prompt_3_word: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type DiscoveryLegend = Legend & {
  distanceKm: number | null;
};

/*
 * Straight-line distance between two coordinates.
 *
 * This is deliberately labelled "away" rather than
 * "walking distance", because we are not yet using
 * pedestrian routing.
 */
function distanceBetween(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const latitudeDifference =
    toRadians(latitude2 - latitude1);

  const longitudeDifference =
    toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return earthRadiusKm * c;
}

export default function HomePage() {
  const [legends, setLegends] =
    useState<Legend[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [signedIn, setSignedIn] =
    useState(false);

  const [challengeWords, setChallengeWords] =
    useState<string[]>([]);

  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);

  const [locationResolved, setLocationResolved] =
    useState(false);

  /*
   * LOAD RECENT LEGENDS
   *
   * We load a modest pool rather than the entire
   * archive. From this we can select nearby Legends
   * when location is available, or simply show the
   * newest ten when it is not.
   */

  useEffect(() => {
    async function loadLegends() {
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
        .limit(100);

      if (error) {
        console.error(
          "Could not load Legends:",
          error,
        );

        setErrorMessage(
          "The nearby Legends could not be opened.",
        );

        setLoading(false);
        return;
      }

      setLegends(
        data ?? [],
      );

      setLoading(false);
    }

    loadLegends();
  }, []);

  /*
   * FIND CURRENT LOCATION
   *
   * If location is unavailable or declined, nothing
   * breaks. Local Legend simply falls back to the
   * ten newest photographs.
   */

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      setLocationResolved(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        });

        setLocationResolved(true);
      },

      () => {
        setUserLocation(null);
        setLocationResolved(true);
      },

      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 300000,
      },
    );
  }, []);

  /*
   * BUILD THE DISCOVERY RAIL
   *
   * With location:
   *   up to 2 around 1 km
   *   up to 2 around 2 km
   *   up to 2 around 3 km
   *   up to 2 around 4 km
   *   up to 2 around 5 km
   *
   * Without location:
   *   newest 10 Legends.
   */

  const discoveryLegends =
    useMemo<DiscoveryLegend[]>(() => {
      if (!userLocation) {
        return legends
          .slice(0, 10)
          .map((legend) => ({
            ...legend,
            distanceKm: null,
          }));
      }

      const withDistance =
        legends
          .filter(
            (
              legend,
            ): legend is Legend & {
              latitude: number;
              longitude: number;
            } =>
              legend.latitude !== null &&
              legend.longitude !== null,
          )
          .map((legend) => ({
            ...legend,
            distanceKm:
              distanceBetween(
                userLocation.latitude,
                userLocation.longitude,
                legend.latitude,
                legend.longitude,
              ),
          }));

      const selected:
        DiscoveryLegend[] = [];

      const selectedIds =
        new Set<number>();

      /*
       * Each kilometre band represents roughly
       * that walking radius:
       *
       * 1 km = 0–1.5
       * 2 km = 1.5–2.5
       * etc.
       */

      for (
        let kilometre = 1;
        kilometre <= 5;
        kilometre += 1
      ) {
        const minimum =
          kilometre === 1
            ? 0
            : kilometre - 0.5;

        const maximum =
          kilometre + 0.5;

        const candidates =
          withDistance
            .filter(
              (legend) =>
                legend.distanceKm >=
                  minimum &&
                legend.distanceKm <
                  maximum &&
                !selectedIds.has(
                  legend.id,
                ),
            )
            .sort(
              (a, b) =>
                Math.abs(
                  a.distanceKm -
                    kilometre,
                ) -
                Math.abs(
                  b.distanceKm -
                    kilometre,
                ),
            )
            .slice(0, 2);

        for (const legend of candidates) {
          selected.push(legend);
          selectedIds.add(
            legend.id,
          );
        }
      }

      /*
       * Early on, LL may not yet have two photographs
       * in every distance band.
       *
       * Fill any empty places with the closest
       * remaining Legends within about 5.5 km.
       */

      if (selected.length < 10) {
        const remaining =
          withDistance
            .filter(
              (legend) =>
                legend.distanceKm <
                  5.5 &&
                !selectedIds.has(
                  legend.id,
                ),
            )
            .sort(
              (a, b) =>
                a.distanceKm -
                b.distanceKm,
            );

        for (const legend of remaining) {
          if (selected.length >= 10) {
            break;
          }

          selected.push(legend);
          selectedIds.add(
            legend.id,
          );
        }
      }

      /*
       * If there are very few geotagged Legends nearby,
       * keep the rail useful by filling the remaining
       * spaces with recent photographs.
       */

      if (selected.length < 10) {
        for (const legend of legends) {
          if (selected.length >= 10) {
            break;
          }

          if (
            selectedIds.has(
              legend.id,
            )
          ) {
            continue;
          }

          selected.push({
            ...legend,
            distanceKm:
              legend.latitude !== null &&
              legend.longitude !== null
                ? distanceBetween(
                    userLocation.latitude,
                    userLocation.longitude,
                    legend.latitude,
                    legend.longitude,
                  )
                : null,
          });

          selectedIds.add(
            legend.id,
          );
        }
      }

      return selected.slice(0, 10);
    }, [
      legends,
      userLocation,
    ]);

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

  /*
   * LOAD THIS WEEK'S BAILEY CHALLENGE
   */

  useEffect(() => {
    async function loadChallenge() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChallengeWords([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_or_create_current_challenge",
      );

      if (
        error ||
        !data ||
        data.length === 0
      ) {
        console.error(
          "Could not load Bailey's Challenge:",
          error,
        );

        return;
      }

      const challenge =
        data[0] as WeeklyChallenge;

      setChallengeWords([
        challenge.prompt_1_word,
        challenge.prompt_2_word,
        challenge.prompt_3_word,
      ]);
    }

    loadChallenge();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
    setChallengeWords([]);
  }

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

        {/* DISCOVER NEARBY */}

        <section className="mt-16">

          <div className="mb-6 flex items-end justify-between gap-6 border-b border-legend-border pb-4">

            <div>

              <p className="legend-label text-legend-green">
                Nearby Legends
              </p>

              <h2 className="legend-title mt-2 text-3xl text-legend-ink">
                How far do you feel like walking?
              </h2>

            </div>

            <p className="hidden text-xs uppercase tracking-[0.14em] text-legend-muted sm:block">
              Swipe to wander
            </p>

          </div>

          {loading && (
            <div className="rounded-3xl border border-legend-border bg-legend-surface p-10 text-center">

              <p className="text-sm italic text-legend-muted">
                Finding nearby Legends...
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
            discoveryLegends.length ===
              0 && (
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

          {!loading &&
            !errorMessage &&
            discoveryLegends.length >
              0 && (
              <>
                <div
                  className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Nearby Legends"
                >
                  {discoveryLegends.map(
                    (
                      legend,
                      index,
                    ) => {
                      const recordedDate =
                        new Date(
                          legend.created_at,
                        ).toLocaleDateString(
                          "en-AU",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        );

                      return (
                        <Link
                          key={
                            legend.id
                          }
                          href={`/legends/${legend.id}`}
                          className="group w-[88%] shrink-0 snap-center sm:w-[72%]"
                        >
                          <article className="legend-paper legend-shadow h-full overflow-hidden rounded-3xl transition-all duration-500 group-hover:-translate-y-1">

                            <div className="aspect-[4/3] overflow-hidden bg-legend-paper">

                              <img
                                src={
                                  legend.image_url
                                }
                                alt={
                                  legend.title
                                }
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                              />

                            </div>

                            <div className="border-t border-legend-border px-6 py-5">

                              <div className="flex items-start justify-between gap-5">

                                <div>

                                  {legend.distanceKm !==
                                    null && (
                                    <p className="legend-label text-legend-green">
                                      ≈{" "}
                                      {legend.distanceKm <
                                      1
                                        ? legend.distanceKm.toFixed(
                                            1,
                                          )
                                        : Math.round(
                                            legend.distanceKm,
                                          )}{" "}
                                      km away
                                    </p>
                                  )}

                                  {legend.distanceKm ===
                                    null && (
                                    <p className="legend-label text-legend-earth">
                                      Recent Legend
                                    </p>
                                  )}

                                  <h3 className="legend-title mt-2 text-2xl text-legend-ink">
                                    {
                                      legend.title
                                    }
                                  </h3>

                                  <p className="mt-2 text-xs text-legend-muted">
                                    {
                                      recordedDate
                                    }
                                  </p>

                                </div>

                                <span className="shrink-0 text-xs text-legend-muted">
                                  {index +
                                    1}{" "}
                                  /{" "}
                                  {
                                    discoveryLegends.length
                                  }
                                </span>

                              </div>

                              <p className="mt-5 text-sm text-legend-green">
                                View Legend →
                              </p>

                            </div>

                          </article>
                        </Link>
                      );
                    },
                  )}

                  {/* Quiet space after the final card */}

                  <div
                    className="w-2 shrink-0"
                    aria-hidden="true"
                  />

                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-legend-muted">

                  <p>
                    {userLocation
                      ? "Distances are approximate."
                      : locationResolved
                        ? "Showing the newest Legends."
                        : "Finding your place..."}
                  </p>

                  <p>
                    {discoveryLegends.length}{" "}
                    moments
                  </p>

                </div>
              </>
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

            {challengeWords.length === 3 ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-legend-green">

                {challengeWords.map(
                  (
                    word,
                    index,
                  ) => (
                    <div
                      key={word}
                      className="flex items-center gap-4"
                    >

                      <span className="capitalize">
                        {word}
                      </span>

                      {index <
                        challengeWords.length -
                          1 && (
                        <span className="text-legend-border">
                          ·
                        </span>
                      )}

                    </div>
                  ),
                )}

              </div>
            ) : (
              <p className="mt-6 text-sm italic text-legend-muted">
                This week&apos;s finds are waiting.
              </p>
            )}

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