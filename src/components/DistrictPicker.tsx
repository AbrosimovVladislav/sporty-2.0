"use client";

import { useEffect, useState } from "react";

type District = { id: string; name: string };

type Props = {
  city: string;
  value: string;
  onChange: (districtId: string) => void;
  placeholder?: string;
  /** When true, "Любой район" option is hidden (district required) */
  required?: boolean;
};

export default function DistrictPicker({
  city,
  value,
  onChange,
  placeholder = "Любой район",
  required = false,
}: Props) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!city) {
      setDistricts([]);
      return;
    }
    const params = new URLSearchParams({ city });
    fetch(`/api/districts?${params}`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts ?? []))
      .catch(() => setDistricts([]));
  }, [city]);

  if (!city || districts.length === 0) return null;

  const selected = districts.find((d) => d.id === value) ?? null;
  const label = selected ? selected.name : placeholder;
  const isPlaceholder = !selected;

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between rounded-[12px] px-3.5 h-[46px] text-[15px] font-medium transition-colors outline-none"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--ink-200)",
          color: isPlaceholder ? "var(--ink-400)" : "var(--ink-900)",
        }}
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full pb-8 max-h-[70vh] flex flex-col"
            style={{
              background: "var(--card)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <span
                className="block w-9 h-1 rounded-full"
                style={{ background: "var(--ink-300)" }}
              />
            </div>
            <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
              <h2
                className="text-[16px] font-bold"
                style={{ color: "var(--ink-900)" }}
              >
                Выберите район
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--ink-100)" }}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </div>

            <ul className="px-4 flex flex-col gap-1 overflow-y-auto">
              {!required && (
                <li>
                  <DistrictRow
                    label={placeholder}
                    selected={value === ""}
                    onClick={() => handleSelect("")}
                  />
                </li>
              )}
              {districts.map((d) => (
                <li key={d.id}>
                  <DistrictRow
                    label={d.name}
                    selected={value === d.id}
                    onClick={() => handleSelect(d.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function DistrictRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] text-left transition-colors active:opacity-70"
      style={{
        background: selected ? "var(--green-50)" : "var(--bg-secondary)",
      }}
    >
      <span
        className="text-[15px] font-medium"
        style={{ color: selected ? "var(--green-800)" : "var(--ink-900)" }}
      >
        {label}
      </span>
      {selected && <CheckIcon />}
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
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--ink-400)", flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--green-700)" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
