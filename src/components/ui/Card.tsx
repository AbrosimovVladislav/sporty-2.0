import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  elevated?: boolean;
  className?: string;
  onClick?: () => void;
};

const paddingMap = { sm: "p-3", md: "p-4", lg: "p-5" };

export function Card({ children, padding = "md", elevated = true, className = "", onClick }: Props) {
  const base = `bg-background-card rounded-lg ${paddingMap[padding]} ${elevated ? "shadow-card" : ""}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} w-full text-left ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
