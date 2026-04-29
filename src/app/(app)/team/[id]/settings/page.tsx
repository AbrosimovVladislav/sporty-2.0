"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { useTeamUI } from "../team-ui-context";
import BackButton from "@/components/BackButton";
import DistrictSelect from "@/components/DistrictSelect";
import { Button, BottomActionBar } from "@/components/ui";
import { SPORT_LABEL } from "@/lib/catalogs";
import { KZ_CITIES } from "@/lib/city-context";
import { teamGradient } from "@/lib/format";

const SPORT_OPTIONS = Object.keys(SPORT_LABEL);

export default function TeamSettingsPage() {
  const team = useTeam();
  const auth = useAuth();
  const router = useRouter();

  if (team.status === "loading" || auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (team.status !== "ready" || auth.status !== "authenticated") return null;

  if (team.role !== "organizer") {
    router.replace(`/team/${team.team.id}`);
    return null;
  }

  return <SettingsContent />;
}

function SettingsContent() {
  const team = useTeam();
  const auth = useAuth();
  const ui = useTeamUI();
  const router = useRouter();

  if (team.status !== "ready" || auth.status !== "authenticated") return null;

  const t = team.team;
  const userId = auth.user.id;
  const reloadTeam = team.reload;

  const [name, setName] = useState(t.name);
  const [sport, setSport] = useState(t.sport);
  const [city, setCity] = useState(t.city);
  const [districtId, setDistrictId] = useState(t.district_id ?? "");
  const [description, setDescription] = useState(t.description ?? "");
  const [lookingForPlayers, setLookingForPlayers] = useState(t.looking_for_players);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [savingToggle, setSavingToggle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!logoError) return;
    const timer = setTimeout(() => setLogoError(null), 3000);
    return () => clearTimeout(timer);
  }, [logoError]);

  useEffect(() => {
    if (!saveError) return;
    const timer = setTimeout(() => setSaveError(null), 3000);
    return () => clearTimeout(timer);
  }, [saveError]);

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      const res = await fetch(`/api/teams/${t.id}/logo`, { method: "POST", body: fd });
      if (res.ok) {
        reloadTeam();
      } else {
        const data = await res.json().catch(() => ({}));
        setLogoError(data.error ?? "Не удалось загрузить");
      }
    } catch {
      setLogoError("Сеть недоступна");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleToggleLooking() {
    if (savingToggle) return;
    const next = !lookingForPlayers;
    setSavingToggle(true);
    try {
      const res = await fetch(`/api/teams/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, looking_for_players: next }),
      });
      if (res.ok) {
        setLookingForPlayers(next);
        reloadTeam();
      }
    } finally {
      setSavingToggle(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/teams/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          sport,
          city,
          district_id: districtId || null,
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        reloadTeam();
        router.push(`/team/${t.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Не удалось сохранить");
      }
    } catch {
      setSaveError("Сеть недоступна");
    } finally {
      setSaving(false);
    }
  }

  const initial = t.name.trim().charAt(0).toUpperCase() || "?";
  const pendingCount = team.pendingRequestsCount;
  const canSave =
    name.trim().length > 0 &&
    !!sport &&
    !!city &&
    !saving;

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ background: "var(--bg-primary)" }}
      >
        <BackButton fallbackHref={`/team/${t.id}`} />
        <h1
          className="text-[22px] font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Настройки команды
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4 pb-28">
        {/* Logo */}
        <Section>
          <FieldLabel>Логотип</FieldLabel>
          <div className="flex items-center gap-4 mt-1">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: t.logo_url ? "white" : teamGradient(t.id),
                  border: "2px solid var(--gray-200)",
                  opacity: logoUploading ? 0.6 : 1,
                }}
              >
                {t.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-[34px] font-bold text-white leading-none">
                    {initial}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                JPG, PNG, WebP до 2 МБ
              </p>
              <label
                htmlFor="team-logo-upload"
                className="inline-flex items-center mt-2 px-4 h-9 rounded-full text-[13px] font-semibold cursor-pointer"
                style={{
                  background: "var(--gray-100)",
                  color: "var(--text-primary)",
                }}
              >
                {logoUploading ? "Загрузка…" : t.logo_url ? "Сменить" : "Загрузить"}
              </label>
              <input
                id="team-logo-upload"
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={logoUploading}
                onChange={handleLogoFile}
              />
            </div>
          </div>
          {logoError && (
            <p
              className="text-[12px] mt-2"
              style={{ color: "#E53935" }}
            >
              {logoError}
            </p>
          )}
        </Section>

        {/* Looking for players toggle */}
        <button
          type="button"
          onClick={handleToggleLooking}
          disabled={savingToggle}
          className="flex items-center justify-between w-full rounded-[16px] px-4 py-3.5 transition-colors disabled:opacity-50"
          style={{
            background: "var(--bg-primary)",
            border: lookingForPlayers
              ? "1.5px solid var(--green-500)"
              : "1.5px solid var(--gray-200)",
          }}
        >
          <div className="text-left flex-1">
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Ищем игроков
            </p>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {lookingForPlayers
                ? "Команда видна в каталоге"
                : "Команда скрыта из каталога"}
            </p>
          </div>
          <div
            className="relative w-11 h-6 rounded-full transition-colors shrink-0"
            style={{
              background: lookingForPlayers
                ? "var(--green-500)"
                : "var(--gray-300)",
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
              style={{
                transform: lookingForPlayers
                  ? "translateX(24px)"
                  : "translateX(4px)",
              }}
            />
          </div>
        </button>

        {/* Requests */}
        <button
          type="button"
          onClick={ui.openRequests}
          className="flex items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-colors active:bg-bg-card"
          style={{
            background: "var(--bg-primary)",
            border: "1.5px solid var(--gray-200)",
          }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: pendingCount > 0 ? "var(--green-500)" : "var(--gray-100)",
              color: pendingCount > 0 ? "white" : "var(--text-secondary)",
            }}
          >
            <BellIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Заявки и приглашения
            </p>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {pendingCount > 0
                ? `Входящих · ${pendingCount}`
                : "Открыть список"}
            </p>
          </div>
          <ChevronRight />
        </button>

        {/* Name */}
        <Section>
          <FieldLabel>Название</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded-[12px] px-3.5 py-3 text-[15px] outline-none transition-colors"
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--gray-200)",
              color: "var(--text-primary)",
            }}
          />
        </Section>

        {/* Sport */}
        <Section>
          <FieldLabel>Спорт</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {SPORT_OPTIONS.map((s) => {
              const active = sport === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSport(s)}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--gray-900)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    border: active
                      ? "1.5px solid var(--gray-900)"
                      : "1.5px solid var(--gray-200)",
                  }}
                >
                  {SPORT_LABEL[s]}
                </button>
              );
            })}
          </div>
        </Section>

        {/* City */}
        <Section>
          <FieldLabel>Город</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {KZ_CITIES.map((c) => {
              const active = city === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCity(c);
                    setDistrictId("");
                  }}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--gray-900)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    border: active
                      ? "1.5px solid var(--gray-900)"
                      : "1.5px solid var(--gray-200)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

        {/* District */}
        {city && (
          <Section>
            <FieldLabel>Район</FieldLabel>
            <DistrictSelect
              city={city}
              value={districtId}
              onChange={setDistrictId}
              className="w-full rounded-[12px] px-3.5 py-3 text-[15px] outline-none appearance-none"
            />
          </Section>
        )}

        {/* Description */}
        <Section>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Расскажите о команде…"
            rows={4}
            maxLength={500}
            className="w-full rounded-[12px] px-3.5 py-3 text-[15px] resize-none transition-colors outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--gray-200)",
              color: "var(--text-primary)",
            }}
          />
          <FieldHint>{description.length} / 500</FieldHint>
        </Section>

        {saveError && (
          <div
            className="px-3 py-2 rounded-xl text-[13px] text-center"
            style={{ background: "#FFF1F1", color: "#E53935" }}
          >
            {saveError}
          </div>
        )}
      </div>

      <BottomActionBar>
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          disabled={!canSave}
          className="w-full"
          onClick={handleSave}
        >
          Сохранить
        </Button>
      </BottomActionBar>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] p-4 flex flex-col gap-2"
      style={{ background: "var(--bg-primary)" }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="text-[12px] font-semibold uppercase"
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
      {children}
    </p>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-tertiary)" }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
