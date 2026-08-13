"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";

import { supabase } from "../../lib/supabase";


type Legend = {
  id: number;
  created_at: string;
  title: string;
  reflection: string | null;
  image_url: string;
  latitude: number;
  longitude: number;
};


const legendIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: #536a52;
        border: 3px solid #fffdf8;
        box-shadow: 0 2px 8px rgba(48,53,47,0.25);
      "
    ></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -8],
});


export default function LegendMap() {
  const [legends, setLegends] =
    useState<Legend[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");


  useEffect(() => {
    async function loadLegends() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("legends")
        .select(
          "id, created_at, title, reflection, image_url, latitude, longitude",
        )
        .not(
          "latitude",
          "is",
          null,
        )
        .not(
          "longitude",
          "is",
          null,
        )
        .is(
          "challenge_prompt",
          null,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

      if (error) {
        console.error(
          "Could not load mapped Legends:",
          error,
        );

        setErrorMessage(
          "The map could not be loaded.",
        );

        setLoading(false);
        return;
      }

      setLegends(
        (data ?? []) as Legend[],
      );

      setLoading(false);
    }

    loadLegends();
  }, []);


  const mapCentre =
    useMemo<[number, number]>(
      () => {
        if (legends.length > 0) {
          return [
            legends[0].latitude,
            legends[0].longitude,
          ];
        }

        return [
          -31.9523,
          115.8613,
        ];
      },
      [legends],
    );


  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-6xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <Link
            href="/"
            className="text-sm font-medium text-legend-ink transition-colors hover:text-legend-green"
          >
            Local Legend
          </Link>

          <p className="legend-label text-legend-muted">
            Explore by Place
          </p>

        </div>


        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-12 text-center">

          <p className="legend-label text-legend-earth">
            The Map
          </p>

          <h1 className="legend-title mt-4 text-5xl font-medium text-legend-ink sm:text-6xl">
            Wander through what was noticed.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            Move around the map and see what
            someone thought was worth remembering
            in that place.
          </p>

        </header>


        {/* MAP */}

        <section className="legend-paper legend-shadow overflow-hidden rounded-3xl">

          {loading && (
            <div className="flex min-h-[520px] items-center justify-center">

              <p className="text-sm italic text-legend-muted">
                Finding the Legends...
              </p>

            </div>
          )}


          {!loading &&
            errorMessage && (
              <div className="flex min-h-[520px] items-center justify-center px-6 text-center">

                <p className="text-sm text-legend-muted">
                  {errorMessage}
                </p>

              </div>
            )}


          {!loading &&
            !errorMessage &&
            legends.length === 0 && (
              <div className="flex min-h-[520px] items-center justify-center px-6 text-center">

                <div>

                  <p className="legend-title text-2xl text-legend-ink">
                    No mapped Legends yet.
                  </p>

                  <p className="mt-3 text-sm text-legend-muted">
                    Record a Legend with location
                    and it will appear here.
                  </p>

                  <Link
                    href="/record"
                    className="mt-6 inline-block text-sm font-medium text-legend-green"
                  >
                    Record a Legend →
                  </Link>

                </div>

              </div>
            )}


          {!loading &&
            !errorMessage &&
            legends.length > 0 && (
              <div className="h-[68vh] min-h-[520px]">

                <MapContainer
                  center={mapCentre}
                  zoom={14}
                  scrollWheelZoom
                  className="h-full w-full"
                >

                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />


                  {legends.map(
                    (legend) => (
                      <Marker
                        key={legend.id}
                        position={[
                          legend.latitude,
                          legend.longitude,
                        ]}
                        icon={legendIcon}
                        eventHandlers={{
                          mouseover: (
                            event,
                          ) => {
                            event.target.openPopup();
                          },

                          click: (
                            event,
                          ) => {
                            event.target.openPopup();
                          },
                        }}
                      >

                        <Popup
                          maxWidth={280}
                          closeButton={false}
                        >

                          <div className="w-[220px]">

                            <img
                              src={
                                legend.image_url
                              }
                              alt={
                                legend.title
                              }
                              className="h-36 w-full rounded-lg object-cover"
                            />

                            <p className="mt-3 text-base font-medium">
                              {
                                legend.title
                              }
                            </p>

                            {legend.reflection && (
                              <p className="mt-2 line-clamp-3 text-sm leading-5">
                                {
                                  legend.reflection
                                }
                              </p>
                            )}

                            <Link
                              href={`/legends/${legend.id}`}
                              className="mt-3 inline-block text-sm font-medium text-legend-green"
                            >
                              View Legend →
                            </Link>

                          </div>

                        </Popup>

                      </Marker>
                    ),
                  )}

                </MapContainer>

              </div>
            )}

        </section>


        {/* MAP NOTE */}

        <section className="mx-auto mt-10 max-w-xl text-center">

          <p className="text-sm italic leading-7 text-legend-muted">
            The map remembers where.
            The photograph remembers why.
          </p>

        </section>


        {/* ACTIONS */}

        <div className="mt-10 flex flex-wrap justify-center gap-6">

          <Link
            href="/record"
            className="text-sm text-legend-green transition-colors hover:text-legend-earth"
          >
            Record a Legend
          </Link>

          <Link
            href="/"
            className="text-sm text-legend-muted transition-colors hover:text-legend-green"
          >
            Back to Local Legend
          </Link>

        </div>

      </div>

    </main>
  );
}