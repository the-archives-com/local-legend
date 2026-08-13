import type {
  MetadataRoute,
} from "next";

export default function manifest():
  MetadataRoute.Manifest {
  return {
    name: "Local Legend",
    short_name: "Local Legend",
    description:
      "Mindful exploration. Notice what is worth remembering.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#faf9f6",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}