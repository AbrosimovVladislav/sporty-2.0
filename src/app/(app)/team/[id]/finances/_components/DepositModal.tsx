import { useState } from "react";
import { Button } from "@/components/ui";
import type { Member } from "./types";

export function DepositModal({
  teamId,
  organizerId,
  members,
  onClose,
  onSuccess,
}: {
  teamId: string;
  organizerId: string;
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [playerId, setPlayerId] = useState(members[0]?.user_id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputClass =
    "w-full bg-bg-card border border-border rounded-[10px] px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[13px] text-text-secondary mb-1 block";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!playerId || !Number.isFinite(a) || a <= 0) {
      setErr("Укажи игрока и сумму больше 0");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          amount: a,
          type: "deposit",
          note: note.trim() || null,
          confirmed_by: organizerId,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setErr(d.error ?? "Ошибка");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-bg-primary rounded-t-[20px] p-6 flex flex-col gap-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-[17px] font-semibold">Внести депозит</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        <div>
          <label className={labelClass}>Игрок</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-[10px] px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors text-text-primary"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Сумма, ₸</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Комментарий (опционально)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Предоплата за декабрь…"
            className={inputClass}
          />
        </div>

        {err && <p className="text-[13px] text-danger">{err}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={saving}
          className="w-full"
        >
          Внести
        </Button>
      </form>
    </div>
  );
}
