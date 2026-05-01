import { ChevronDownIcon } from "./icons";
import type { PeekContent } from "./types";

export function Accordion({
  label,
  open,
  onToggle,
  peek,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  peek?: PeekContent | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </span>
          {!open && peek?.secondary && (
            <span
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {peek.secondary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!open && peek?.primary && (
            <span
              className="text-[15px] font-bold tabular-nums"
              style={{ color: peek.primaryColor ?? "var(--text-primary)" }}
            >
              {peek.primary}
            </span>
          )}
          <span
            className="transition-transform shrink-0"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          >
            <ChevronDownIcon />
          </span>
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}
