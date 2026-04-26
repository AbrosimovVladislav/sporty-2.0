"use client";

import { ReactNode, useContext, useEffect } from "react";
import { UIChromeContext } from "@/components/ui/UIChromeContext";

type Props = {
  children: ReactNode;
  className?: string;
};

export function BottomActionBar({ children, className = "" }: Props) {
  const { setHideBottomTabs } = useContext(UIChromeContext);

  useEffect(() => {
    setHideBottomTabs(true);
    return () => setHideBottomTabs(false);
  }, [setHideBottomTabs]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background-card border-t border-border px-4 py-3 shadow-pop z-40 ${className}`}
    >
      {children}
    </div>
  );
}
