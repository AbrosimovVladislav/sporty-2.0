"use client";

import { useEffect, useMemo, useState } from "react";
import { SheetChipGroup, type ChipOption } from "@/components/ui";

export type DatePreset =
  | ""
  | "today"
  | "this_week"
  | "next_week"
  | "two_weeks";

export type EventFilters = {
  city: string;
  districtId: string;
  type: string;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  priceMax: string;
  hasSpots: boolean;
};

type Props = {
  open: boolean;
  initial: EventFilters;
  onClose: () => void;
  onApply: (filters: EventFilters) => void;
};

const CITIES: ChipOption[] = [{ value: "Алматы", label: "Алматы" }];

const DATE_PRESETS: ChipOption[] = [
  { value: "today", label: "Сегодня" },
  { value: "this_week", label: "На этой неделе" },
  { value: "next_week", label: "На следующей" },
  { value: "two_weeks", label: "На 2 недели" },
];

const PRICE_PRESETS: ChipOption[] = [
  { value: "0", label: "Бесплатно" },
  { value: "1000", label: "До 1 000 ₸" },
  { value: "2000", label: "До 2 000 ₸" },
  { value: "3000", label: "До 3 000 ₸" },
];

type District = { id: string; name: string };

export function EventFiltersSheet({ open, initial, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<EventFilters>(initial);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (open) setFilters(initial);
  }, [open, initial]);

  const districtCity =
    filters.city || (CITIES.length === 1 ? CITIES[0].value : "");

  useEffect(() => {
    if (!open) return;
    if (!districtCity) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/districts?city=${encodeURIComponent(districtCity)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDistricts(d.districts ?? []);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, districtCity]);

  const districtOptions = useMemo<ChipOption[]>(
    () => districts.map((d) => ({ value: d.id, label: d.name })),
    [districts],
  );

  if (!open) return null;

  function reset() {
    setFilters({
      city: "",
      districtId: "",
      type: "",
      datePreset: "",
      dateFrom: "",
      dateTo: "",
      priceMax: "",
      hasSpots: false,
    });
  }

  function apply() {
    onApply(filters);
    onClose();
  }

  function setDatePreset(preset: DatePreset) {
    setFilters((f) => ({
      ...f,
      datePreset: preset,
      dateFrom: "",
      dateTo: "",
    }));
  }

  function setDateFrom(value: string) {
    setFilters((f) => ({ ...f, dateFrom: value, datePreset: "" }));
  }

  function setDateTo(value: string) {
    setFilters((f) => ({ ...f, dateTo: value, datePreset: "" }));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white p-5 max-h-[88vh] overflow-y-auto"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4"
          style={{ background: "var(--gray-300)" }}
        />
        <h2
          className="text-[18px] font-bold mb-5"
          style={{ color: "var(--text-primary)" }}
        >
          Фильтры
        </h2>

        <div className="flex flex-col gap-5">
          {CITIES.length > 1 && (
            <SheetChipGroup
              label="Город"
              options={CITIES}
              value={filters.city}
              onChange={(c) =>
                setFilters((f) => ({ ...f, city: c, districtId: "" }))
              }
            />
          )}

          <SheetChipGroup
            label="Район"
            options={districtOptions}
            value={filters.districtId}
            onChange={(d) => setFilters((f) => ({ ...f, districtId: d }))}
            emptyHint="Сначала выбери город"
          />

          <div className="flex flex-col gap-2">
            <span
              className="text-[12px] font-semibold uppercase"
              style={{
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
              }}
            >
              Период
            </span>
            <div className="flex flex-wrap gap-1.5">
              <PresetChip
                active={
                  !filters.datePreset && !filters.dateFrom && !filters.dateTo
                }
                onClick={() => setDatePreset("")}
              >
                Любой
              </PresetChip>
              {DATE_PRESETS.map((p) => (
                <PresetChip
                  key={p.value}
                  active={filters.datePreset === p.value}
                  onClick={() => setDatePreset(p.value as DatePreset)}
                >
                  {p.label}
                </PresetChip>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <DateInput
                label="От"
                value={filters.dateFrom}
                onChange={setDateFrom}
              />
              <DateInput
                label="До"
                value={filters.dateTo}
                onChange={setDateTo}
              />
            </div>
          </div>

          <SheetChipGroup
            label="Цена"
            options={PRICE_PRESETS}
            value={filters.priceMax}
            onChange={(v) => setFilters((f) => ({ ...f, priceMax: v }))}
          />

          <ToggleRow
            label="Только со свободными местами"
            checked={filters.hasSpots}
            onChange={(v) => setFilters((f) => ({ ...f, hasSpots: v }))}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={reset}
            className="flex-1 py-3 rounded-[14px] text-[14px] font-semibold"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 py-3 rounded-[14px] text-[14px] font-bold"
            style={{ background: "var(--green-500)", color: "white" }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
      style={{
        background: active ? "var(--gray-900)" : "var(--bg-card)",
        color: active ? "white" : "var(--text-secondary)",
        border: active
          ? "1.5px solid var(--gray-900)"
          : "1.5px solid var(--gray-200)",
      }}
    >
      {children}
    </button>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className="flex-1 flex flex-col gap-1 rounded-[12px] px-3 py-2"
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--gray-200)",
      }}
    >
      <span
        className="text-[10px] uppercase font-semibold"
        style={{
          letterSpacing: "0.06em",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[14px] outline-none w-full"
        style={{ color: "var(--text-primary)" }}
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-[14px] px-4 py-3 text-left"
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--gray-200)",
      }}
    >
      <span
        className="text-[14px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </span>
      <span
        className="w-[42px] h-[24px] rounded-full relative transition-colors"
        style={{
          background: checked ? "var(--green-500)" : "var(--gray-300)",
        }}
      >
        <span
          className="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-transform"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(2px)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </span>
    </button>
  );
}
