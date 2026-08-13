import type { Metadata } from "next";

import { supabase } from "../../../lib/supabase";

type LegendLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: LegendLayoutProps): Promise<Metadata> {
  const { id } = await params;

  const {
    data: legend,
    error,
  } = await supabase
    .from("legends")
    .select(
      "id, title, reflection, image_url, location_label, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !legend) {
    return {
      title: "Legend",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const locationText =
    legend.location_label?.trim();

  const description =
    legend.reflection?.trim() ||
    (locationText
      ? `${legend.title}, recorded at ${locationText} on Local Legend.`
      : `${legend.title}, a moment recorded on Local Legend.`);

  const legendUrl =
    `/legends/${legend.id}`;

  return {
    title: legend.title,

    description,

    alternates: {
      canonical: legendUrl,
    },

    openGraph: {
      type: "article",

      url: legendUrl,

      title:
        `${legend.title} | Local Legend`,

      description,

      images: [
        {
          url: legend.image_url,
          alt: legend.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title:
        `${legend.title} | Local Legend`,

      description,

      images: [
        legend.image_url,
      ],
    },
  };
}

export default function LegendLayout({
  children,
}: LegendLayoutProps) {
  return children;
}