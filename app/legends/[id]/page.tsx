"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";

type Legend = {
  id: number;
  user_id: string;
  created_at: string;
  title: string;
  reflection: string | null;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
};

export default function LegendPage() {
  const params = useParams<{ id: string }>();

  const [legend, setLegend] = useState<Legend | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const [editingPlace, setEditingPlace] = useState(false);
  const [placeDraft, setPlaceDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    async function loadLegend() {
      setLoading(true);
      setErrorMessage("");

      const [legendResult, userResult] = await Promise.all([
        supabase
          .from("legends")
          .select(
            "id, user_id, created_at, title, reflection, image_url, latitude, longitude, location_label",
          )
          .eq("id", params.id)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);

      if (legendResult.error) {
        console.error("Could not load Legend:", legendResult.error);
        setErrorMessage("This Legend could not be opened.");
        setLoading(false);
        return;
      }

      if (!legendResult.data) {
        setErrorMessage("This Legend could not be found.");
        setLoading(false);
        return;
      }

      const loadedLegend = legendResult.data as Legend;
      const user = userResult.data.user;

      setLegend(loadedLegend);
      setTitleDraft(loadedLegend.title);
      setPlaceDraft(loadedLegend.location_label ?? "");
      setIsOwner(Boolean(user && user.id === loadedLegend.user_id));
      setLoading(false);
    }

    loadLegend();
  }, [params.id]);

  async function saveTitle() {
    if (!legend) {
      return;
    }

    const cleanTitle = titleDraft.trim();

    if (!cleanTitle) {
      setEditMessage("Give this Legend a title before saving.");
      return;
    }

    if (cleanTitle.length > 120) {
      setEditMessage("Keep the title to 120 characters or fewer.");
      return;
    }

    setSaving(true);
    setEditMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEditMessage("Sign in again before editing this Legend.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("legends")
      .update({ title: cleanTitle })
      .eq("id", legend.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Could not update Legend title:", error);
      setEditMessage("The title could not be saved. Please try again.");
      setSaving(false);
      return;
    }

    setLegend({ ...legend, title: cleanTitle });
    setEditingTitle(false);
    setEditMessage("Title saved.");
    setSaving(false);
  }

  async function savePlace() {
    if (!legend) {
      return;
    }

    const cleanPlace = placeDraft.trim();

    if (cleanPlace.length > 120) {
      setEditMessage("Keep the place name to 120 characters or fewer.");
      return;
    }

    setSaving(true);
    setEditMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEditMessage("Sign in again before editing this Legend.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("legends")
      .update({ location_label: cleanPlace || null })
      .eq("id", legend.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Could not update Legend place:", error);
      setEditMessage("The place could not be saved. Please try again.");
      setSaving(false);
      return;
    }

    setLegend({
      ...legend,
      location_label: cleanPlace || null,
    });
    setEditingPlace(false);
    setEditMessage(cleanPlace ? "Place saved." : "Place removed.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <p className="text-center italic text-legend-muted">
          Opening this Legend...
        </p>
      </main>
    );
  }

  if (errorMessage || !legend) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-lg text-center">
          <p className="legend-label text-legend-earth">Local Legend</p>
          <h1 className="legend-title mt-4 text-4xl text-legend-ink">
            Nothing here yet.
          </h1>
          <p className="mt-4 text-sm text-legend-muted">{errorMessage}</p>
          <Link href="/" className="mt-7 inline-block text-sm text-legend-green">
            ← Back to Local Legend
          </Link>
        </div>
      </main>
    );
  }

  const hasLocation =
    legend.latitude !== null && legend.longitude !== null;
  const mapDelta = 0.004;
  const mapUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        legend.longitude! - mapDelta
      }%2C${legend.latitude! - mapDelta}%2C${
        legend.longitude! + mapDelta
      }%2C${legend.latitude! + mapDelta}&layer=mapnik&marker=${
        legend.latitude
      }%2C${legend.longitude}`
    : "";
  const fullMapUrl = hasLocation
    ? `https://www.openstreetmap.org/?mlat=${legend.latitude}&mlon=${legend.longitude}#map=17/${legend.latitude}/${legend.longitude}`
    : "";
  const recordedDate = new Date(legend.created_at).toLocaleDateString(
    "en-AU",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between border-b border-legend-border pb-5">
          <Link
            href="/"
            className="text-sm font-medium text-legend-ink transition-colors hover:text-legend-green"
          >
            Local Legend
          </Link>
          <p className="legend-label text-legend-muted">
            Legend {String(legend.id).padStart(5, "0")}
          </p>
        </div>

        <header className="mx-auto max-w-2xl py-12 text-center">
          <p className="legend-label text-legend-earth">A Local Legend</p>

          {editingTitle ? (
            <div className="mx-auto mt-5 max-w-xl">
              <label htmlFor="legend-title" className="legend-label text-legend-muted">
                Title
              </label>
              <input
                id="legend-title"
                type="text"
                maxLength={120}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    saveTitle();
                  }
                }}
                className="mt-3 w-full rounded-2xl border border-legend-border bg-legend-surface px-5 py-4 text-center text-xl text-legend-ink outline-none focus:border-legend-moss"
                autoFocus
              />
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={saveTitle}
                  disabled={saving}
                  className="rounded-full bg-legend-green px-6 py-2.5 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save title"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(legend.title);
                    setEditingTitle(false);
                    setEditMessage("");
                  }}
                  disabled={saving}
                  className="rounded-full border border-legend-border px-6 py-2.5 text-sm text-legend-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="legend-title mt-4 text-5xl font-medium text-legend-ink sm:text-6xl">
                {legend.title}
              </h1>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTitle(true);
                    setEditMessage("");
                  }}
                  className="mt-4 text-sm text-legend-green transition-colors hover:text-legend-earth"
                >
                  Edit title
                </button>
              )}
            </>
          )}

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-14 bg-legend-border" />
            <span className="text-sm text-legend-green">◆</span>
            <span className="h-px w-14 bg-legend-border" />
          </div>
          <p className="mt-5 text-sm text-legend-muted">{recordedDate}</p>
        </header>

        <section className="mx-auto max-w-4xl">
          <article className="legend-paper legend-shadow overflow-hidden rounded-3xl">
            <div className="bg-legend-paper">
              <img src={legend.image_url} alt={legend.title} className="h-auto w-full" />
            </div>
            <div className="border-t border-legend-border px-6 py-5">
              <p className="legend-label text-legend-muted">The Moment</p>
            </div>
          </article>

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
                  <p className="legend-label text-legend-muted">The Map</p>
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

        {legend.reflection && (
          <section className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-3xl border border-legend-border bg-legend-surface px-8 py-9 text-center">
              <p className="legend-label text-legend-earth">Reflection</p>
              <p className="legend-title mt-5 text-2xl leading-9 text-legend-ink">
                {legend.reflection}
              </p>
            </div>
          </section>
        )}

        {(legend.location_label || isOwner) && (
          <section className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-3xl border border-legend-border bg-legend-surface px-8 py-9 text-center">
              <p className="legend-label text-legend-earth">The Place</p>

              {editingPlace ? (
                <div className="mx-auto mt-5 max-w-lg">
                  <label htmlFor="legend-place" className="sr-only">
                    Place name
                  </label>
                  <input
                    id="legend-place"
                    type="text"
                    maxLength={120}
                    value={placeDraft}
                    onChange={(event) => setPlaceDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        savePlace();
                      }
                    }}
                    placeholder="Cafe, restaurant, park or town"
                    className="w-full rounded-2xl border border-legend-border bg-background px-5 py-4 text-center text-legend-ink outline-none focus:border-legend-moss"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={savePlace}
                      disabled={saving}
                      className="rounded-full bg-legend-green px-6 py-2.5 text-sm text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save place"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceDraft(legend.location_label ?? "");
                        setEditingPlace(false);
                        setEditMessage("");
                      }}
                      disabled={saving}
                      className="rounded-full border border-legend-border px-6 py-2.5 text-sm text-legend-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="legend-title mt-5 text-2xl leading-9 text-legend-ink">
                    {legend.location_label ?? "Add where this moment happened."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlace(true);
                        setEditMessage("");
                      }}
                      className="mt-4 text-sm text-legend-green transition-colors hover:text-legend-earth"
                    >
                      {legend.location_label ? "Edit place" : "Add place"}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {editMessage && (
          <p role="status" className="mx-auto mt-6 max-w-xl text-center text-sm text-legend-muted">
            {editMessage}
          </p>
        )}

        <section className="mx-auto mt-10 max-w-xl text-center">
          <p className="text-sm italic leading-7 text-legend-muted">
            A moment, a place, and something worth remembering.
          </p>
        </section>

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
