"use client";

type Props = {
  open: boolean;
  cities: string[];
  value: string;
  onClose: () => void;
  onSelect: (city: string) => void;
};

export function CityPickerSheet({ open, cities, value, onClose, onSelect }: Props) {
  if (!open) return null;

  function pick(city: string) {
    onSelect(city);
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
          className="text-[18px] font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Город
        </h2>

        <ul className="flex flex-col">
          {cities.map((city) => {
            const active = city === value;
            return (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => pick(city)}
                  className="w-full flex items-center justify-between py-3 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--gray-100)",
                    color: active ? "var(--green-700)" : "var(--text-primary)",
                  }}
                >
                  <span
                    className="text-[15px]"
                    style={{ fontWeight: active ? 700 : 500 }}
                  >
                    {city}
                  </span>
                  {active && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green-500)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
