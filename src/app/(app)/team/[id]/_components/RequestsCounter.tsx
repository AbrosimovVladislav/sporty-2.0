import { requestsLabel } from "./atoms";
import { BellIcon } from "./icons";

export function RequestsCounter({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-[16px] px-4 py-3 flex items-center gap-3 text-left transition-colors active:bg-bg-card"
      style={{
        background: "var(--green-50)",
        border: "1px solid var(--green-100)",
      }}
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "var(--green-500)", color: "white" }}
      >
        <BellIcon />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {requestsLabel(count)}
        </p>
        <p
          className="text-[12px] mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Открыть и решить →
        </p>
      </div>
    </button>
  );
}
