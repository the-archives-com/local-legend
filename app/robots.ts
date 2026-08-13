import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/record",
        "/reset-password",
        "/update-password",
      ],
    },

    sitemap:
      "https://local-legend.com.au/sitemap.xml",

    host:
      "https://local-legend.com.au",
  };
}