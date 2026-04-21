type SendMessageOpts = {
  parse_mode?: "HTML" | "Markdown";
  disable_web_page_preview?: boolean;
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
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Telegram sendMessage failed for chat ${chatId}:`, body);
  }
}

export function buildEventDeepLink(teamId: string, eventId: string): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  return `https://t.me/${username}?startapp=event_${teamId}_${eventId}`;
}
