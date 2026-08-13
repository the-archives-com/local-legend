import type { MetadataRoute } from "next";

import { supabase } from "../lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    "https://local-legend.com.au";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },

    {
      url: `${baseUrl}/map`,
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/challenge`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const {
    data: legends,
    error,
  } = await supabase
    .from("legends")
    .select(
      "id, created_at, image_url",
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Could not add Legends to sitemap:",
      error,
    );

    return staticPages;
  }

  const legendPages: MetadataRoute.Sitemap =
    (legends ?? []).map(
      (legend) => ({
        url:
          `${baseUrl}/legends/${legend.id}`,

        lastModified:
          legend.created_at
            ? new Date(
                legend.created_at,
              )
            : undefined,

        changeFrequency:
          "monthly",

        priority: 0.8,

        images:
          legend.image_url
            ? [legend.image_url]
            : undefined,
      }),
    );

  return [
    ...staticPages,
    ...legendPages,
  ];
}