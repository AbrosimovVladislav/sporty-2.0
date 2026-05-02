"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
} from "@/components/ui/PageHeader";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";
import { useCity } from "@/lib/city-context";
import type { User } from "@/types/database";
import type { Stats, Tab } from "./_components/types";
import { AboutTab } from "./_components/AboutTab";
import { ResultsTab } from "./_components/ResultsTab";
import { ReliabilityTab } from "./_components/ReliabilityTab";
import { AchievementsTab } from "./_components/AchievementsTab";
import { MyJoinRequests } from "./_components/MyJoinRequests";

export default function ProfilePage() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }
  if (auth.status !== "authenticated") return null;

  return <ProfileContent initialUser={auth.user} />;
}

function ProfileContent({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);
  const [teamsCount, setTeamsCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeCity } = useCity();

  useEffect(() => {
    fetch(`/api/users/${initialUser.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setDistrictName(d.user.district?.name ?? null);
        }
      })
      .catch(() => {});
  }, [initialUser.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${initialUser.id}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setStats(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    fetch(`/api/users/${initialUser.id}/teams`)
      .then((r) => (r.ok ? r.json() : { teams: [] }))
      .then((d) => {
        if (!cancelled) setTeamsCount((d.teams ?? []).length);
      })
      .catch(() => {
        if (!cancelled) setTeamsCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Файл слишком большой. Максимум 2 МБ");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setUploadError(data.error ?? "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка сети");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Обо мне" },
    { id: "results", label: "Результаты" },
    { id: "reliability", label: "Надёжность" },
    { id: "achievements", label: "Награды" },
  ];

  const subtitleLocation = [
    user.city || activeCity,
    user.city === (activeCity || user.city) ? districtName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const tabsForUI: UnderlineTab[] = tabs.map((t) => ({
    label: t.label,
    active: tab === t.id,
    onClick: () => setTab(t.id),
  }));

  const reliabilityValue =
    stats?.reliability !== null && stats?.reliability !== undefined
      ? `${stats.reliability}%`
      : "—";

  const leadingSlot = (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Загрузить фото"
        className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: user.avatar_url ? "white" : "rgba(255,255,255,0.18)",
          border: "2px solid rgba(255,255,255,0.25)",
          opacity: uploading ? 0.5 : 1,
        }}
      >
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-[24px] font-bold text-white leading-none">
            {(user.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Сменить фото"
        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: "var(--green-500)",
          border: "2px solid var(--green-600)",
        }}
        disabled={uploading}
      >
        {uploading ? (
          <div className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <CameraIcon />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--bg-secondary)" }}>
      <PageHeader
        title={user.name}
        subtitle={subtitleLocation || undefined}
        leadingSlot={leadingSlot}
        onSettingsClick={() => router.push("/profile/settings")}
        settingsAriaLabel="Настройки профиля"
      >
        {user.looking_for_team && (
          <div className="mb-3 -mt-1">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "white" }}
              />
              Ищу команду
            </span>
          </div>
        )}
        <HeaderStatGroup>
          <HeaderStat value={stats?.playedCount ?? 0} label="Сыграно" />
          <HeaderStat value={reliabilityValue} label="Надёжность" />
          <HeaderStat value={teamsCount ?? 0} label="Команд" />
          {user.rating != null && (
            <HeaderStat value={user.rating} label="Рейтинг" />
          )}
        </HeaderStatGroup>
      </PageHeader>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {uploadError && (
        <p
          className="text-[13px] text-center mt-2 px-4"
          style={{ color: "var(--danger)" }}
        >
          {uploadError}
        </p>
      )}

      <UnderlineTabs
        tabs={tabsForUI}
        className="sticky top-0 z-10 bg-white"
      />

      <div className="flex flex-col gap-4 px-4 py-4 pb-6">
        {tab === "about" && <AboutTab user={user} />}
        {tab === "results" && <ResultsTab stats={stats} />}
        {tab === "reliability" && <ReliabilityTab stats={stats} />}
        {tab === "achievements" && <AchievementsTab />}

        <MyJoinRequests userId={user.id} />
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
