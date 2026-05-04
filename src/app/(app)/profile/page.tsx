"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";
import type { User } from "@/types/database";
import type { ProfileTeam, Stats, Tab } from "./_components/types";
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
          style={{
            borderColor: "var(--green-500)",
            borderTopColor: "transparent",
          }}
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
  const [teams, setTeams] = useState<ProfileTeam[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .then((d: { teams?: ProfileTeam[] }) => {
        if (!cancelled) setTeams(d.teams ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Файл слишком большой. Максимум 10 МБ");
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

  const tabsForUI: UnderlineTab[] = tabs.map((t) => ({
    label: t.label,
    active: tab === t.id,
    onClick: () => setTab(t.id),
  }));

  const subtitle = [user.city, districtName].filter(Boolean).join(" · ");

  const titleSlot = (
    <h1
      className="font-display font-bold uppercase text-white text-[22px] leading-[1.15] wrap-break-word"
      style={{ letterSpacing: "0.02em" }}
    >
      {user.name}
    </h1>
  );

  const leadingSlot = (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Загрузить фото"
        className="w-[72px] h-[72px] rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: user.avatar_url
            ? "white"
            : "rgba(255,255,255,0.18)",
          border: "3px solid rgba(255,255,255,0.3)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name}
            width={72}
            height={72}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-[28px] font-bold text-white leading-none">
            {(user.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Сменить фото"
        className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "2px solid rgba(255,255,255,0.2)",
        }}
        disabled={uploading}
      >
        {uploading ? (
          <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <CameraIcon />
        )}
      </button>
    </div>
  );

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      <PageHeader
        titleSlot={titleSlot}
        subtitle={subtitle || undefined}
        leadingSlot={leadingSlot}
        onSettingsClick={() => router.push("/profile/settings")}
        settingsAriaLabel="Настройки профиля"
      />

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

      <div className="flex flex-col gap-3 px-4 py-4">
        {tab === "about" && (
          <AboutTab
            user={user}
            districtName={districtName}
            teams={teams}
            stats={stats}
          />
        )}
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
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="white"
      stroke="none"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );
}
