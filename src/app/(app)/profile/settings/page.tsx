"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";
import DistrictPicker from "@/components/DistrictPicker";
import {
  Button,
  BottomActionBar,
  CityPickerSheet,
  SheetChipGroup,
} from "@/components/ui";
import { POSITIONS, SKILL_LEVELS } from "@/lib/catalogs";
import { useCity, KZ_CITIES } from "@/lib/city-context";
import { ratingTier, type RatingTier } from "@/lib/ratingTier";
import type { User } from "@/types/database";

const TIER_LABEL: Record<RatingTier, string> = {
  elite: "Элитный",
  high: "Продвинутый",
  mid: "Средний",
  low: "Любитель",
  poor: "Новичок",
};

export default function ProfileSettingsPage() {
  const auth = useAuth();
  const router = useRouter();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--green-700)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }
  if (auth.status !== "authenticated") return null;

  return (
    <SettingsContent
      initialUser={auth.user}
      onSaved={() => router.push("/profile")}
    />
  );
}

function SettingsContent({
  initialUser,
  onSaved,
}: {
  initialUser: User;
  onSaved: () => void;
}) {
  const { activeCity, setActiveCity } = useCity();
  const [user, setUser] = useState(initialUser);
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [positions, setPositions] = useState<string[]>(
    initialUser.position ?? [],
  );
  const [skillLevel, setSkillLevel] = useState(initialUser.skill_level ?? "");
  const [rating, setRating] = useState<string>(
    initialUser.rating != null ? String(initialUser.rating) : "",
  );
  const [birthDate, setBirthDate] = useState(initialUser.birth_date ?? "");
  const [city, setCity] = useState(activeCity || initialUser.city || "");
  const [districtId, setDistrictId] = useState(initialUser.district_id ?? "");
  const [lookingForTeam, setLookingForTeam] = useState(
    initialUser.looking_for_team,
  );
  const [cityOpen, setCityOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${initialUser.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setDistrictId(d.user.district_id ?? "");
          setPositions(d.user.position ?? []);
          setRating(d.user.rating != null ? String(d.user.rating) : "");
        }
      })
      .catch(() => {});
  }, [initialUser.id]);

  function togglePosition(pos: string) {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  const ratingNum = rating === "" ? null : Number(rating);
  const ratingValid =
    ratingNum === null ||
    (Number.isInteger(ratingNum) && ratingNum >= 0 && ratingNum <= 100);
  const tier = ratingTier(ratingNum);

  async function handleSave() {
    if (!ratingValid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          position: positions.length > 0 ? positions : null,
          skill_level: skillLevel || null,
          rating: ratingNum,
          birth_date: birthDate || null,
          city: city || null,
          district_id: districtId || null,
          looking_for_team: lookingForTeam,
        }),
      });
      if (res.ok) {
        if (city && city !== activeCity) setActiveCity(city);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  const skillOptions = SKILL_LEVELS.map((s) => ({ value: s, label: s }));
  const positionOptions = POSITIONS["football"];

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-4 pb-3"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--ink-100)",
        }}
      >
        <BackButton fallbackHref="/profile" />
        <h1
          className="text-[20px] font-bold leading-tight"
          style={{ color: "var(--ink-900)" }}
        >
          Настройки профиля
        </h1>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4 pb-28">
        <Section>
          <FieldLabel>Город</FieldLabel>
          <DropdownTrigger
            label={city || "Выберите город"}
            isPlaceholder={!city}
            onClick={() => setCityOpen(true)}
          />
          {city && (
            <>
              <FieldLabel className="mt-3">Район</FieldLabel>
              <DistrictPicker
                city={city}
                value={districtId}
                onChange={setDistrictId}
              />
            </>
          )}
        </Section>

        <Section>
          <FieldLabel>О себе</FieldLabel>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Игровой стиль, опыт, цели…"
            rows={4}
            maxLength={500}
            className="w-full rounded-[12px] px-3.5 py-3 text-[15px] resize-none transition-colors outline-none"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--ink-200)",
              color: "var(--ink-900)",
            }}
          />
          <FieldHint>{bio.length} / 500</FieldHint>
        </Section>

        <Section>
          <FieldLabel>На поле</FieldLabel>
          <FieldHint>Можно выбрать несколько</FieldHint>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {positionOptions.map((pos) => {
              const active = positions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--ink-900)" : "var(--bg-secondary)",
                    color: active ? "white" : "var(--ink-700)",
                    border: active
                      ? "1px solid var(--ink-900)"
                      : "1px solid var(--ink-200)",
                  }}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </Section>

        <Section>
          <SheetChipGroup
            label="Уровень"
            options={skillOptions}
            value={skillLevel}
            onChange={setSkillLevel}
            emptyLabel="Не выбран"
          />
        </Section>

        <Section>
          <FieldLabel>Рейтинг</FieldLabel>
          <FieldHint>Целое число от 0 до 100. Можно оставить пустым.</FieldHint>
          <div className="flex items-center gap-2.5 mt-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={rating}
              onChange={(e) => setRating(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="—"
              className="flex-1 rounded-[12px] px-3.5 h-[46px] text-[15px] outline-none transition-colors tabular-nums"
              style={{
                background: "var(--bg-secondary)",
                border: ratingValid
                  ? "1px solid var(--ink-200)"
                  : "1px solid var(--danger)",
                color: "var(--ink-900)",
              }}
            />
            {tier && (
              <span
                className="inline-flex items-center justify-center px-3.5 h-[46px] rounded-[12px] text-[14px] font-semibold whitespace-nowrap"
                style={{
                  background: `var(--rating-${tier}-track)`,
                  color: `var(--rating-${tier}-text)`,
                }}
              >
                {TIER_LABEL[tier]}
              </span>
            )}
          </div>
          {!ratingValid && (
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--danger)" }}
            >
              Рейтинг должен быть целым числом от 0 до 100
            </p>
          )}
        </Section>

        <Section>
          <FieldLabel>Дата рождения</FieldLabel>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-[12px] px-3.5 h-[46px] text-[15px] outline-none transition-colors mt-1"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--ink-200)",
              color: "var(--ink-900)",
            }}
          />
        </Section>

        <button
          type="button"
          onClick={() => setLookingForTeam((v) => !v)}
          className="flex items-center justify-between w-full rounded-[16px] px-4 py-3.5 transition-colors"
          style={{
            background: "var(--card)",
            boxShadow: "var(--shadow-sm)",
            border: lookingForTeam
              ? "1.5px solid var(--green-700)"
              : "1.5px solid transparent",
          }}
        >
          <div className="text-left flex-1">
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--ink-900)" }}
            >
              Ищу команду
            </p>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: "var(--ink-500)" }}
            >
              {lookingForTeam
                ? "Видим в каталоге игроков"
                : "Скрыт из каталога"}
            </p>
          </div>
          <div
            className="relative w-11 h-6 rounded-full transition-colors shrink-0"
            style={{
              background: lookingForTeam
                ? "var(--green-700)"
                : "var(--ink-300)",
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
              style={{
                transform: lookingForTeam
                  ? "translateX(24px)"
                  : "translateX(4px)",
              }}
            />
          </div>
        </button>
      </div>

      <BottomActionBar>
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          disabled={!ratingValid}
          className="w-full"
          onClick={handleSave}
        >
          Сохранить
        </Button>
      </BottomActionBar>

      <CityPickerSheet
        open={cityOpen}
        cities={KZ_CITIES}
        value={city}
        onClose={() => setCityOpen(false)}
        onSelect={(c) => {
          setCity(c);
          setDistrictId("");
        }}
      />
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] p-4 flex flex-col gap-2"
      style={{
        background: "var(--card)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`text-[11px] font-semibold uppercase ${className}`}
      style={{
        letterSpacing: "0.06em",
        color: "var(--ink-500)",
      }}
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px]" style={{ color: "var(--ink-400)" }}>
      {children}
    </p>
  );
}

function DropdownTrigger({
  label,
  isPlaceholder,
  onClick,
}: {
  label: string;
  isPlaceholder: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-[12px] px-3.5 h-[46px] text-[15px] transition-colors outline-none"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--ink-200)",
        color: isPlaceholder ? "var(--ink-400)" : "var(--ink-900)",
      }}
    >
      <span className="truncate text-left font-medium">{label}</span>
      <ChevronDownIcon />
    </button>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-400)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
