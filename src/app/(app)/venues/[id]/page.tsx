"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import { EventListRow } from "@/components/events/EventListRow";
import { EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/format";

type VenueDetail = {
  id: string;
  name: string;
  address: string;
  city: string;
  district_id: string | null;
  default_cost: number | null;
  photo_url: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  district: { id: string; name: string } | null;
};

type UpcomingEvent = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  team: { id: string; name: string; city: string } | null;
  yes_count: number;
};

type ApiResponse = {
  venue: VenueDetail;
  upcomingEvents: UpcomingEvent[];
  upcomingTotal: number;
};

function buildMapsUrl(city: string, address: string): string {
  const slug = city.trim().toLowerCase() === "алматы" ? "almaty" : encodeURIComponent(city);
  return `https://2gis.kz/${slug}/search/${encodeURIComponent(address)}`;
}

function normalizePhoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

function ensureUrlScheme(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatWebsiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default function VenueProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ApiResponse | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/venues/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <SkeletonCard className="h-[260px]" />
        <SkeletonCard className="h-12" />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
          Площадка не найдена
        </p>
      </div>
    );
  }

  const { venue, upcomingEvents, upcomingTotal } = data;
  const mapsUrl = buildMapsUrl(venue.city, venue.address);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <div
        className="overflow-hidden"
        style={{
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          background: "var(--gray-900)",
        }}
      >
        <div className="relative h-[230px] w-full">
          {venue.photo_url ? (
            <Image
              src={venue.photo_url}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--gray-700), var(--gray-900))",
              }}
            />
          )}

          <div
            className="absolute inset-x-0 top-0 h-14 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, var(--gray-900) 100%)",
            }}
          />

          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Назад"
            className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform active:scale-95"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <BackIcon />
          </button>
        </div>

        <div className="px-[18px] pt-1.5 pb-5">
          <h1 className="font-display text-[24px] font-bold uppercase leading-tight text-white">
            {venue.name}
          </h1>
          <p
            className="text-[13px] mt-1"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {venue.address}
          </p>

          {(venue.district || venue.default_cost) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {venue.district && (
                <Chip>
                  <PinIcon />
                  {venue.district.name}
                </Chip>
              )}
              {venue.default_cost ? (
                <Chip>
                  <CoinIcon />
                  <strong className="font-semibold text-white">
                    {formatPrice(venue.default_cost)}
                  </strong>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>/ час</span>
                </Chip>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 pb-10 flex flex-col gap-5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-bold transition-transform active:scale-[0.98]"
          style={{ background: "var(--green-500)", color: "white" }}
        >
          <RouteIcon />
          Маршрут
        </a>

        {(venue.phone || venue.website) && (
          <section>
            <SectionEyebrow>Контакты</SectionEyebrow>
            <div
              className="rounded-[16px] overflow-hidden mt-2"
              style={{
                background: "var(--bg-card)",
                border: "1.5px solid var(--gray-200)",
              }}
            >
              {venue.phone && (
                <a
                  href={normalizePhoneHref(venue.phone)}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{
                    borderBottom: venue.website
                      ? "1px solid var(--gray-100)"
                      : "none",
                  }}
                >
                  <ContactIconBox>
                    <PhoneIcon />
                  </ContactIconBox>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] uppercase font-semibold"
                      style={{
                        letterSpacing: "0.06em",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Телефон
                    </p>
                    <p
                      className="text-[15px] font-medium mt-0.5 truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {venue.phone}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </a>
              )}
              {venue.website && (
                <a
                  href={ensureUrlScheme(venue.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <ContactIconBox>
                    <LinkIcon />
                  </ContactIconBox>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] uppercase font-semibold"
                      style={{
                        letterSpacing: "0.06em",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Сайт
                    </p>
                    <p
                      className="text-[15px] font-medium mt-0.5 truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatWebsiteLabel(venue.website)}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </a>
              )}
            </div>
          </section>
        )}

        {venue.description && (
          <section>
            <SectionEyebrow>Описание</SectionEyebrow>
            <div
              className="rounded-[16px] px-4 py-4 mt-2"
              style={{ background: "var(--bg-secondary)" }}
            >
              <p
                className="text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: "var(--text-primary)" }}
              >
                {venue.description}
              </p>
            </div>
          </section>
        )}

        <section>
          <SectionEyebrow>
            Ближайшие события
            {upcomingTotal > 0 ? ` · ${upcomingTotal}` : ""}
          </SectionEyebrow>

          {upcomingEvents.length === 0 ? (
            <div className="mt-2 py-6">
              <EmptyState text="Пока никаких событий" />
            </div>
          ) : (
            <>
              <ul className="flex flex-col mt-1">
                {upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <EventListRow
                      id={e.id}
                      teamId={e.team_id}
                      teamName={e.team?.name ?? null}
                      type={e.type}
                      date={e.date}
                      venueName={null}
                      venueAddress={null}
                      yesCount={e.yes_count}
                      pricePerPlayer={e.price_per_player}
                    />
                  </li>
                ))}
              </ul>
              {upcomingTotal > upcomingEvents.length && (
                <Link
                  href={`/search/events?venue=${venue.id}`}
                  className="flex items-center justify-center gap-1 mt-3 py-2.5 rounded-[12px] text-[13px] font-semibold"
                  style={{
                    color: "var(--green-700)",
                    background: "var(--green-50)",
                  }}
                >
                  Все события на площадке
                  <ChevronRightIcon />
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase px-1"
      style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
    >
      {children}
    </p>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
      style={{
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.65)",
      }}
    >
      {children}
    </span>
  );
}

function ContactIconBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-600)" }}
    >
      {children}
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-tertiary)" }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
