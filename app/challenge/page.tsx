"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type WeeklyChallenge = {
  out_week_start: string;

  prompt_1_id: number;
  prompt_1_word: string;

  prompt_2_id: number;
  prompt_2_word: string;

  prompt_3_id: number;
  prompt_3_word: string;
};

type Prompt = {
  id: number;
  word: string;
};

type ChallengeFind = {
  id: number;
  user_id: string;
  week_start: string;
  prompt_id: number;
  image_url: string;
  submitted: boolean;
  submitted_at: string | null;
  favourite: boolean;
  created_at: string;
};

export default function ChallengePage() {
  const [userId, setUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [weekStart, setWeekStart] =
    useState("");

  const [prompts, setPrompts] =
    useState<Prompt[]>([]);

  const [finds, setFinds] =
    useState<ChallengeFind[]>([]);

  const [selectedPrompt, setSelectedPrompt] =
    useState<Prompt | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * LOAD USER + THIS WEEK'S CHALLENGE
   */

  useEffect(() => {
    async function initialise() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      /*
       * GET THIS WEEK'S THREE LOCKED WORDS
       */

      const {
        data: challengeData,
        error: challengeError,
      } = await supabase.rpc(
        "get_or_create_current_challenge",
      );

      if (
        challengeError ||
        !challengeData ||
        challengeData.length === 0
      ) {
        console.error(
          "Could not load weekly challenge:",
          challengeError,
        );

        setMessage(
          "This week's challenge could not be opened.",
        );

        setLoading(false);
        return;
      }

      const challenge =
        challengeData[0] as WeeklyChallenge;

      const currentPrompts: Prompt[] = [
        {
          id:
            challenge.prompt_1_id,
          word:
            challenge.prompt_1_word,
        },
        {
          id:
            challenge.prompt_2_id,
          word:
            challenge.prompt_2_word,
        },
        {
          id:
            challenge.prompt_3_id,
          word:
            challenge.prompt_3_word,
        },
      ];

      setWeekStart(
        challenge.out_week_start,
      );

      setPrompts(
        currentPrompts,
      );

      /*
       * LOAD THIS USER'S FINDS
       */

      const {
        data: findData,
        error: findError,
      } = await supabase
        .from("challenge_finds")
        .select(
          "id, user_id, week_start, prompt_id, image_url, submitted, submitted_at, favourite, created_at",
        )
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "week_start",
          challenge.out_week_start,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

      if (findError) {
        console.error(
          "Could not load challenge finds:",
          findError,
        );
      }

      setFinds(
        (findData ?? []) as ChallengeFind[],
      );

      setLoading(false);
    }

    initialise();
  }, []);

  /*
   * CLEAN UP PHOTO PREVIEW
   */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  /*
   * TAKE / CHOOSE PHOTO
   */

  function handlePhotoSelect(
    prompt: Prompt,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedPrompt(
      prompt,
    );

    setSelectedFile(
      file,
    );

    setPreviewUrl(
      URL.createObjectURL(file),
    );

    setMessage("");
  }

  /*
   * CANCEL PHOTO
   */

  function cancelPhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedPrompt(
      null,
    );

    setSelectedFile(
      null,
    );

    setPreviewUrl(
      null,
    );

    setMessage("");
  }

  /*
   * SAVE ONE FIND
   */

  async function keepFind() {
    if (
      !selectedPrompt ||
      !selectedFile ||
      !weekStart
    ) {
      return;
    }

    setSaving(true);

    setMessage(
      "Keeping this find...",
    );

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "Please sign in again.",
        );
      }

      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/challenge/${weekStart}/${crypto.randomUUID()}.${extension}`;

      /*
       * UPLOAD PHOTO
       */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("legends")
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl:
              "3600",

            upsert:
              false,
          },
        );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * GET PUBLIC PHOTO URL
       */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("legends")
        .getPublicUrl(
          filePath,
        );

      /*
       * SAVE FIND
       */

      const {
        data: savedFind,
        error: databaseError,
      } = await supabase
        .from("challenge_finds")
        .insert({
          user_id:
            user.id,

          week_start:
            weekStart,

          prompt_id:
            selectedPrompt.id,

          image_url:
            publicUrlData.publicUrl,
        })
        .select(
          "id, user_id, week_start, prompt_id, image_url, submitted, submitted_at, favourite, created_at",
        )
        .single();

      /*
       * REMOVE PHOTO IF DATABASE SAVE FAILS
       */

      if (databaseError) {
        await supabase.storage
          .from("legends")
          .remove([
            filePath,
          ]);

        throw databaseError;
      }

      setFinds(
        (current) => [
          ...current,
          savedFind as ChallengeFind,
        ],
      );

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }

      setSelectedPrompt(
        null,
      );

      setSelectedFile(
        null,
      );

      setPreviewUrl(
        null,
      );

      setMessage(
        "Found.",
      );

      window.setTimeout(
        () => {
          setMessage("");
        },
        1200,
      );
    } catch (error) {
      console.error(
        "Could not save challenge find:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "This find could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * SHARE COMPLETED SET
   */

  async function submitFinds() {
    if (
      finds.length < 3 ||
      !userId ||
      !weekStart
    ) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    const submittedAt =
      new Date().toISOString();

    const {
      error,
    } = await supabase
      .from("challenge_finds")
      .update({
        submitted:
          true,

        submitted_at:
          submittedAt,
      })
      .eq(
        "user_id",
        userId,
      )
      .eq(
        "week_start",
        weekStart,
      );

    if (error) {
      console.error(
        "Could not submit challenge:",
        error,
      );

      setMessage(
        "Your finds could not be shared.",
      );

      setSubmitting(false);
      return;
    }

    setFinds(
      (current) =>
        current.map(
          (find) => ({
            ...find,

            submitted:
              true,

            submitted_at:
              submittedAt,
          }),
        ),
    );

    setMessage(
      "Your three finds have been shared.",
    );

    setSubmitting(false);
  }

  /*
   * GET FIND FOR A PROMPT
   */

  function findForPrompt(
    promptId: number,
  ) {
    return finds.find(
      (find) =>
        find.prompt_id ===
        promptId,
    );
  }

  /*
   * CHALLENGE PROGRESS
   */

  const completeCount =
    prompts.filter(
      (prompt) =>
        Boolean(
          findForPrompt(
            prompt.id,
          ),
        ),
    ).length;

  const challengeComplete =
    completeCount === 3;

  const submittedFinds =
    finds.filter(
      (find) =>
        prompts.some(
          (prompt) =>
            prompt.id ===
            find.prompt_id,
        ),
    );

  const alreadySubmitted =
    challengeComplete &&
    submittedFinds.length === 3 &&
    submittedFinds.every(
      (find) =>
        find.submitted,
    );

  /*
   * LOADING
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">

        <p className="text-center italic text-legend-muted">
          Preparing Bailey&apos;s Challenge...
        </p>

      </main>
    );
  }

  /*
   * SIGNED OUT
   */

  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground fade-in">

        <div className="mx-auto max-w-lg text-center">

          <p className="legend-label text-legend-earth">
            Bailey&apos;s Challenge
          </p>

          <h1 className="legend-title mt-5 text-4xl font-medium text-legend-ink sm:text-5xl">
            Three things are waiting to be noticed.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-legend-muted">
            Sign in to collect this week&apos;s
            three finds.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90"
          >
            Sign in to take the challenge
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

  /*
   * MAIN PAGE
   */

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-4xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <Link
            href="/"
            className="text-sm font-medium text-legend-ink transition-colors hover:text-legend-green"
          >
            Local Legend
          </Link>

          <p className="legend-label text-legend-muted">
            Bailey&apos;s Challenge
          </p>

        </div>

        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-14 text-center">

          <p className="legend-label text-legend-earth">
            This Week
          </p>

          <h1 className="legend-title mt-5 text-5xl font-medium text-legend-ink sm:text-6xl">
            Three things you might otherwise walk past.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            No points. No leaderboard.
            Just three reasons to look a little closer.
          </p>

          <p className="mt-5 text-sm text-legend-muted">
            {completeCount} of 3 found
          </p>

        </header>

        {/* CHALLENGE CARDS */}

        <section className="grid gap-5 md:grid-cols-3">

          {prompts.map(
            (prompt) => {
              const found =
                findForPrompt(
                  prompt.id,
                );

              return (
                <article
                  key={
                    prompt.id
                  }
                  className="legend-paper legend-shadow overflow-hidden rounded-3xl"
                >

                  {found ? (
                    <>
                      {/* FOUND PHOTO */}

                      <div className="aspect-square overflow-hidden bg-legend-paper">

                        <img
                          src={
                            found.image_url
                          }
                          alt={
                            prompt.word
                          }
                          className="h-full w-full object-cover"
                        />

                      </div>

                      <div className="p-6 text-center">

                        <p className="legend-label text-legend-green">
                          ✓ Found
                        </p>

                        <h2 className="legend-title mt-2 text-2xl capitalize text-legend-ink">
                          {
                            prompt.word
                          }
                        </h2>

                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[330px] flex-col justify-between p-7 text-center">

                      <div>

                        <p className="legend-label text-legend-earth">
                          Find
                        </p>

                        <h2 className="legend-title mt-3 text-3xl capitalize text-legend-ink">
                          {
                            prompt.word
                          }
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-legend-muted">
                          However you interpret it.
                        </p>

                      </div>

                      {/* CAMERA BUTTON */}

                      <label
                        htmlFor={`challenge-${prompt.id}`}
                        className="mt-8 flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-legend-border bg-legend-surface px-5 py-3 text-sm text-legend-ink transition-all hover:border-legend-moss hover:bg-legend-paper active:scale-[0.98]"
                      >
                        Take photograph
                      </label>

                      <input
                        id={`challenge-${prompt.id}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={
                          (event) =>
                            handlePhotoSelect(
                              prompt,
                              event,
                            )
                        }
                      />

                    </div>
                  )}

                </article>
              );
            },
          )}

        </section>

        {/* PHOTO PREVIEW */}

        {selectedPrompt &&
          selectedFile &&
          previewUrl && (
            <section className="mx-auto mt-10 max-w-2xl">

              <div className="legend-paper legend-shadow overflow-hidden rounded-3xl">

                <div className="relative aspect-[4/3] bg-legend-paper">

                  <Image
                    src={
                      previewUrl
                    }
                    alt="Challenge photograph"
                    fill
                    unoptimized
                    className="object-contain"
                  />

                </div>

                <div className="space-y-5 border-t border-legend-border p-7">

                  <div className="text-center">

                    <p className="legend-label text-legend-earth">
                      You found
                    </p>

                    <h2 className="legend-title mt-2 text-3xl capitalize text-legend-ink">
                      {
                        selectedPrompt.word
                      }
                    </h2>

                  </div>

                  <button
                    type="button"
                    onClick={
                      keepFind
                    }
                    disabled={
                      saving
                    }
                    className="flex min-h-12 w-full items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  >
                    {saving
                      ? "Keeping..."
                      : "Keep this find"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelPhoto
                    }
                    disabled={
                      saving
                    }
                    className="w-full text-sm text-legend-muted transition-colors hover:text-legend-green disabled:opacity-50"
                  >
                    Try another photograph
                  </button>

                </div>

              </div>

            </section>
          )}

        {/* COMPLETED CHALLENGE */}

        {challengeComplete && (
          <section className="mx-auto mt-12 max-w-xl text-center">

            <p className="legend-label text-legend-green">
              Challenge complete
            </p>

            <h2 className="legend-title mt-3 text-3xl text-legend-ink">
              Three things you might otherwise have walked past.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-legend-muted">
              If you&apos;d like, share your three
              finds for this week&apos;s favourites.
            </p>

            {!alreadySubmitted ? (
              <button
                type="button"
                onClick={
                  submitFinds
                }
                disabled={
                  submitting
                }
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting
                  ? "Sharing..."
                  : "Share my three finds"}
              </button>
            ) : (
              <p className="mt-7 text-sm font-medium text-legend-green">
                ✓ Shared for this week
              </p>
            )}

          </section>
        )}

        {/* MESSAGE */}

        {message && (
          <p className="mt-6 text-center text-sm text-legend-muted">
            {message}
          </p>
        )}

        {/* FOOTER */}

        <footer className="mt-16 border-t border-legend-border pt-8 text-center">

          <Link
            href="/"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            ← Back to Local Legend
          </Link>

          <p className="mt-6 text-xs italic text-legend-muted">
            Walk first. Technology serves observation.
          </p>

        </footer>

      </div>

    </main>
  );
}