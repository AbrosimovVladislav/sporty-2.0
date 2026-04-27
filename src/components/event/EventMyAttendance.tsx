"use client";

type Props = {
  attended: boolean | null;
  paid: boolean;
  pricePerPlayer: number;
  onToggleAttended: () => void;
  onTogglePaid: () => void;
};

export function EventMyAttendance({
  attended,
  paid,
  pricePerPlayer,
  onToggleAttended,
  onTogglePaid,
}: Props) {
  return (
    <section className="px-4 mt-5">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Я был
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Отметьте, пришли ли вы на событие
            </p>
          </div>
          <Toggle
            label={attended === true ? "Был" : attended === false ? "Не был" : "Был?"}
            active={attended === true}
            onClick={onToggleAttended}
          />
        </div>
        {pricePerPlayer > 0 && (
          <div
            className="px-4 py-3 flex items-center justify-between gap-3"
            style={{ borderTop: "1px solid var(--gray-100)" }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Я сдал
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                Взнос с игрока
              </p>
            </div>
            <Toggle
              label={paid ? "Сдал" : "Сдал?"}
              active={paid}
              onClick={onTogglePaid}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-semibold rounded-full px-4 py-1.5 transition-colors shrink-0"
      style={
        active
          ? { background: "var(--green-500)", color: "white" }
          : { background: "var(--gray-100)", color: "var(--text-secondary)" }
      }
    >
      {label}
    </button>
  );
}
