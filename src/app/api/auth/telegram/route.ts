import { NextRequest, NextResponse } from "next/server";
import { getOrCreateTelegramUser, TelegramRequestError } from "@/lib/telegramUserServer";

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    const { user } = await getOrCreateTelegramUser(initData);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof TelegramRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Telegram auth error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
