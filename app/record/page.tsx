"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type SaveStatus =
  | "idle"
  | "saving"
  | "success"
  | "error";

type AuthStatus =
  | "checking"
  | "signed-in"
  | "signed-out";

export default function RecordPage() {
  const router = useRouter();

  const [authStatus, setAuthStatus] =
    useState<AuthStatus>("checking");

  const [userId, setUserId] =
    useState<string | null>(null);

  const [photo, setPhoto] =
    useState<string | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loaded, setLoaded] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [reflection, setReflection] =
    useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [locationStatus, setLocationStatus] =
    useState<
      "idle" | "finding" | "found" | "error"
    >("idle");

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("idle");

  const [message, setMessage] =
    useState("");

  /*
   * CHECK LOGIN
   */

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setUserId(null);
        setAuthStatus("signed-out");
        return;
      }

      setUserId(user.id);
      setAuthStatus("signed-in");
    }

    checkUser();
  }, []);

  /*
   * CLEAN UP PHOTO PREVIEW
   */

  useEffect(() => {
    return () => {
      if (photo) {
        URL.revokeObjectURL(photo);
      }
    };
  }, [photo]);

  /*
   * PHOTO
   */

  function handlePhotoSelect(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (photo) {
      URL.revokeObjectURL(photo);
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedFile(file);
    setPhoto(previewUrl);
    setLoaded(false);
    setSaveStatus("idle");
    setMessage("");

    window.setTimeout(() => {
      setLoaded(true);
    }, 200);
  }

  /*
   * LOCATION
   */

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");

      setMessage(
        "Location is not available on this device.",
      );

      return;
    }

    setLocationStatus("finding");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude,
        );

        setLongitude(
          position.coords.longitude,
        );

        setLocationStatus("found");
      },

      () => {
        setLocationStatus("error");

        setMessage(
          "We couldn't get your location. You can still record this Legend without it.",
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  /*
   * SAVE LEGEND
   */

  async function plantLegend() {
    if (!userId) {
      setMessage(
        "You need to be signed in to record a Legend.",
      );

      return;
    }

    if (!selectedFile) {
      setMessage(
        "Take a photograph first.",
      );

      return;
    }

    if (!title.trim()) {
      setMessage(
        "Give your Legend a title.",
      );

      return;
    }

    setSaveStatus("saving");

    setMessage(
      "Planting your Legend...",
    );

    try {
      /*
       * Check the user again immediately
       * before writing anything.
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "Your session has ended. Please sign in again.",
        );
      }

      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      /*
       * Store each person's photos
       * under their own user ID.
       */

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("legends")
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
          },
        );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("legends")
        .getPublicUrl(
          filePath,
        );

      const {
        data: savedLegend,
        error: databaseError,
      } = await supabase
        .from("legends")
        .insert({
          user_id:
            user.id,

          title:
            title.trim(),

          reflection:
            reflection.trim() ||
            null,

          image_url:
            publicUrlData.publicUrl,

          latitude,
          longitude,
        })
        .select("id")
        .single();

      if (databaseError) {
        /*
         * If the database insert fails after
         * the photo uploaded, remove the orphan
         * from Storage.
         */

        await supabase.storage
          .from("legends")
          .remove([
            filePath,
          ]);

        throw databaseError;
      }

      setSaveStatus("success");

      setMessage(
        "Your Legend has been recorded.",
      );

      /*
       * Take the user directly to
       * the Legend they just created.
       */

      window.setTimeout(() => {
        router.push(
          `/legends/${savedLegend.id}`,
        );
      }, 500);
    } catch (error) {
      console.error(
        "Could not record Legend:",
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something unexpected happened.";

      setSaveStatus("error");

      setMessage(
        `Could not record this Legend: ${errorMessage}`,
      );
    }
  }

  /*
   * AUTH CHECK SCREEN
   */

  if (
    authStatus ===
    "checking"
  ) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">

        <p className="text-center italic text-legend-muted">
          Opening your field journal...
        </p>

      </main>
    );
  }

  /*
   * SIGNED OUT
   */

  if (
    authStatus ===
    "signed-out"
  ) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground fade-in">

        <div className="mx-auto max-w-lg text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title mt-5 text-4xl font-medium text-legend-ink sm:text-5xl">
            Your field journal is private to you.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-legend-muted">
            Sign in before recording a Legend.
            Looking around remains open to everyone.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Sign in to Local Legend
          </Link>

          <div className="mt-8">

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

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-3xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <Link
            href="/"
            className="text-sm font-medium text-legend-ink transition-colors hover:text-legend-green"
          >
            Local Legend
          </Link>

          <p className="legend-label text-legend-muted">
            Field Record
          </p>

        </div>

        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-14 text-center">

          <p className="legend-label text-legend-earth">
            Record a Legend
          </p>

          <h1 className="legend-title mt-5 text-5xl font-medium text-legend-ink sm:text-6xl">
            Notice something worth keeping.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            One photograph, a few words,
            and the place where you found it.
          </p>

        </header>

        {/* PHOTO */}

        <section className="legend-paper legend-shadow overflow-hidden rounded-3xl">

          <div className="p-6">

            <label
              htmlFor="photo-upload"
              className="block cursor-pointer"
            >

              <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-legend-border bg-legend-paper/50">

                {photo ? (
                  <Image
                    src={photo}
                    alt="Selected Legend"
                    fill
                    unoptimized
                    className={`object-contain transition-all duration-700 ${
                      loaded
                        ? "scale-100 opacity-100 blur-0"
                        : "scale-[1.02] opacity-0 blur-sm"
                    }`}
                  />
                ) : (
                  <div className="px-6 text-center">

                    <p className="legend-title text-2xl text-legend-ink">
                      Take a photograph
                    </p>

                    <p className="mt-2 text-sm text-legend-muted">
                      Something you stopped to notice.
                    </p>

                  </div>
                )}

              </div>

            </label>

            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={
                handlePhotoSelect
              }
            />

          </div>

          {/* DETAILS */}

          <div className="space-y-6 border-t border-legend-border p-7">

            <div>

              <label
                htmlFor="title"
                className="legend-label text-legend-green"
              >
                Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-legend-border bg-background px-4 py-3 text-legend-ink outline-none focus:border-legend-moss"
                placeholder="What did you notice?"
              />

            </div>

            <div>

              <label
                htmlFor="reflection"
                className="legend-label text-legend-green"
              >
                Reflection
              </label>

              <textarea
                id="reflection"
                rows={5}
                value={reflection}
                onChange={(event) =>
                  setReflection(
                    event.target.value,
                  )
                }
                className="mt-2 w-full resize-y rounded-xl border border-legend-border bg-background px-4 py-3 leading-7 text-legend-ink outline-none focus:border-legend-moss"
                placeholder="When you see this again, what do you want to remember?"
              />

            </div>

            {/* LOCATION */}

            <div className="rounded-2xl border border-legend-border bg-legend-paper/40 p-5">

              <p className="legend-label text-legend-earth">
                Place
              </p>

              <p className="mt-2 text-sm leading-6 text-legend-muted">
                Add where you are now so this photograph
                stays connected to its place.
              </p>

              <button
                type="button"
                onClick={
                  handleUseLocation
                }
                disabled={
                  locationStatus ===
                  "finding"
                }
                className="mt-4 rounded-full border border-legend-border bg-legend-surface px-5 py-2.5 text-sm text-legend-ink transition-all hover:border-legend-moss hover:bg-background disabled:opacity-60"
              >
                {locationStatus ===
                "finding"
                  ? "Finding location..."
                  : locationStatus ===
                      "found"
                    ? "Location added"
                    : "Use my current location"}
              </button>

              {locationStatus ===
                "found" &&
                latitude !== null &&
                longitude !== null && (
                <p className="mt-3 text-xs text-legend-muted">
                  {latitude.toFixed(
                    5,
                  )}
                  ,{" "}
                  {longitude.toFixed(
                    5,
                  )}
                </p>
              )}

            </div>

          </div>

          {/* SAVE */}

          <div className="border-t border-legend-border bg-legend-paper/40 px-7 py-6">

            <button
              type="button"
              onClick={
                plantLegend
              }
              disabled={
                saveStatus ===
                "saving"
              }
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {saveStatus ===
              "saving"
                ? "Recording..."
                : "Record this Legend"}
            </button>

            {message && (
              <p className="mt-4 text-center text-sm leading-6 text-legend-muted">
                {message}
              </p>
            )}

          </div>

        </section>

        <footer className="mt-10 text-center">

          <Link
            href="/"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            ← Back to Local Legend
          </Link>

        </footer>

      </div>

    </main>
  );
}