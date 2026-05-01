import { Avatar, SectionEyebrow } from "@/components/ui";
import { formatMoney } from "@/lib/format";

type Entry = { userId: string; name: string; amount: number };

export function DebtorsList({
  title,
  entries,
  variant,
  onOpen,
}: {
  title: string;
  entries: Entry[];
  variant: "debtor" | "creditor";
  onOpen: (id: string) => void;
}) {
  if (entries.length === 0) return null;
  const max = entries[0].amount;
  const color = variant === "debtor" ? "danger" : "success";
  const sign = variant === "debtor" ? "−" : "+";
  const keyPrefix = variant === "debtor" ? "debt" : "cred";

  return (
    <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
      <div className="px-4 pt-4 pb-1">
        <SectionEyebrow>
          {title} · {entries.length}
        </SectionEyebrow>
      </div>
      <ul className="divide-y divide-gray-100">
        {entries.map((e) => (
          <DebtorRow
            key={`${keyPrefix}-${e.userId}`}
            userId={e.userId}
            name={e.name}
            amount={e.amount}
            maxAmount={max}
            color={color}
            sign={sign}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </div>
  );
}

function DebtorRow({
  userId,
  name,
  amount,
  maxAmount,
  color,
  sign,
  onOpen,
}: {
  userId: string;
  name: string;
  amount: number;
  maxAmount: number;
  color: "danger" | "success";
  sign: string;
  onOpen: (id: string) => void;
}) {
  const rawPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  const pct = Math.max(rawPct, 8);
  return (
    <li>
      <button
        onClick={() => onOpen(userId)}
        className="w-full flex items-center gap-3 py-3 px-4 text-left"
      >
        <Avatar size="sm" name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate">{name}</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                color === "danger" ? "bg-danger" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span
          className={`text-[14px] font-semibold tabular-nums shrink-0 ml-2 ${
            color === "danger" ? "text-danger" : "text-primary"
          }`}
        >
          {sign}
          {formatMoney(amount)}
        </span>
      </button>
    </li>
  );
}
