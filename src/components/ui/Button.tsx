"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
};

const variantMap = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-card",
  secondary: "bg-background-card text-foreground border border-border hover:bg-background-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeMap = {
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-6 py-3 text-[15px]",
};

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-semibold
        transition-colors
        ${variantMap[variant]} ${sizeMap[size]}
        ${isDisabled ? "opacity-50 shadow-none cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
