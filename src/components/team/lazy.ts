"use client";

import dynamic from "next/dynamic";

/**
 * Тяжёлые bottom-sheet'ы загружаются динамически: они открываются по тапу,
 * нет смысла грузить их код в initial bundle.
 */

export const TeamPlayerSheet = dynamic(
  () => import("./TeamPlayerSheet").then((m) => m.TeamPlayerSheet),
  { ssr: false },
);

export const TeamRequestsSheet = dynamic(
  () => import("./TeamRequestsSheet").then((m) => m.TeamRequestsSheet),
  { ssr: false },
);
