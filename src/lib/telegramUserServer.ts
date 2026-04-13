import type { Database, User } from "@/types/database";
import { getServiceClient } from "@/lib/supabase-server";
import { parseTelegramUser, validateTelegramInitData } from "@/lib/telegram-auth";

export class TelegramRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getOrCreateTelegramUser(initData: string): Promise<{
  user: User;
  telegramUser: ReturnType<typeof parseTelegramUser> extends infer T ? Exclude<T, null> : never;
}> {
  if (!initData) {
    throw new TelegramRequestError(400, "initData required");
  }

  const isValid = await validateTelegramInitData(initData);
  if (!isValid) {
    throw new TelegramRequestError(401, "Invalid initData");
  }

  const telegramUser = parseTelegramUser(initData);
  if (!telegramUser) {
    throw new TelegramRequestError(400, "No user in initData");
  }

  const supabase = getServiceClient();
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramUser.id)
    .maybeSingle();

  if (existingUserError) {
    throw new TelegramRequestError(500, "Database error");
  }

  if (existingUser) {
    const patch: Database["public"]["Tables"]["users"]["Update"] = {};

    if (!existingUser.first_name && telegramUser.first_name?.trim()) {
      patch.first_name = telegramUser.first_name.trim();
    }

    if (!existingUser.last_name && telegramUser.last_name?.trim()) {
      patch.last_name = telegramUser.last_name.trim();
    }

    if (!existingUser.photo_url && telegramUser.photo_url?.trim()) {
      patch.photo_url = telegramUser.photo_url.trim();
    }

    if (!existingUser.name.trim()) {
      patch.name =
        [telegramUser.first_name?.trim(), telegramUser.last_name?.trim()].filter(Boolean).join(" ") ||
        telegramUser.username?.trim() ||
        `Player ${telegramUser.id}`;
    }

    if (Object.keys(patch).length === 0) {
      return { user: existingUser, telegramUser };
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(patch)
      .eq("id", existingUser.id)
      .select("*")
      .single();

    if (updateError) {
      throw new TelegramRequestError(500, "Database error");
    }

    return { user: updatedUser, telegramUser };
  }

  const firstName = telegramUser.first_name?.trim() || null;
  const lastName = telegramUser.last_name?.trim() || null;
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    telegramUser.username?.trim() ||
    `Player ${telegramUser.id}`;

  const { data: createdUser, error: createError } = await supabase
    .from("users")
    .insert({
      telegram_id: telegramUser.id,
      name,
      first_name: firstName,
      last_name: lastName,
      photo_url: telegramUser.photo_url?.trim() || null,
    })
    .select("*")
    .single();

  if (createError) {
    throw new TelegramRequestError(500, "Database error");
  }

  return { user: createdUser, telegramUser };
}
