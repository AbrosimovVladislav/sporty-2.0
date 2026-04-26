import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "primary" | "muted" | "danger";
  className?: string;
};

const toneMap = {
  primary: "text-primary",
  muted: "text-foreground-secondary",
  danger: "text-danger",
};

export function SectionEyebrow({ children, tone = "primary", className = "" }: Props) {
  return (
    <p className={`text-[11px] uppercase tracking-[0.06em] font-semibold mb-2 ${toneMap[tone]} ${className}`}>
      {children}
    </p>
  );
}
