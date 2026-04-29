"use client";

import { useEffect, useMemo, useState } from "react";
import { SheetChipGroup, type ChipOption } from "@/components/ui";

export type PlayerFilters = {
  city: string;
  districtId: string;
  lookingForTeam: boolean;
};

type Props = {
  open: boolean;
  initial: PlayerFilters;
  onClose: () => void;
  onApply: (filters: PlayerFilters) => void;
};

const CITIES: ChipOption[] = [{ value: "Алматы", label: "Алматы" }];

type District = { id: string; name: string };

export function PlayerFiltersSheet({ open, initial, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<PlayerFilters>(initial);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (open) setFilters(initial);
  }, [open, initial]);

  const districtCity = filters.city || (CITIES.length === 1 ? CITIES[0].value : "");

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
      lookingForTeam: false,
    });
  }

  function apply() {
    onApply(filters);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white p-5 max-h-[85vh] overflow-y-auto"
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

          <button
            type="button"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                lookingForTeam: !f.lookingForTeam,
              }))
            }
            className="flex items-center justify-between rounded-[14px] px-4 py-3 transition-colors w-full"
            style={{
              background: filters.lookingForTeam
                ? "var(--green-50)"
                : "var(--bg-secondary)",
              border: filters.lookingForTeam
                ? "1.5px solid var(--green-500)"
                : "1.5px solid transparent",
            }}
          >
            <div className="flex flex-col items-start">
              <span
                className="text-[14px] font-semibold"
                style={{
                  color: filters.lookingForTeam
                    ? "var(--green-700)"
                    : "var(--text-primary)",
                }}
              >
                Ищет команду
              </span>
              <span
                className="text-[12px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Только игроки, открытые к новым командам
              </span>
            </div>
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: filters.lookingForTeam
                  ? "var(--green-500)"
                  : "transparent",
                border: filters.lookingForTeam
                  ? "none"
                  : "1.5px solid var(--gray-300)",
              }}
            >
              {filters.lookingForTeam && <CheckIcon />}
            </span>
          </button>
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

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
