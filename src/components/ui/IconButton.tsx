"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  kind?: "light" | "on-photo";
  onClick?: () => void;
  "aria-label"?: string;
  className?: string;
};

const kindMap = {
  light: "bg-background-card shadow-card text-foreground",
  "on-photo": "bg-black/40 backdrop-blur-sm text-white",
};

export function IconButton({ children, kind = "light", onClick, "aria-label": ariaLabel, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${kindMap[kind]} ${className}`}
    >
      {children}
    </button>
  );
}
