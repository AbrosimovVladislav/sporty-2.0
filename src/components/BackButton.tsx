"use client";

import { useRouter } from "next/navigation";

type Props = {
  kind?: "light" | "on-photo";
  fallbackHref?: string;
  onClick?: () => void;
  className?: string;
};

const kindMap = {
  light: "bg-background-card shadow-card text-foreground",
  "on-photo": "bg-black/40 backdrop-blur-sm text-white",
};

export default function BackButton({ kind = "light", fallbackHref = "/", onClick, className }: Props) {
  const router = useRouter();

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Назад"
      className={className ?? `w-10 h-10 rounded-full flex items-center justify-center ${kindMap[kind]}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M11 4L6 9L11 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
