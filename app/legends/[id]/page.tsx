"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import { supabase } from "../../../lib/supabase";

type Legend = {
  id: number;
  created_at: string;
  title: string;
  reflection: string | null;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
};

export default function LegendPage() {
  const params =
    useParams<{ id: string }>();

  const [legend, setLegend] =
    useState<Legend | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadLegend() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("legends")
        .select(
          "id, created_at, title, reflection, image_url, latitude, longitude, location_label",
        )
        .eq(
          "id",
          params.id,
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Could not load Legend:",
          error,
        );

        setErrorMessage(
          "This Legend could not be opened.",
        );

        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage(
          "This Legend could not be found.",
        );

        setLoading(false);
        return;
      }

      setLegend(data);
      setLoading(false);
    }

    loadLegend();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">

        <p className="text-center italic text-legend-muted">
          Opening this Legend...
        </p>

      </main>
    );
  }

  if (
    errorMessage ||
    !legend
  ) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">

        <div className="mx-auto max-w-lg text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title mt-4 text-4xl text-legend-ink">
            Nothing here yet.
          </h1>

          <p className="mt-4 text-sm text-legend-muted">
            {errorMessage}
          </p>

          <Link
            href="/"
            className="mt-7 inline-block text-sm text-legend-green"
          >
            ← Back to Local Legend
          </Link>

        </div>

      </main>
    );
  }

  const hasLocation =
    legend.latitude !== null &&
    legend.longitude !== null;

  const mapDelta = 0.004;

  const mapUrl =
    hasLocation
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${
          legend.longitude! -
          mapDelta
        }%2C${
          legend.latitude! -
          mapDelta
        }%2C${
          legend.longitude! +
          mapDelta
        }%2C${
          legend.latitude! +
          mapDelta
        }&layer=mapnik&marker=${
          legend.latitude
        }%2C${
          legend.longitude
        }`
      : "";

  const fullMapUrl =
    hasLocation
      ? `https://www.openstreetmap.org/?mlat=${legend.latitude}&mlon=${legend.longitude}#map=17/${legend.latitude}/${legend.longitude}`
      : "";

  const recordedDate =
    new Date(
      legend.created_at,
    ).toLocaleDateString(
      "en-AU",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-5xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <Link
            href="/"
            className="text-sm font-medium text-legend-ink transition-colors hover:text-legend-green"
          >
            Local Legend
          </Link>

          <p className="legend-label text-legend-muted">
            Legend{" "}
            {String(
              legend.id,
            ).padStart(
              5,
              "0",
            )}
          </p>

        </div>

        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-12 text-center">

          <p className="legend-label text-legend-earth">
            A Local Legend
          </p>

          <h1 className="legend-title mt-4 text-5xl font-medium text-legend-ink sm:text-6xl">
            {legend.title}
          </h1>

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">

            <span className="h-px w-14 bg-legend-border" />

            <span className="text-sm text-legend-green">
              ◆
            </span>

            <span className="h-px w-14 bg-legend-border" />

          </div>

          <p className="mt-5 text-sm text-legend-muted">
            {recordedDate}
          </p>

        </header>

        {/* PHOTO */}

        <section className="mx-auto max-w-4xl">

          <article className="legend-paper legend-shadow overflow-hidden rounded-3xl">

            <div className="bg-legend-paper">

              <img
                src={legend.image_url}
                alt={legend.title}
                className="h-auto w-full"
              />

            </div>

            <div className="border-t border-legend-border px-6 py-5">

              <p className="legend-label text-legend-muted">
                The Moment
              </p>

            </div>

          </article>

          {/* SMALL LOCATION MAP */}

          {hasLocation && (
            <div className="mt-6 flex justify-end">

              <article className="w-full overflow-hidden rounded-2xl border border-legend-border bg-legend-surface sm:w-1/2 lg:w-1/3">

                <div className="aspect-[4/3] bg-legend-paper">

                  <iframe
                    src={mapUrl}
                    title={`Map location for ${legend.title}`}
                    className="h-full w-full border-0"
                    loading="lazy"
                  />

                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">

                  <div>

                    <p className="legend-label text-legend-muted">
                      The Place
                    </p>

                    {legend.location_label && (
                      <p className="mt-2 text-sm text-legend-ink">
                        {
                          legend.location_label
                        }
                      </p>
                    )}

                  </div>

                  <a
                    href={fullMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-sm text-legend-green transition-colors hover:text-legend-earth"
                  >
                    Open map →
                  </a>

                </div>

              </article>

            </div>
          )}

        </section>

        {/* REFLECTION */}

        {legend.reflection && (
          <section className="mx-auto mt-10 max-w-2xl">

            <div className="rounded-3xl border border-legend-border bg-legend-surface px-8 py-9 text-center">

              <p className="legend-label text-legend-earth">
                Reflection
              </p>

              <p className="legend-title mt-5 text-2xl leading-9 text-legend-ink">
                {legend.reflection}
              </p>

            </div>

          </section>
        )}

        {/* QUIET NOTE */}

        <section className="mx-auto mt-10 max-w-xl text-center">

          <p className="text-sm italic leading-7 text-legend-muted">
            A moment, a place, and something
            worth remembering.
          </p>

        </section>

        {/* NAVIGATION */}

        <div className="mt-12 flex justify-center">

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