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
