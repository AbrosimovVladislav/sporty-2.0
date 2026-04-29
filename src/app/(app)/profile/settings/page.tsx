"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";
import DistrictSelect from "@/components/DistrictSelect";
import { Button, BottomActionBar, SheetChipGroup } from "@/components/ui";
import { POSITIONS, SKILL_LEVELS } from "@/lib/catalogs";
import { useCity, KZ_CITIES } from "@/lib/city-context";
import type { User } from "@/types/database";

const PREFERRED_TIME_PRESETS = [
  "Утром",
  "Днём",
  "Вечером",
  "Выходные",
];

export default function ProfileSettingsPage() {
  const auth = useAuth();
  const router = useRouter();

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

  return <SettingsContent initialUser={auth.user} onSaved={() => router.push("/profile")} />;
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
    (initialUser.position ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [skillLevel, setSkillLevel] = useState(initialUser.skill_level ?? "");
  const [preferredTime, setPreferredTime] = useState(initialUser.preferred_time ?? "");
  const [birthDate, setBirthDate] = useState(initialUser.birth_date ?? "");
  const [city, setCity] = useState(activeCity || initialUser.city || "");
  const [districtId, setDistrictId] = useState(initialUser.district_id ?? "");
  const [lookingForTeam, setLookingForTeam] = useState(initialUser.looking_for_team);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${initialUser.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setDistrictId(d.user.district_id ?? "");
        }
      })
      .catch(() => {});
  }, [initialUser.id]);

  function togglePosition(pos: string) {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          position: positions.length > 0 ? positions.join(", ") : null,
          skill_level: skillLevel || null,
          preferred_time: preferredTime.trim() || null,
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
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ background: "var(--bg-primary)" }}
      >
        <BackButton fallbackHref="/profile" />
        <h1
          className="text-[22px] font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Настройки
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4 pb-28">
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
                    border: active ? "1.5px solid var(--gray-900)" : "1.5px solid var(--gray-200)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

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
              background: "var(--bg-card)",
              border: "1.5px solid var(--gray-200)",
              color: "var(--text-primary)",
            }}
          />
          <FieldHint>{bio.length} / 500</FieldHint>
        </Section>

        <Section>
          <FieldLabel>На поле</FieldLabel>
          <FieldHint>Можно выбрать несколько</FieldHint>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {positionOptions.map((pos) => {
              const active = positions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--gray-900)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    border: active
                      ? "1.5px solid var(--gray-900)"
                      : "1.5px solid var(--gray-200)",
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
          <FieldLabel>Время тренировок</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {PREFERRED_TIME_PRESETS.map((preset) => {
              const active = preferredTime === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setPreferredTime(active ? "" : preset)
                  }
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--gray-900)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    border: active
                      ? "1.5px solid var(--gray-900)"
                      : "1.5px solid var(--gray-200)",
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            placeholder="Или своё описание…"
            className="w-full mt-2 rounded-[12px] px-3.5 py-3 text-[15px] outline-none transition-colors"
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--gray-200)",
              color: "var(--text-primary)",
            }}
          />
        </Section>

        <Section>
          <FieldLabel>Дата рождения</FieldLabel>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-[12px] px-3.5 py-3 text-[15px] outline-none transition-colors"
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--gray-200)",
              color: "var(--text-primary)",
            }}
          />
        </Section>

        <button
          type="button"
          onClick={() => setLookingForTeam((v) => !v)}
          className="flex items-center justify-between w-full rounded-[16px] px-4 py-3.5 transition-colors"
          style={{
            background: "var(--bg-primary)",
            border: lookingForTeam
              ? "1.5px solid var(--green-500)"
              : "1.5px solid var(--gray-200)",
          }}
        >
          <div className="text-left flex-1">
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Ищу команду
            </p>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
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
                ? "var(--green-500)"
                : "var(--gray-300)",
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
