import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SheetChipGroup } from "@/components/ui/SheetChipGroup";
import DistrictSelect from "@/components/DistrictSelect";
import { KZ_CITIES } from "@/lib/city-context";
import { EVENT_TYPE_OPTIONS } from "./constants";
import { CloseIcon } from "./icons";
import { NativeDateField, NativeTimeField } from "./NativeDateTimeFields";
import type { VenueOption } from "./types";

export function EventCreateSheet({
  teamId,
  userId,
  teamCity,
  onCreated,
  onClose,
}: {
  teamId: string;
  userId: string;
  teamCity: string;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [eventType, setEventType] = useState("game");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(teamCity);
  const [venueMode, setVenueMode] = useState<"none" | "existing" | "new">(
    "none",
  );
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueDistrictId, setVenueDistrictId] = useState("");
  const [venueCost, setVenueCost] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!city) {
      setVenueOptions([]);
      return;
    }
    fetch(`/api/venues?city=${encodeURIComponent(city)}&limit=100`)
      .then((r) => r.json())
      .then((data) => setVenueOptions(data.venues ?? []))
      .catch(() => setVenueOptions([]));
  }, [city]);

  useEffect(() => {
    setSelectedVenueId("");
    setVenueDistrictId("");
    if (venueMode === "existing") setVenueMode("none");
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: eventType,
          date: `${date}T${time}:00`,
          price_per_player: price ? parseFloat(price) : 0,
          min_players: minPlayers ? parseInt(minPlayers, 10) : 1,
          description: description || null,
          venue_id:
            venueMode === "existing" && selectedVenueId
              ? selectedVenueId
              : undefined,
          venue:
            venueMode === "new" && venueName && venueAddress
              ? {
                  name: venueName,
                  address: venueAddress,
                  city,
                  district_id: venueDistrictId || null,
                }
              : undefined,
          venue_cost: venueCost ? parseFloat(venueCost) : 0,
          is_public: isPublic,
        }),
      });
      if (res.ok) onCreated();
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "block w-full h-[46px] px-4 rounded-[12px] text-[14px] outline-none transition-colors focus:border-green-500";
  const inputStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1.5px solid var(--gray-200)",
    WebkitAppearance: "none",
    appearance: "none",
    minWidth: 0,
  };
  const labelClass = "text-[12px] font-semibold uppercase mb-1.5 block";
  const labelStyle = {
    color: "var(--text-tertiary)",
    letterSpacing: "0.06em",
  };

  const cityOptions = KZ_CITIES.map((c) => ({ value: c, label: c }));
  const venueSelectValue = venueMode === "existing" ? selectedVenueId : venueMode;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white flex flex-col"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
          maxHeight: "92dvh",
        }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ background: "var(--gray-300)" }}
          />
        </div>

        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
          <h2
            className="text-[17px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Новое событие
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-4 pt-1 pb-5 flex flex-col gap-4">
            <SheetChipGroup
              label="Тип события"
              options={EVENT_TYPE_OPTIONS}
              value={eventType}
              onChange={setEventType}
              emptyLabel={null}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>
                  Дата
                </label>
                <NativeDateField value={date} onChange={setDate} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Время
                </label>
                <NativeTimeField value={time} onChange={setTime} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>
                  Цена с игрока, ₸
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Мин. игроков
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                  min="1"
                  placeholder="1"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            <SheetChipGroup
              label="Город"
              options={cityOptions}
              value={city}
              onChange={setCity}
              emptyLabel={null}
            />

            <div>
              <label className={labelClass} style={labelStyle}>
                Площадка
              </label>
              <select
                value={venueSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "none") {
                    setVenueMode("none");
                    setSelectedVenueId("");
                    setVenueCost("");
                  } else if (v === "__new__") {
                    setVenueMode("new");
                    setSelectedVenueId("");
                    setVenueCost("");
                  } else {
                    setVenueMode("existing");
                    setSelectedVenueId(v);
                    const picked = venueOptions.find((vo) => vo.id === v);
                    setVenueCost(
                      picked?.default_cost != null
                        ? String(picked.default_cost)
                        : "",
                    );
                  }
                }}
                className={inputClass + " pr-10"}
                style={{
                  ...inputStyle,
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='1,1 6,7 11,1' /></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                }}
              >
                <option value="none">Не указана</option>
                {venueOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.address}
                  </option>
                ))}
                <option value="__new__">+ Новая площадка</option>
              </select>
              {venueOptions.length === 0 && (
                <p
                  className="text-[12px] mt-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  В городе «{city}» пока нет площадок — добавьте новую.
                </p>
              )}
            </div>

            {venueMode === "new" && (
              <>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Название
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Например, Лужники"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Адрес
                  </label>
                  <input
                    type="text"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Адрес"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Район
                  </label>
                  <DistrictSelect
                    city={city}
                    value={venueDistrictId}
                    onChange={setVenueDistrictId}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {venueMode !== "none" && (
              <div>
                <label className={labelClass} style={labelStyle}>
                  Стоимость площадки, ₸
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={venueCost}
                  onChange={(e) => setVenueCost(e.target.value)}
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  style={inputStyle}
                />
                {venueMode === "existing" &&
                  (() => {
                    const picked = venueOptions.find(
                      (v) => v.id === selectedVenueId,
                    );
                    if (picked?.default_cost == null) return null;
                    return (
                      <p
                        className="text-[12px] mt-1.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Подставлена стандартная цена площадки. Можно изменить
                        для конкретного события.
                      </p>
                    );
                  })()}
                {venueMode === "new" && (
                  <p
                    className="text-[12px] mt-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Эта цена сохранится как стандартная цена площадки.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass} style={labelStyle}>
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Необязательно"
                className="block w-full px-4 py-3 rounded-[12px] text-[14px] outline-none transition-colors focus:border-green-500 resize-none"
                style={inputStyle}
              />
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-[14px]"
              style={{ background: "var(--bg-secondary)" }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic((v) => !v)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
                style={{
                  background: isPublic ? "var(--green-500)" : "var(--gray-300)",
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{
                    transform: isPublic ? "translateX(22px)" : "translateX(4px)",
                  }}
                />
              </button>
              <div>
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Публичное событие
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Видно всем в поиске
                </p>
              </div>
            </div>
          </div>

          <div
            className="px-4 pt-3 pb-5 shrink-0 bg-white"
            style={{ borderTop: "1px solid var(--gray-100)" }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!date || !time}
              loading={sending}
              className="w-full"
            >
              Создать событие
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
