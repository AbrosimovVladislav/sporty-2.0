export const SKILL_LEVELS = [
  "Новичок",
  "Любитель",
  "Уверенный",
  "Полупрофи",
  "Про",
] as const;

export const POSITIONS: Record<string, string[]> = {
  football: ["Вратарь", "Защитник", "Полузащитник", "Нападающий", "Универсал"],
  hockey: ["Вратарь", "Защитник", "Нападающий"],
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

export const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
  hockey: "Хоккей",
};
