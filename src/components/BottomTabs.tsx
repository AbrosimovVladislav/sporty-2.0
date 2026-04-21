"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type Tab = {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Extra path prefixes that should keep this tab active (besides `href`). */
  matchPaths?: string[];
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA"]);

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (TYPING_TAGS.has(el.tagName)) return true;
  if (el.isContentEditable) return true;
  return false;
}

function isTabActive(tab: Tab, pathname: string): boolean {
  if (pathname === tab.href || pathname.startsWith(tab.href + "/")) return true;
  if (tab.matchPaths) {
    return tab.matchPaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
  }
  return false;
}

export function BottomTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function handleFocusIn(e: FocusEvent) {
      if (isTypingTarget(e.target)) {
        clearTimeout(timer);
        setTyping(true);
      }
    }
    function handleFocusOut(e: FocusEvent) {
      if (isTypingTarget(e.target)) {
        // Debounce: wait to see if focus moves to another input
        timer = setTimeout(() => setTyping(false), 150);
      }
    }
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  if (typing) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-border">
      <div className="flex px-3">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab, pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] transition-colors ${
                isActive ? "text-primary" : "text-foreground-secondary"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
