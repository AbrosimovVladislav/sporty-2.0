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
      className="rounded-[14px] overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--ink-100)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "var(--ink-900)" }}
          >
            {label}
          </span>
          {!open && peek?.secondary && (
            <span
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--ink-500)" }}
            >
              {peek.secondary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!open && peek?.primary && (
            <span
              className="text-[15px] font-bold tabular-nums"
              style={{ color: peek.primaryColor ?? "var(--ink-900)" }}
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
      {open && (
        <div
          className="px-4 pb-4 pt-2"
          style={{ borderTop: "1px solid var(--ink-100)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
