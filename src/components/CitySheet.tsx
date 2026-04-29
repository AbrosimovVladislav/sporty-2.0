"use client";

import { useCity, KZ_CITIES } from "@/lib/city-context";

export function CitySheet({ onClose }: { onClose: () => void }) {
  const { activeCity, setActiveCity } = useCity();

  function handleSelect(city: string) {
    setActiveCity(city);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white pb-8"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="block w-9 h-1 rounded-full" style={{ background: "var(--gray-300)" }} />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
            Выберите город
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <ul className="px-4 flex flex-col gap-1">
          {KZ_CITIES.map((city) => (
            <li key={city}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] text-left transition-colors active:opacity-70"
                style={{
                  background: city === activeCity ? "var(--green-50)" : "var(--bg-secondary)",
                }}
              >
                <span
                  className="text-[15px] font-medium"
                  style={{ color: city === activeCity ? "var(--green-700)" : "var(--text-primary)" }}
                >
                  {city}
                </span>
                {city === activeCity && <CheckIcon />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--green-600)" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
