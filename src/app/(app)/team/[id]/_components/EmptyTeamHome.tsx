import { useRouter } from "next/navigation";
import { CalendarIcon } from "./icons";

export function EmptyTeamHome({
  teamId,
  canCreate,
}: {
  teamId: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className="rounded-[20px] p-8 text-center flex flex-col items-center gap-3"
      style={{ background: "var(--bg-primary)" }}
    >
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "var(--green-50)", color: "var(--green-600)" }}
      >
        <CalendarIcon />
      </span>
      <p
        className="text-[16px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Команда только начинает
      </p>
      <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
        {canCreate
          ? "Создай первое событие — соберите состав, играйте, ведите финансы."
          : "Подождите первого события или сами предложите организатору сыграть."}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={() => router.push(`/team/${teamId}/events`)}
          className="mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold"
          style={{ background: "var(--green-500)", color: "white" }}
        >
          Создать первое событие
        </button>
      )}
    </div>
  );
}
