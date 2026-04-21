type InlineKeyboardButton =
  | { text: string; url: string }
  | { text: string; web_app: { url: string } };

type SendMessageOpts = {
  parse_mode?: "HTML" | "Markdown";
  disable_web_page_preview?: boolean;
  reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
};

export async function sendMessage(
  chatId: number,
  text: string,
  opts: SendMessageOpts = {}
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts.parse_mode ?? "HTML",
      disable_web_page_preview: opts.disable_web_page_preview ?? true,
      ...(opts.reply_markup && { reply_markup: opts.reply_markup }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Telegram sendMessage failed for chat ${chatId}:`, body);
  }
}

export function buildEventUrl(teamId: string, eventId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sporty-2-0.vercel.app";
  return `${appUrl}/team/${teamId}/events/${eventId}`;
}
