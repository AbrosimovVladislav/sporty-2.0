import { Button } from "@/components/ui";

export function DepositCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm flex flex-col gap-3">
      <div>
        <p className="text-[14px] font-semibold text-text-primary">
          Депозит игрока
        </p>
        <p
          className="text-[12px] mt-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Пополни баланс игрока, чтобы списывать оплату событий автоматически
        </p>
      </div>
      <Button variant="primary" className="w-full" onClick={onClick}>
        Внести депозит
      </Button>
    </div>
  );
}
