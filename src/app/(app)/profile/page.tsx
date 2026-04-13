"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSportLabel } from "@/app/(app)/profile/profileUtils";
import type { User } from "@/types/database";
import type {
  AvailabilityDay,
  PlayerProfilePayload,
  PlayerProfileUpdateInput,
  PlayerStatsSummary,
  ProfileTeamSummary,
} from "@/types/profile";

const weekdayLabels: Record<AvailabilityDay, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Вс",
};

const weekdayOrder: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const previewUser: User = {
  id: "preview-user",
  telegram_id: 0,
  name: "Артем Соколов",
  first_name: "Артем",
  last_name: "Соколов",
  photo_url: "https://i.pravatar.cc/600?img=12",
  city: "Белград / Врачар",
  age_group: "23 года / любители 18+",
  position: "Защитник",
  level: "Любительский",
  dominant_side: "Правая нога",
  preferred_format: "8x8",
  is_looking_for_team: true,
  available_for_one_off: true,
  available_for_substitutions: false,
  availability_days: ["tue", "thu", "sun"],
  primary_team_id: "team-1",
  bio: "Левый защитник. Люблю интенсивные матчи, дисциплину в обороне и команды, где все приходят вовремя.",
  sport: "football",
  onboarding_completed: true,
  created_at: new Date(0).toISOString(),
};

const previewStats: PlayerStatsSummary = {
  sport: "football",
  matchesPlayed: 48,
  goals: 6,
  assists: 11,
  saves: 0,
  cleanSheets: 14,
  averageRating: 7.4,
};

const previewPrimaryTeam: ProfileTeamSummary = {
  id: "team-1",
  name: "Vracar United",
  city: "Белград",
  sport: "football",
  description: "Вечерняя команда для игр 8x8 и 11x11",
  role: "player",
  teamRoleLabel: "Основной состав",
  joinedAt: new Date(2024, 1, 14).toISOString(),
  leftAt: null,
};

const previewCurrentTeams: ProfileTeamSummary[] = [
  {
    id: "team-2",
    name: "Danube Five",
    city: "Нови-Београд",
    sport: "football",
    description: "Собираемся по воскресеньям на короткие матчи",
    role: "player",
    teamRoleLabel: "Ротация",
    joinedAt: new Date(2025, 2, 3).toISOString(),
    leftAt: null,
  },
];

const previewPastTeams: ProfileTeamSummary[] = [
  {
    id: "team-3",
    name: "Old Town FC",
    city: "Белград",
    sport: "football",
    description: null,
    role: "player",
    teamRoleLabel: "Защитник",
    joinedAt: new Date(2022, 7, 10).toISOString(),
    leftAt: new Date(2024, 0, 20).toISOString(),
  },
];

const previewPayload: PlayerProfilePayload = {
  user: previewUser,
  stats: previewStats,
  primaryTeam: previewPrimaryTeam,
  currentTeams: previewCurrentTeams,
  pastTeams: previewPastTeams,
};

function getDisplayName(user: Pick<User, "name" | "first_name" | "last_name">) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.name;
}

function getInitials(user: Pick<User, "first_name" | "last_name" | "name">) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.name;

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "SP";
}

function createFallbackPayload(user: User): PlayerProfilePayload {
  return {
    user,
    stats: {
      sport: user.sport,
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      saves: 0,
      cleanSheets: 0,
      averageRating: null,
    },
    primaryTeam: null,
    currentTeams: [],
    pastTeams: [],
  };
}

function toFormState(payload: PlayerProfilePayload): PlayerProfileUpdateInput {
  return {
    firstName: payload.user.first_name ?? payload.user.name.split(" ")[0] ?? "",
    lastName: payload.user.last_name ?? payload.user.name.split(" ").slice(1).join(" "),
    sport: payload.user.sport ?? "football",
    position: payload.user.position ?? "",
    level: payload.user.level ?? "",
    dominantSide: payload.user.dominant_side ?? "",
    preferredFormat: payload.user.preferred_format ?? "",
    isLookingForTeam: payload.user.is_looking_for_team,
    availableForOneOff: payload.user.available_for_one_off,
    availableForSubstitutions: payload.user.available_for_substitutions,
    availabilityDays: payload.user.availability_days as AvailabilityDay[],
    city: payload.user.city ?? "",
    ageGroup: payload.user.age_group ?? "",
    bio: payload.user.bio ?? "",
    photoUrl: payload.user.photo_url ?? "",
    primaryTeamId:
      payload.primaryTeam?.id ??
      payload.user.primary_team_id ??
      payload.currentTeams[0]?.id ??
      null,
    teamRoleLabel:
      payload.primaryTeam?.teamRoleLabel ??
      payload.currentTeams[0]?.teamRoleLabel ??
      "",
  };
}

function formatAvailabilityDays(days: AvailabilityDay[]) {
  if (days.length === 0) return "По договоренности";
  return days.map((day) => weekdayLabels[day]).join(", ");
}

function getRoleInTeam(payload: PlayerProfilePayload) {
  return payload.primaryTeam?.teamRoleLabel || payload.currentTeams[0]?.teamRoleLabel || "Не указана";
}

function getStatsByPriority(position: string | null, stats: PlayerStatsSummary) {
  const normalizedPosition = position?.trim().toLowerCase() ?? "";

  if (normalizedPosition.includes("врат")) {
    return [
      { key: "matches", label: "Матчей", value: stats.matchesPlayed },
      { key: "saves", label: "Сейвов", value: stats.saves },
      { key: "cleanSheets", label: "Сухих", value: stats.cleanSheets },
      { key: "rating", label: "Рейтинг", value: stats.averageRating ? stats.averageRating.toFixed(1) : "—" },
    ];
  }

  if (
    normalizedPosition.includes("защит") ||
    normalizedPosition.includes("деф")
  ) {
    return [
      { key: "matches", label: "Матчей", value: stats.matchesPlayed },
      { key: "cleanSheets", label: "Сухих", value: stats.cleanSheets },
      { key: "assists", label: "Передач", value: stats.assists },
      { key: "rating", label: "Рейтинг", value: stats.averageRating ? stats.averageRating.toFixed(1) : "—" },
    ];
  }

  return [
    { key: "matches", label: "Матчей", value: stats.matchesPlayed },
    { key: "goals", label: "Голов", value: stats.goals },
    { key: "assists", label: "Передач", value: stats.assists },
    { key: "rating", label: "Рейтинг", value: stats.averageRating ? stats.averageRating.toFixed(1) : "—" },
  ];
}

function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData ?? "";
}

export default function ProfilePage() {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPreviewMode = auth.status === "unauthenticated";
  const authenticatedUserId = auth.status === "authenticated" ? auth.user.id : null;
  const authenticatedUserSnapshot = auth.status === "authenticated" ? auth.user : null;
  const updateAuthUser = auth.updateUser;
  const authenticatedFallbackPayload = useMemo(
    () => (authenticatedUserSnapshot ? createFallbackPayload(authenticatedUserSnapshot) : null),
    [authenticatedUserSnapshot]
  );

  const [profileData, setProfileData] = useState<PlayerProfilePayload>(previewPayload);
  const [form, setForm] = useState<PlayerProfileUpdateInput>(toFormState(previewPayload));
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      setProfileData(previewPayload);
      setForm(toFormState(previewPayload));
      return;
    }

    if (!authenticatedFallbackPayload) {
      return;
    }

    setProfileData(authenticatedFallbackPayload);
    setForm(toFormState(authenticatedFallbackPayload));
    setIsLoadingProfile(true);

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: getTelegramInitData() }),
        });

        if (!response.ok) {
          throw new Error("Profile fetch failed");
        }

        const payload = (await response.json()) as PlayerProfilePayload;
        setProfileData(payload);
        setForm(toFormState(payload));
      } catch {
        setError("Не удалось загрузить полный профиль");
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [auth.status, authenticatedFallbackPayload, authenticatedUserId]);

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background-dark">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const { user, stats, primaryTeam, currentTeams, pastTeams } = profileData;
  const displayName = getDisplayName(user);
  const positionLabel = user.position || "Позиция не указана";
  const heroStats = getStatsByPriority(user.position, stats);
  const allCurrentTeams = [primaryTeam, ...currentTeams].filter(Boolean) as ProfileTeamSummary[];
  const aboutText =
    user.bio ??
    "Пока без описания. Добавь пару фраз о своём стиле игры, дисциплине и том, что важно в команде.";

  function updateField<K extends keyof PlayerProfileUpdateInput>(
    key: K,
    value: PlayerProfileUpdateInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAvailabilityDay(day: AvailabilityDay) {
    setForm((current) => ({
      ...current,
      availabilityDays: current.availabilityDays.includes(day)
        ? current.availabilityDays.filter((currentDay) => currentDay !== day)
        : [...current.availabilityDays, day],
    }));
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("photoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setError("");
    setSuccess("");
    setIsSaving(true);

    if (isPreviewMode) {
      const nextPayload = buildPreviewPayloadFromForm(form, profileData);
      setProfileData(nextPayload);
      setForm(toFormState(nextPayload));
      setIsEditing(false);
      setIsSaving(false);
      setSuccess("Локальный preview обновлён");
      return;
    }

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getTelegramInitData(),
          updates: form,
        }),
      });

      if (!response.ok) {
        throw new Error("Profile save failed");
      }

      const payload = (await response.json()) as PlayerProfilePayload;
      setProfileData(payload);
      setForm(toFormState(payload));
      updateAuthUser(payload.user);
      setIsEditing(false);
      setSuccess("Профиль сохранён");
    } catch {
      setError("Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEditing() {
    setForm(toFormState(profileData));
    setIsEditing(false);
    setError("");
    setSuccess("");
  }

  function choosePrimaryTeam(teamId: string) {
    const selectedTeam = allCurrentTeams.find((team) => team.id === teamId);
    setForm((current) => ({
      ...current,
      primaryTeamId: teamId,
      teamRoleLabel: selectedTeam?.teamRoleLabel ?? current.teamRoleLabel,
    }));
  }

  const aboutClampStyle: CSSProperties | undefined = !isAboutExpanded
    ? {
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : undefined;

  return (
    <div className="flex flex-1 flex-col bg-background-dark text-foreground-on-dark">
      <div className="relative flex-1 overflow-y-auto px-6 pb-10 pt-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_right,rgba(77,94,35,0.34),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-28 h-64 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_32%)]" />

        <div className="relative mx-auto flex w-full max-w-xl flex-col gap-8">
          <section className="grid gap-5 border-b border-border-dark/70 pb-8">
            <div className="flex items-start gap-5">
              <div className="relative h-60 w-[10.5rem] shrink-0 overflow-hidden rounded-[30px] border border-border-dark bg-background-dark-elevated shadow-[0_24px_48px_rgba(0,0,0,0.34)]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.42)_100%)]" />
                {form.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(77,94,35,0.42)_0%,rgba(0,0,0,0.64)_100%)]">
                    <span className="font-display text-5xl font-bold uppercase text-foreground-on-dark">
                      {getInitials(user)}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-2">
                <p className="text-sm font-display uppercase tracking-[0.18em] text-foreground-on-dark-muted">
                  Профиль игрока
                </p>
                <h1 className="mt-2 text-4xl font-display font-bold uppercase leading-none break-words">
                  {displayName}
                </h1>
                <p className="mt-4 text-xl font-display uppercase tracking-wide text-primary">
                  {positionLabel}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {user.city && <MetaLine icon={<PinIcon />} text={user.city} />}
                  {user.age_group && <MetaLine icon={<AgeIcon />} text={user.age_group} />}
                  {user.sport && <MetaLine icon={<BallIcon />} text={getSportLabel(user.sport)} />}
                  {user.level && <MetaLine icon={<LevelIcon />} text={user.level} />}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    active={user.is_looking_for_team}
                    activeClassName="bg-status-success-soft text-status-success"
                    inactiveClassName="bg-status-muted-soft text-foreground-on-dark-muted"
                    label="Ищет команду"
                  />
                  <StatusBadge
                    active={user.available_for_one_off}
                    activeClassName="bg-status-info-soft text-status-info"
                    inactiveClassName="bg-status-muted-soft text-foreground-on-dark-muted"
                    label="Готов играть разово"
                  />
                  <StatusBadge
                    active={user.available_for_substitutions}
                    activeClassName="bg-status-warning-soft text-status-warning"
                    inactiveClassName="bg-status-muted-soft text-foreground-on-dark-muted"
                    label="Готов к заменам"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-3xl border border-border-dark bg-background-dark-elevated/80 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-wide text-foreground-on-dark-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-display font-semibold uppercase text-foreground-on-dark">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {isLoadingProfile && (
              <p className="text-sm text-foreground-on-dark-muted">
                Подтягиваем статистику и команды...
              </p>
            )}
          </section>

          <section className="grid gap-4">
            <SectionTitle
              eyebrow="Быстрый профиль"
              title="Подходит ли под ваш формат"
            />

            <div className="grid grid-cols-2 gap-3">
              <QuickFitCard icon={<BallIcon />} label="Вид спорта" value={getSportLabel(user.sport) || "—"} />
              <QuickFitCard icon={<PitchIcon />} label="Формат" value={user.preferred_format || "—"} />
              <QuickFitCard icon={<DominantSideIcon />} label="Ведущая сторона" value={user.dominant_side || "—"} />
              <QuickFitCard icon={<LevelIcon />} label="Уровень" value={user.level || "—"} />
              <QuickFitCard icon={<RoleIcon />} label="Роль в команде" value={getRoleInTeam(profileData)} />
              <QuickFitCard icon={<CalendarIcon />} label="Свободен">
                <AvailabilityWeek days={user.availability_days as AvailabilityDay[]} />
                <p className="mt-3 text-sm font-medium text-foreground-on-dark">
                  {formatAvailabilityDays(user.availability_days as AvailabilityDay[])}
                </p>
              </QuickFitCard>
            </div>
          </section>

          <section className="grid gap-4">
            <SectionTitle
              eyebrow="Игровой вес"
              title="Цифры, которые помогают доверять"
            />

            <div className="grid grid-cols-2 gap-3">
              {heroStats.map((stat, index) => (
                <ProofStatCard
                  key={stat.key}
                  accent={index === 0 ? "primary" : "neutral"}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <SectionTitle eyebrow="Команды" title="Текущий командный контур" />

            {primaryTeam ? (
              <TeamCard team={primaryTeam} variant="primary" title="Основная команда" />
            ) : (
              <MutedPanel>Основная команда пока не выбрана</MutedPanel>
            )}

            {currentTeams.length > 0 && (
              <div className="grid gap-3">
                <p className="text-sm uppercase tracking-wide text-foreground-on-dark-muted">
                  Сейчас играет
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentTeams.map((team) => (
                    <TeamCard key={team.id} team={team} variant="current" />
                  ))}
                </div>
              </div>
            )}

            {pastTeams.length > 0 && (
              <div className="grid gap-3">
                <p className="text-sm uppercase tracking-wide text-foreground-on-dark-muted">
                  Играл раньше
                </p>
                <div className="grid gap-2">
                  {pastTeams.map((team) => (
                    <TeamCard key={team.id} team={team} variant="past" />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-3">
            <SectionTitle eyebrow="О себе" title="Человеческий контекст" />
            <div className="border-l-2 border-primary pl-4">
              <p className="text-base leading-7 text-foreground-on-dark" style={aboutClampStyle}>
                {aboutText}
              </p>
              {aboutText.length > 160 && (
                <button
                  onClick={() => setIsAboutExpanded((current) => !current)}
                  className="mt-3 text-sm uppercase tracking-wide text-primary"
                >
                  {isAboutExpanded ? "Скрыть" : "Показать полностью"}
                </button>
              )}
            </div>
          </section>

          {!isEditing && (
            <div className="flex items-center justify-between gap-4 border-t border-border-dark/70 pt-2">
              <div className="flex items-center gap-2 text-sm text-foreground-on-dark-muted">
                <PhotoIcon />
                <span>{form.photoUrl ? "Фото профиля добавлено" : "Добавь фото для более сильной карточки"}</span>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="shrink-0 rounded-full bg-primary px-5 py-2 font-display text-sm font-semibold uppercase text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Редактировать
              </button>
            </div>
          )}

          {!isEditing ? (
            success ? <p className="text-sm text-primary">{success}</p> : null
          ) : (
            <>
              <div className="rounded-3xl border border-border-dark bg-background-dark-elevated/80 p-5">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-primary px-4 py-2 font-display text-sm font-semibold uppercase text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                      Загрузить фото
                    </button>
                    {form.photoUrl && (
                      <button
                        onClick={() => updateField("photoUrl", "")}
                        className="text-sm text-foreground-on-dark-muted underline underline-offset-4"
                      >
                        Удалить фото
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  <FormField label="Имя">
                    <DarkInput
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                      placeholder="Иван"
                    />
                  </FormField>

                  <FormField label="Фамилия">
                    <DarkInput
                      value={form.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                      placeholder="Иванов"
                    />
                  </FormField>

                  <FormField label="Вид спорта">
                    <DarkInput
                      value={form.sport}
                      onChange={(event) => updateField("sport", event.target.value)}
                      placeholder="football"
                    />
                  </FormField>

                  <FormField label="Позиция">
                    <DarkInput
                      value={form.position}
                      onChange={(event) => updateField("position", event.target.value)}
                      placeholder="Защитник"
                    />
                  </FormField>

                  <FormField label="Уровень">
                    <DarkInput
                      value={form.level}
                      onChange={(event) => updateField("level", event.target.value)}
                      placeholder="Любительский"
                    />
                  </FormField>

                  <FormField label="Ведущая рука или нога">
                    <DarkInput
                      value={form.dominantSide}
                      onChange={(event) => updateField("dominantSide", event.target.value)}
                      placeholder="Правая нога"
                    />
                  </FormField>

                  <FormField label="Предпочитаемый формат игры">
                    <DarkInput
                      value={form.preferredFormat}
                      onChange={(event) => updateField("preferredFormat", event.target.value)}
                      placeholder="8x8"
                    />
                  </FormField>

                  <FormField label="Статусы доступности">
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        active={form.isLookingForTeam}
                        label="Ищет команду"
                        colorClassName="data-[active=true]:bg-status-success-soft data-[active=true]:text-status-success"
                        onClick={() => updateField("isLookingForTeam", !form.isLookingForTeam)}
                      />
                      <ToggleChip
                        active={form.availableForOneOff}
                        label="Разово"
                        colorClassName="data-[active=true]:bg-status-info-soft data-[active=true]:text-status-info"
                        onClick={() => updateField("availableForOneOff", !form.availableForOneOff)}
                      />
                      <ToggleChip
                        active={form.availableForSubstitutions}
                        label="Замены"
                        colorClassName="data-[active=true]:bg-status-warning-soft data-[active=true]:text-status-warning"
                        onClick={() => updateField("availableForSubstitutions", !form.availableForSubstitutions)}
                      />
                    </div>
                  </FormField>

                  <FormField label="Свободные дни">
                    <div className="flex flex-wrap gap-2">
                      {weekdayOrder.map((day) => (
                        <ToggleChip
                          key={day}
                          active={form.availabilityDays.includes(day)}
                          label={weekdayLabels[day]}
                          colorClassName="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                          onClick={() => toggleAvailabilityDay(day)}
                        />
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Город или район">
                    <DarkInput
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      placeholder="Москва / Хамовники"
                    />
                  </FormField>

                  <FormField label="Возраст / группа">
                    <DarkInput
                      value={form.ageGroup}
                      onChange={(event) => updateField("ageGroup", event.target.value)}
                      placeholder="23 года / любители 18+"
                    />
                  </FormField>

                  {allCurrentTeams.length > 0 && (
                    <FormField label="Основная команда">
                      <div className="flex flex-wrap gap-2">
                        {allCurrentTeams.map((team) => (
                          <ToggleChip
                            key={team.id}
                            active={form.primaryTeamId === team.id}
                            label={team.name}
                            colorClassName="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                            onClick={() => choosePrimaryTeam(team.id)}
                          />
                        ))}
                      </div>
                    </FormField>
                  )}

                  <FormField label="Роль в команде">
                    <DarkInput
                      value={form.teamRoleLabel}
                      onChange={(event) => updateField("teamRoleLabel", event.target.value)}
                      placeholder="Основной состав"
                    />
                  </FormField>

                  <FormField label="Краткое описание">
                    <DarkTextarea
                      value={form.bio}
                      onChange={(event) => updateField("bio", event.target.value)}
                      rows={5}
                      placeholder="Расскажи, как ты играешь, что ищешь в команде и как относишься к тренировкам."
                    />
                  </FormField>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-primary">{success}</p>}

              <div className="flex gap-3">
                <button
                  onClick={cancelEditing}
                  className="flex-1 rounded-full border border-border-dark bg-background-dark-elevated px-6 py-3 font-display font-semibold uppercase text-foreground-on-dark transition-colors hover:border-primary"
                >
                  Отмена
                </button>
                <button
                  onClick={saveProfile}
                  disabled={!form.firstName.trim() || isSaving}
                  className="flex-1 rounded-full bg-primary px-6 py-3 font-display font-semibold uppercase text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSaving ? "Сохраняем..." : isPreviewMode ? "Применить" : "Сохранить"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPreviewPayloadFromForm(
  form: PlayerProfileUpdateInput,
  previous: PlayerProfilePayload
): PlayerProfilePayload {
  const allCurrentTeams = [previous.primaryTeam, ...previous.currentTeams].filter(Boolean) as ProfileTeamSummary[];
  const selectedPrimaryTeam = allCurrentTeams.find((team) => team.id === form.primaryTeamId) ?? null;
  const nextPrimaryTeam = selectedPrimaryTeam
    ? { ...selectedPrimaryTeam, teamRoleLabel: form.teamRoleLabel.trim() || selectedPrimaryTeam.teamRoleLabel }
    : null;
  const nextCurrentTeams = allCurrentTeams
    .filter((team) => team.id !== nextPrimaryTeam?.id)
    .map((team) =>
      team.id === form.primaryTeamId
        ? { ...team, teamRoleLabel: form.teamRoleLabel.trim() || team.teamRoleLabel }
        : team
    );

  return {
    ...previous,
    user: {
      ...previous.user,
      name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" "),
      first_name: form.firstName.trim() || null,
      last_name: form.lastName.trim() || null,
      sport: form.sport.trim() || null,
      position: form.position.trim() || null,
      level: form.level.trim() || null,
      dominant_side: form.dominantSide.trim() || null,
      preferred_format: form.preferredFormat.trim() || null,
      is_looking_for_team: form.isLookingForTeam,
      available_for_one_off: form.availableForOneOff,
      available_for_substitutions: form.availableForSubstitutions,
      availability_days: form.availabilityDays,
      city: form.city.trim() || null,
      age_group: form.ageGroup.trim() || null,
      bio: form.bio.trim() || null,
      photo_url: form.photoUrl || null,
      primary_team_id: form.primaryTeamId,
    },
    primaryTeam: nextPrimaryTeam,
    currentTeams: nextCurrentTeams,
  };
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-sm font-display uppercase tracking-[0.18em] text-foreground-on-dark-muted">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-display font-semibold uppercase text-foreground-on-dark">
        {title}
      </h2>
    </div>
  );
}

function StatusBadge({
  active,
  activeClassName,
  inactiveClassName,
  label,
}: {
  active: boolean;
  activeClassName: string;
  inactiveClassName: string;
  label: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-display uppercase tracking-wide ${
        active ? activeClassName : inactiveClassName
      }`}
    >
      {label}
    </span>
  );
}

function QuickFitCard({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border-dark bg-background-dark-elevated/75 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-on-dark-muted">
            {label}
          </p>
          {value && (
            <p className="mt-2 text-lg font-medium text-foreground-on-dark">
              {value}
            </p>
          )}
          {children}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProofStatCard({
  accent,
  label,
  value,
}: {
  accent: "primary" | "neutral";
  label: string;
  value: string | number;
}) {
  return (
    <div
      className={`rounded-[28px] border px-4 py-5 ${
        accent === "primary"
          ? "border-primary/50 bg-primary/10"
          : "border-border-dark bg-background-dark-elevated/70"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-foreground-on-dark-muted">
        {label}
      </p>
      <p className="mt-2 text-4xl font-display font-semibold uppercase text-foreground-on-dark">
        {value}
      </p>
    </div>
  );
}

function TeamCard({
  team,
  variant,
  title,
}: {
  team: ProfileTeamSummary;
  variant: "primary" | "current" | "past";
  title?: string;
}) {
  const variantClassName =
    variant === "primary"
      ? "border-primary/50 bg-primary/10"
      : variant === "current"
        ? "border-border-dark bg-background-dark-elevated/70"
        : "border-border-dark/70 bg-background-dark/70";

  return (
    <div className={`rounded-3xl border px-4 py-4 ${variantClassName}`}>
      {title && (
        <p className="mb-3 text-xs uppercase tracking-wide text-foreground-on-dark-muted">
          {title}
        </p>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background-dark-elevated text-lg font-display font-semibold uppercase text-foreground-on-dark">
          {team.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-display font-semibold uppercase text-foreground-on-dark">
            {team.name}
          </p>
          <p className="mt-1 text-sm text-foreground-on-dark-muted">
            {team.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-wide text-foreground-on-dark">
              {getSportLabel(team.sport)}
            </span>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-wide text-foreground-on-dark">
              {team.teamRoleLabel || (team.role === "organizer" ? "Организатор" : "Игрок")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MutedPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border-dark px-4 py-4 text-sm text-foreground-on-dark-muted">
      {children}
    </div>
  );
}

function MetaLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground-on-dark-muted">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function AvailabilityWeek({ days }: { days: AvailabilityDay[] }) {
  return (
    <div className="mt-3 flex gap-1.5">
      {weekdayOrder.map((day) => {
        const active = days.includes(day);

        return (
          <div
            key={day}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-background-dark text-foreground-on-dark-muted"
            }`}
          >
            {weekdayLabels[day]}
          </div>
        );
      })}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-foreground-on-dark-muted">{label}</span>
      {children}
    </label>
  );
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-2xl border border-border-dark bg-background-dark px-4 py-3 text-foreground-on-dark outline-none transition-colors focus:border-primary"
    />
  );
}

function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="resize-none rounded-2xl border border-border-dark bg-background-dark px-4 py-3 text-foreground-on-dark outline-none transition-colors focus:border-primary"
    />
  );
}

function ToggleChip({
  active,
  label,
  colorClassName,
  onClick,
}: {
  active: boolean;
  label: string;
  colorClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className={`rounded-full border border-border-dark px-3 py-1.5 text-sm transition-colors ${
        active
          ? colorClassName
          : "bg-background-dark text-foreground-on-dark-muted"
      }`}
    >
      {label}
    </button>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function AgeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 8 3-2 3 2-.5 3h-5L9 8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8 15 2.5-2h3L16 15l-1 3h-6l-1-3Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 16h4v4H4v-4Zm6-6h4v10h-4V10Zm6-4h4v14h-4V6Z" fill="currentColor" />
    </svg>
  );
}

function PitchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 5v14M3 12h18" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function DominantSideIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 5c1.3 0 2.3.5 3 1.4.7.8 1 2 1 3.4v1.7l4.6 1.2c1 .3 1.7 1.2 1.7 2.3 0 1.3-1 2.3-2.3 2.3h-2.2l-2.9 3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 18.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 4 7v5c0 5.2 3.4 8.7 8 10 4.6-1.3 8-4.8 8-10V7l-8-4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9.5 12 1.7 1.7L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m21 16-4.5-4.5L7 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
