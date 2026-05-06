import { getServiceClient } from "@/lib/supabase-server";
import {
  buildEventDeepLink,
  buildProfileDeepLink,
  sendMessage,
} from "@/lib/telegram-bot";

export type NotificationType =
  | "team_invitation_received"
  | "team_join_request_received"
  | "team_join_request_accepted"
  | "team_join_request_rejected"
  | "team_invitation_accepted"
  | "team_invitation_rejected"
  | "team_member_promoted"
  | "team_member_removed"
  | "event_created"
  | "event_cancelled"
  | "finance_payment_recorded";

type Supabase = ReturnType<typeof getServiceClient>;

type BasePayload = {
  href: string;
};

type TeamPayload = BasePayload & {
  team_id: string;
  team_name: string;
};

type ActorPayload = TeamPayload & {
  actor_id: string;
  actor_name: string;
};

type EventPayload = TeamPayload & {
  event_id: string;
  event_type: string;
  event_date: string;
};

type FinancePayload = TeamPayload & {
  amount: number;
  tx_kind: "deposit" | "event_payment";
  event_id: string | null;
};

type Payloads = {
  team_invitation_received: ActorPayload;
  team_join_request_received: ActorPayload;
  team_join_request_accepted: TeamPayload;
  team_join_request_rejected: TeamPayload;
  team_invitation_accepted: ActorPayload;
  team_invitation_rejected: ActorPayload;
  team_member_promoted: TeamPayload;
  team_member_removed: TeamPayload;
  event_created: EventPayload;
  event_cancelled: EventPayload;
  finance_payment_recorded: FinancePayload;
};

type NotifyArgs<T extends NotificationType> = {
  userIds: string[];
  type: T;
  payload: Payloads[T];
  telegramText?: string;
  telegramDeepLink?: string;
};

/**
 * Создаёт записи в notifications для всех получателей и опционально шлёт TG.
 * Молча проглатывает ошибки — нотификации не должны ломать основной flow.
 */
export async function notify<T extends NotificationType>(
  supabase: Supabase,
  args: NotifyArgs<T>,
): Promise<void> {
  const recipients = [...new Set(args.userIds.filter(Boolean))];
  if (recipients.length === 0) return;

  try {
    const rows = recipients.map((uid) => ({
      user_id: uid,
      type: args.type,
      payload: args.payload as unknown as Record<string, unknown>,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) console.error("notify insert error:", error);
  } catch (e) {
    console.error("notify insert exception:", e);
  }

  if (args.telegramText) {
    try {
      const { data: users } = await supabase
        .from("users")
        .select("telegram_id")
        .in("id", recipients);

      const link = args.telegramDeepLink ?? buildProfileDeepLink();
      await Promise.all(
        (users ?? [])
          .filter((u) => u.telegram_id)
          .map((u) =>
            sendMessage(u.telegram_id!, args.telegramText!, {
              reply_markup: {
                inline_keyboard: [[{ text: "Открыть Sporty", url: link }]],
              },
            }),
          ),
      );
    } catch (e) {
      console.error("notify telegram exception:", e);
    }
  }
}

/** Возвращает id организаторов команды. */
export async function getTeamOrganizers(
  supabase: Supabase,
  teamId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("team_memberships")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("role", "organizer");
  return (data ?? []).map((r) => r.user_id);
}

/** Возвращает id всех участников команды (включая организаторов). */
export async function getTeamMembers(
  supabase: Supabase,
  teamId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("team_memberships")
    .select("user_id")
    .eq("team_id", teamId);
  return (data ?? []).map((r) => r.user_id);
}

export { buildEventDeepLink, buildProfileDeepLink };
