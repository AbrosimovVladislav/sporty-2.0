// Cursor pagination helpers.
// Cursor = (orderField, id) tuple, base64url-encoded JSON.
// Tie-break by id to keep ordering stable when timestamps collide.

export type Cursor = { v: string; id: string };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, "base64url").toString());
    if (typeof obj?.v === "string" && typeof obj?.id === "string") {
      return { v: obj.v, id: obj.id };
    }
    return null;
  } catch {
    return null;
  }
}

// PostgREST `or` clause for keyset pagination.
// direction='asc' → field > cursor.v OR (field = cursor.v AND id > cursor.id)
// direction='desc' → field < cursor.v OR (field = cursor.v AND id < cursor.id)
export function keysetClause(
  field: string,
  cursor: Cursor,
  direction: "asc" | "desc",
): string {
  const op = direction === "asc" ? "gt" : "lt";
  return `${field}.${op}."${cursor.v}",and(${field}.eq."${cursor.v}",id.${op}.${cursor.id})`;
}
