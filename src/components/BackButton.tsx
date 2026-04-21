"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallbackHref?: string;
  onClick?: () => void;
  className?: string;
};

export default function BackButton({ fallbackHref = "/", onClick, className }: Props) {
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
      className={
        className ??
        "w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm text-white"
      }
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
