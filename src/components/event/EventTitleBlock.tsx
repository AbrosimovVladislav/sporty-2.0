"use client";

import { formatFullDate } from "@/lib/format";

type Props = {
  teamName: string;
  date: string;
};

export function EventTitleBlock({ teamName, date }: Props) {
  return (
    <div className="px-4 pt-4">
      <h1
        className="font-display text-[24px] font-bold uppercase leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {teamName}
      </h1>
      <p
        className="text-[14px] mt-1 capitalize"
        style={{ color: "var(--text-secondary)" }}
      >
        {formatFullDate(date)}
      </p>
    </div>
  );
}
