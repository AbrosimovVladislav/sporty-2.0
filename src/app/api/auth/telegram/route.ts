import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateTelegramInitData, parseTelegramUser } from "@/lib/telegram-auth";
import type { Database } from "@/types/database";

// Service role client — bypasses RLS for auth upsert
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      { telegram_id: tgUser.id, name },
      { onConflict: "telegram_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ user });
}
