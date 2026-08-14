"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../../lib/supabase";

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

type ChallengeSet = {
  userId: string;
  finds: ChallengeFind[];
  submittedAt: string | null;
};

export default function ChallengeGalleryPage() {
  const [prompts, setPrompts] =
    useState<Prompt[]>([]);

  const [finds, setFinds] =
    useState<ChallengeFind[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadGallery() {
      setLoading(true);
      setMessage("");

      /*
       * LOAD THIS WEEK'S THREE WORDS
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
          "Could not load challenge:",
          challengeError,
        );

        setMessage(
          "This week's Challenge could not be opened.",
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

      setPrompts(
        currentPrompts,
      );

      /*
       * LOAD ONLY SHARED FINDS
       */

      const {
        data,
        error,
      } = await supabase
        .from("challenge_finds")
        .select(
          "id, user_id, week_start, prompt_id, image_url, submitted, submitted_at, favourite, created_at",
        )
        .eq(
          "week_start",
          challenge.out_week_start,
        )
        .eq(
          "submitted",
          true,
        )
        .order(
          "submitted_at",
          {
            ascending: false,
          },
        );

      if (error) {
        console.error(
          "Could not load shared Challenge finds:",
          error,
        );

        setMessage(
          "This week's shared finds could not be opened.",
        );

        setLoading(false);
        return;
      }

      setFinds(
        (data ?? []) as ChallengeFind[],
      );

      setLoading(false);
    }

    loadGallery();
  }, []);

  /*
   * GROUP EACH PERSON'S THREE PHOTOS
   * INTO ONE CHALLENGE SET
   */

  const challengeSets =
    useMemo<ChallengeSet[]>(() => {
      const grouped =
        new Map<
          string,
          ChallengeFind[]
        >();

      for (const find of finds) {
        const current =
          grouped.get(
            find.user_id,
          ) ?? [];

        current.push(
          find,
        );

        grouped.set(
          find.user_id,
          current,
        );
      }

      const sets: ChallengeSet[] =
        [];

      for (
        const [
          userId,
          userFinds,
        ] of grouped
      ) {
        /*
         * Put the photographs back into
         * prompt order.
         */

        const validFinds =
          prompts
            .map(
              (prompt) =>
                userFinds.find(
                  (find) =>
                    find.prompt_id ===
                    prompt.id,
                ),
            )
            .filter(
              (
                find,
              ): find is ChallengeFind =>
                Boolean(find),
            );

        /*
         * Only show complete sets.
         */

        if (
          validFinds.length !== 3
        ) {
          continue;
        }

        /*
         * Use the latest submitted timestamp
         * from that person's three photographs.
         */

        const submittedTimes =
          validFinds
            .map(
              (find) =>
                find.submitted_at,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            )
            .sort();

        sets.push({
          userId,
          finds:
            validFinds,
          submittedAt:
            submittedTimes.at(
              -1,
            ) ?? null,
        });
      }

      /*
       * Newest complete Challenge first.
       * Maximum 15 sets.
       */

      return sets
        .sort(
          (a, b) => {
            const aTime =
              a.submittedAt
                ? new Date(
                    a.submittedAt,
                  ).getTime()
                : 0;

            const bTime =
              b.submittedAt
                ? new Date(
                    b.submittedAt,
                  ).getTime()
                : 0;

            return (
              bTime -
              aTime
            );
          },
        )
        .slice(
          0,
          15,
        );
    }, [
      finds,
      prompts,
    ]);

  function promptForFind(
    promptId: number,
  ) {
    return prompts.find(
      (prompt) =>
        prompt.id ===
        promptId,
    );
  }

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

          <Link
            href="/challenge"
            className="legend-label text-legend-muted transition-colors hover:text-legend-green"
          >
            Bailey&apos;s Challenge
          </Link>

        </div>

        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-14 text-center">

          <p className="legend-label text-legend-earth">
            Bailey&apos;s Challenge
          </p>

          <h1 className="legend-title mt-5 text-5xl font-medium text-legend-ink sm:text-6xl">
            This week&apos;s finds.
          </h1>

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">

            <span className="h-px w-14 bg-legend-border" />

            <span className="text-sm text-legend-green">
              ◆
            </span>

            <span className="h-px w-14 bg-legend-border" />

          </div>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            The latest fifteen Challenge sets.
            Three prompts, seen fifteen different ways.
          </p>

          {prompts.length === 3 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-legend-green">

              {prompts.map(
                (
                  prompt,
                  index,
                ) => (
                  <div
                    key={
                      prompt.id
                    }
                    className="flex items-center gap-4"
                  >

                    <span className="capitalize">
                      {
                        prompt.word
                      }
                    </span>

                    {index <
                      prompts.length -
                        1 && (
                      <span className="text-legend-border">
                        ·
                      </span>
                    )}

                  </div>
                ),
              )}

            </div>
          )}

        </header>

        {/* LOADING */}

        {loading && (
          <p className="text-center italic text-legend-muted">
            Gathering this week&apos;s finds...
          </p>
        )}

        {/* ERROR */}

        {!loading &&
          message && (
            <p className="text-center text-sm text-legend-muted">
              {message}
            </p>
          )}

        {/* EMPTY BOARD */}

        {!loading &&
          !message &&
          challengeSets.length ===
            0 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-legend-border bg-legend-surface/70 p-10 text-center">

              <p className="legend-label text-legend-earth">
                This week
              </p>

              <h2 className="legend-title mt-3 text-2xl text-legend-ink">
                Nothing shared yet.
              </h2>

              <p className="mt-3 text-sm leading-7 text-legend-muted">
                Someone has to notice the first three things.
              </p>

              <Link
                href="/challenge"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-legend-green px-7 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Take Bailey&apos;s Challenge
              </Link>

            </div>
          )}

        {/* CHALLENGE BOARD */}

        {!loading &&
          !message &&
          challengeSets.length >
            0 && (
            <section className="space-y-8">

              {challengeSets.map(
                (
                  set,
                  setIndex,
                ) => {
                  const sharedDate =
                    set.submittedAt
                      ? new Date(
                          set.submittedAt,
                        ).toLocaleDateString(
                          "en-AU",
                          {
                            day: "numeric",
                            month: "long",
                          },
                        )
                      : "";

                  return (
                    <article
                      key={
                        `${set.userId}-${setIndex}`
                      }
                      className="overflow-hidden rounded-3xl border border-legend-border bg-legend-surface"
                    >

                      {/* THREE PHOTOGRAPHS */}

                      <div className="grid grid-cols-3 gap-px bg-legend-border">

                        {set.finds.map(
                          (find) => {
                            const prompt =
                              promptForFind(
                                find.prompt_id,
                              );

                            return (
                              <div
                                key={
                                  find.id
                                }
                                className="bg-legend-surface"
                              >

                                <div className="aspect-square overflow-hidden bg-legend-paper">

                                  <img
                                    src={
                                      find.image_url
                                    }
                                    alt={
                                      prompt?.word ??
                                      "Challenge find"
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                </div>

                                <p className="px-2 py-3 text-center text-xs capitalize text-legend-muted">
                                  {
                                    prompt?.word ??
                                    "Find"
                                  }
                                </p>

                              </div>
                            );
                          },
                        )}

                      </div>

                      {/* SUBMISSION DETAILS */}

                      <div className="px-6 py-5">

                        <div className="flex items-center justify-between gap-4">

                          <p className="legend-label text-legend-green">
                            Challenge set{" "}
                            {String(
                              setIndex +
                                1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </p>

                          {sharedDate && (
                            <p className="text-xs text-legend-muted">
                              {
                                sharedDate
                              }
                            </p>
                          )}

                        </div>

                        <p className="mt-2 text-sm text-legend-muted">
                          Three ways of seeing the same week.
                        </p>

                      </div>

                    </article>
                  );
                },
              )}

            </section>
          )}

        {/* BOARD FOOTER */}

        {!loading &&
          challengeSets.length >
            0 && (
            <div className="mx-auto mt-10 max-w-xl text-center">

              <p className="text-xs italic leading-6 text-legend-muted">
                Showing up to fifteen of the latest completed Challenges.
              </p>

              <Link
                href="/challenge"
                className="mt-5 inline-flex text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
              >
                Take this week&apos;s Challenge →
              </Link>

            </div>
          )}

        {/* FOOTER */}

        <footer className="mt-16 border-t border-legend-border pt-8 text-center">

          <Link
            href="/challenge"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            ← Bailey&apos;s Challenge
          </Link>

          <p className="mt-6 text-xs italic text-legend-muted">
            Walk first. Technology serves observation.
          </p>

        </footer>

      </div>

    </main>
  );
}