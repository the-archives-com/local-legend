"use client";

import dynamic from "next/dynamic";

const LegendMap = dynamic(
  () => import("./LegendMap"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-background px-6 py-14 text-foreground">
        <div className="mx-auto max-w-6xl">

          <div className="flex min-h-[520px] items-center justify-center">

            <p className="text-sm italic text-legend-muted">
              Finding the Legends...
            </p>

          </div>

        </div>
      </main>
    ),
  },
);

export default function MapPage() {
  return <LegendMap />;
}