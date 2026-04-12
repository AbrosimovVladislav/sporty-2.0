import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData, parseTelegramUser } from "@/lib/telegram-auth";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { initData } = await req.json();

  if (!initData) {
    return NextResponse.json({ error: "initData required" }, { status: 400 });
  }

  const isValid = await validateTelegramInitData(initData);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
  }

  const tgUser = parseTelegramUser(initData);
  if (!tgUser) {
    return NextResponse.json({ error: "No user in initData" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const tgName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  // Look up existing user first — мы НЕ хотим перезаписывать поля,
  // которые пользователь мог изменить в онбординге (name, city, sport).
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select()
    .eq("telegram_id", tgUser.id)
    .maybeSingle();

  if (selectError) {
    console.error("Supabase select error:", selectError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ user: existing });
  }

  // First-time login — insert fresh user with name from Telegram.
  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ telegram_id: tgUser.id, name: tgName })
    .select()
    .single();

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ user });
}
