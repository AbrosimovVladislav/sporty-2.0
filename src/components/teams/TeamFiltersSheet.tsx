"use client";

import { useEffect, useState } from "react";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { SPORT_LABEL } from "@/lib/catalogs";

export type TeamFilters = {
  city: string;
  districtId: string;
  sport: string;
  lookingForPlayers: boolean;
};

type Props = {
  open: boolean;
  initial: TeamFilters;
  onClose: () => void;
  onApply: (filters: TeamFilters) => void;
};

const SHEET_INPUT_CLASS =
  "w-full px-4 py-3 text-[14px] rounded-[14px] outline-none bg-background-muted text-foreground border border-transparent focus:border-primary transition-colors";

const SPORT_OPTIONS = Object.keys(SPORT_LABEL);

export function TeamFiltersSheet({ open, initial, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<TeamFilters>(initial);

  useEffect(() => {
    if (open) setFilters(initial);
  }, [open, initial]);

  if (!open) return null;

  function reset() {
    setFilters({
      city: "",
      districtId: "",
      sport: "",
      lookingForPlayers: false,
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

        <div className="flex flex-col gap-4">
          <Field label="Город">
            <CitySelect
              value={filters.city}
              onChange={(c) =>
                setFilters((f) => ({ ...f, city: c, districtId: "" }))
              }
              className={SHEET_INPUT_CLASS}
            />
          </Field>

          {filters.city && (
            <Field label="Район">
              <DistrictSelect
                city={filters.city}
                value={filters.districtId}
                onChange={(d) => setFilters((f) => ({ ...f, districtId: d }))}
                className={SHEET_INPUT_CLASS}
              />
            </Field>
          )}

          {SPORT_OPTIONS.length > 1 && (
            <Field label="Спорт">
              <select
                value={filters.sport}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sport: e.target.value }))
                }
                className={SHEET_INPUT_CLASS}
              >
                <option value="">Любой</option>
                {SPORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SPORT_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <button
            type="button"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                lookingForPlayers: !f.lookingForPlayers,
              }))
            }
            className="flex items-center justify-between rounded-[14px] px-4 py-3 transition-colors w-full"
            style={{
              background: filters.lookingForPlayers
                ? "var(--green-50)"
                : "var(--bg-secondary)",
              border: filters.lookingForPlayers
                ? "1.5px solid var(--green-500)"
                : "1.5px solid transparent",
            }}
          >
            <div className="flex flex-col items-start">
              <span
                className="text-[14px] font-semibold"
                style={{
                  color: filters.lookingForPlayers
                    ? "var(--green-700)"
                    : "var(--text-primary)",
                }}
              >
                Ищут игроков
              </span>
              <span
                className="text-[12px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Только команды, открытые к новым участникам
              </span>
            </div>
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: filters.lookingForPlayers
                  ? "var(--green-500)"
                  : "transparent",
                border: filters.lookingForPlayers
                  ? "none"
                  : "1.5px solid var(--gray-300)",
              }}
            >
              {filters.lookingForPlayers && <CheckIcon />}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[12px] font-semibold uppercase"
        style={{
          letterSpacing: "0.06em",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      {children}
    </label>
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
