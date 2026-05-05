import Image from "next/image";
import { PositionTag, RatingRing } from "@/components/ui";
import { positionCode, type PositionCode } from "@/lib/playerBadges";
import { CrownIcon, PinIcon } from "./icons";
import type { TeamPlayerSheetMember } from "./types";

export function SheetHeader({
  member,
  isTargetOrganizer,
  onOpenProfile,
}: {
  member: TeamPlayerSheetMember;
  isTargetOrganizer: boolean;
  onOpenProfile: () => void;
}) {
  const positions = (member.user.position ?? [])
    .map((p) => positionCode(p))
    .filter((c): c is PositionCode => c !== null);

  return (
    <>
      <div className="flex items-start gap-4">
        <Avatar src={member.user.avatar_url} name={member.user.name} />
        <div className="flex-1 min-w-0 pt-1 flex flex-col gap-2">
          <h2
            className="font-display font-bold uppercase wrap-break-word"
            style={{
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: "0.01em",
              color: "var(--ink-900)",
            }}
          >
            {member.user.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {isTargetOrganizer && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase"
                style={{
                  background: "var(--green-50)",
                  color: "var(--green-700)",
                  letterSpacing: "0.06em",
                }}
              >
                <CrownIcon />
                Организатор
              </span>
            )}
            {member.user.city && (
              <span
                className="inline-flex items-center gap-1 text-[13px]"
                style={{ color: "var(--ink-500)" }}
              >
                <PinIcon />
                {member.user.city}
              </span>
            )}
          </div>
        </div>
        <RatingRing rating={member.user.rating} size={56} />
      </div>

      {positions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {positions.map((c) => (
            <PositionTag key={c} code={c} />
          ))}
        </div>
      )}

      <button
        onClick={onOpenProfile}
        className="w-full h-11 rounded-[12px] text-[14px] font-semibold transition-colors active:opacity-80"
        style={{
          background: "var(--bg-secondary)",
          color: "var(--ink-900)",
          border: "1px solid var(--ink-200)",
        }}
      >
        Открыть профиль
      </button>
    </>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="shrink-0" style={{ width: 64, height: 64 }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: src ? "white" : "var(--ink-100)",
          border: "1px solid var(--ink-200)",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-display text-[24px] font-bold"
            style={{ color: "var(--ink-500)" }}
          >
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}
