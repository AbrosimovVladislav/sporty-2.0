"use client";

import { useEffect, useState } from "react";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { POSITIONS } from "@/lib/catalogs";

export type PlayerFilters = {
  city: string;
  districtId: string;
  lookingForTeam: boolean;
  position: string;
};

type Props = {
  open: boolean;
  initial: PlayerFilters;
  onClose: () => void;
  onApply: (filters: PlayerFilters) => void;
};

const SHEET_INPUT_CLASS =
  "w-full px-4 py-3 text-[14px] rounded-[14px] outline-none bg-background-muted text-foreground border border-transparent focus:border-primary transition-colors";

export function PlayerFiltersSheet({ open, initial, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<PlayerFilters>(initial);

  useEffect(() => {
    if (open) setFilters(initial);
  }, [open, initial]);

  if (!open) return null;

  function reset() {
    setFilters({ city: "", districtId: "", lookingForTeam: false, position: "" });
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
              onChange={(c) => setFilters((f) => ({ ...f, city: c, districtId: "" }))}
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

          <Field label="Позиция">
            <select
              value={filters.position}
              onChange={(e) => setFilters((f) => ({ ...f, position: e.target.value }))}
              className={SHEET_INPUT_CLASS}
            >
              <option value="">Любая</option>
              {POSITIONS.football.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="button"
            onClick={() =>
              setFilters((f) => ({ ...f, lookingForTeam: !f.lookingForTeam }))
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
                Только игроки без команды
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
