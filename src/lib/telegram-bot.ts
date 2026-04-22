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

function botDeepLink(startParam: string): string {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sporty-2-0.vercel.app";
    return appUrl;
  }
  return `https://t.me/${botUsername}?startapp=${startParam}`;
}

export function buildEventDeepLink(teamId: string, eventId: string): string {
  return botDeepLink(`event_${teamId}_${eventId}`);
}

export function buildProfileDeepLink(): string {
  return botDeepLink("profile");
}

