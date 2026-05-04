// Hardcoded seed data — districts, venues, teams, players.
// Storage в этом скрипте НЕ трогается: файлы лежат там постоянно,
// сидер только проставляет в БД ссылки на ожидаемые имена файлов.

export const DISTRICTS = [
  { city: "Алматы", name: "Алмалинский" },
  { city: "Алматы", name: "Алатауский" },
  { city: "Алматы", name: "Ауэзовский" },
  { city: "Алматы", name: "Бостандыкский" },
  { city: "Алматы", name: "Жетысуский" },
  { city: "Алматы", name: "Медеуский" },
  { city: "Алматы", name: "Наурызбайский" },
  { city: "Алматы", name: "Турксибский" },
  { city: "Астана", name: "Алматинский" },
  { city: "Астана", name: "Байконур" },
  { city: "Астана", name: "Есильский" },
  { city: "Астана", name: "Сарыарка" },
];

// Football venues — реальные карточки из Яндекс Карт.
// photo_filename — ожидаемое имя файла в bucket `venues`. Файлы кладёшь сам.
// website — линк на карточку в Яндекс Картах (телефоны Яндекс в публичной выдаче
// показывает не всегда, поэтому где `phone: null` — звони через карточку).
export const VENUES = [
  // ── Алматы ──
  {
    name: "Центральный стадион",
    city: "Алматы",
    district: "Бостандыкский",
    address: "ул. Каныша Сатпаева, 29/3",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Центральный+стадион+Сатпаева+29",
    description:
      "Главный стадион Алматы. Полноразмерное поле, открытые трибуны. Рейтинг 4.9 в Яндекс Картах.",
    default_cost: 30000,
    photo_filename: "centralnyy-stadion.jpg",
  },
  {
    name: "Стадион Динамо",
    city: "Алматы",
    district: "Алмалинский",
    address: "ул. Наурызбай батыра, 93/97",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Стадион+Динамо+Алматы",
    description:
      "Стадион «Динамо» в центре Алматы. Аренда от 30 000 ₸. Рейтинг 4.5.",
    default_cost: 30000,
    photo_filename: "dynamo-stadium.jpg",
  },
  {
    name: "Pole.kz",
    city: "Алматы",
    district: "Бостандыкский",
    address: "пр. Аль-Фараби, 71/2",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Pole.kz+Аль-Фараби+Алматы",
    description:
      "Футбольное поле на Аль-Фараби. Круглосуточно. Рейтинг 5.0 в Яндекс Картах.",
    default_cost: 18000,
    photo_filename: "pole-kz.jpg",
  },
  {
    name: "Стадион Спартак",
    city: "Алматы",
    district: "Медеуский",
    address: "Центральный парк культуры и отдыха",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Стадион+Спартак+ЦПКиО+Алматы",
    description:
      "Стадион в Центральном парке культуры. Открытое поле, дружеские матчи. Рейтинг 4.6.",
    default_cost: 12000,
    photo_filename: "spartak-stadium.jpg",
  },
  {
    name: "Стадион Алаш",
    city: "Алматы",
    district: "Турксибский",
    address: "Турксибский район",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Стадион+Алаш+Турксиб+Алматы",
    description:
      "Стадион в Турксибском районе. Открытое поле, локальные турниры. Рейтинг 4.5.",
    default_cost: 10000,
    photo_filename: "alash-stadium.jpg",
  },
  {
    name: "Туран футбольное поле",
    city: "Алматы",
    district: "Алмалинский",
    address: "ул. Каныша Сатпаева, 16-18А",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Туран+футбольное+поле+Сатпаева",
    description:
      "Футбольное поле «Туран». Рейтинг 4.2 в Яндекс Картах.",
    default_cost: 11000,
    photo_filename: "turan-field.jpg",
  },
  {
    name: "Футбольное поле на Байтурсынова",
    city: "Алматы",
    district: "Бостандыкский",
    address: "ул. Ахмета Байтұрсынова, 124",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Футбольное+поле+Байтурсынова+124",
    description:
      "Открытое поле, работает до 02:00. Подходит для вечерних игр.",
    default_cost: 9000,
    photo_filename: "baytursynov-field.jpg",
  },
  {
    name: "Футбольное поле в 7-м микрорайоне",
    city: "Алматы",
    district: "Ауэзовский",
    address: "мкр. 7",
    phone: null,
    website: "https://yandex.kz/maps/162/almaty/?text=Футбольное+поле+7+микрорайон+Алматы",
    description:
      "Открытое поле в 7-м микрорайоне. Круглосуточно.",
    default_cost: 7000,
    photo_filename: "mkr-7-field.jpg",
  },

  // ── Астана ──
  {
    name: "Стадион в парке Жетысу",
    city: "Астана",
    district: "Сарыарка",
    address: "Парк Жетысу",
    phone: null,
    website: "https://yandex.kz/maps/163/astana/?text=Футбольное+поле+парк+Жетысу+Астана",
    description:
      "Открытое футбольное поле в парке Жетысу.",
    default_cost: 8000,
    photo_filename: "zhetysu-park-field.jpg",
  },
  {
    name: "Qsi Astana",
    city: "Астана",
    district: "Сарыарка",
    address: "мкр. Комсомольский-2",
    phone: null,
    website: "https://yandex.kz/maps/163/astana/?text=Qsi+Astana+Комсомольский+футбол",
    description:
      "Футбольный стадион и спортивный комплекс. Круглосуточно.",
    default_cost: 11000,
    photo_filename: "qsi-astana.jpg",
  },
  {
    name: "Футбольное поле в Шубаре",
    city: "Астана",
    district: "Есильский",
    address: "мкр. Шубар, ул. Зорге",
    phone: null,
    website: "https://yandex.kz/maps/163/astana/?text=Футбольное+поле+Шубар+Зорге+Астана",
    description:
      "Открытое поле в микрорайоне Шубар, левый берег.",
    default_cost: 9000,
    photo_filename: "shubar-field.jpg",
  },
  {
    name: "Футбольное поле на Юго-Востоке",
    city: "Астана",
    district: "Сарыарка",
    address: "мкр. Юго-Восток",
    phone: null,
    website: "https://yandex.kz/maps/163/astana/?text=Футбольное+поле+Юго-Восток+Астана",
    description:
      "Открытое поле в Юго-Восточном микрорайоне. Круглосуточно.",
    default_cost: 7000,
    photo_filename: "yugo-vostok-field.jpg",
  },
];

// 6 команд. Все в Алматы, все футбол.
// Конвенция имени файла лого пока не зафиксирована — поэтому logo_url
// сидер ставит null. Когда определишься — добавим slug сюда и URL.
export const TEAMS = [
  {
    name: "Барсы",
    city: "Алматы",
    sport: "football",
    description:
      "Команда любителей из Алмалинского района. Играем по средам и воскресеньям.",
    looking_for_players: true,
  },
  {
    name: "Алатау United",
    city: "Алматы",
    sport: "football",
    description:
      "Молодая команда, собираемся еженедельно на полях Halyk Arena. Уровень — средний/любители.",
    looking_for_players: true,
  },
  {
    name: "Тулпар FC",
    city: "Алматы",
    sport: "football",
    description:
      "Бостандыкский район, играем 7×7. Серьёзный подход к тренировкам, ищем дисциплинированных игроков.",
    looking_for_players: false,
  },
  {
    name: "Мирас",
    city: "Алматы",
    sport: "football",
    description:
      "Команда из Ауэзовского. Открыты для всех уровней, главное — желание играть и приходить вовремя.",
    looking_for_players: true,
  },
  {
    name: "Кайрат Любители",
    city: "Алматы",
    sport: "football",
    description:
      "Любительский фарм-клуб, тренируемся на Karagaily. Возраст 25+, играем расслабленно.",
    looking_for_players: false,
  },
  {
    name: "Snow Leopards",
    city: "Алматы",
    sport: "football",
    description:
      "Турксибский район. Зимой — манежи, летом — открытые поля. Принимаем заявки от уровня выше среднего.",
    looking_for_players: true,
  },
];

// 30 имён × 30 фамилий = 900 комбинаций; берём 100 уникальных.
export const FIRST_NAMES = [
  "Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил",
  "Иван", "Александр", "Никита", "Антон", "Кирилл",
  "Максим", "Артём", "Денис", "Илья", "Роман",
  "Тимур", "Алибек", "Данияр", "Ерлан", "Нурлан",
  "Алмат", "Кайрат", "Бекзат", "Ерасыл", "Аскар",
  "Талгат", "Адильхан", "Жасулан", "Ринат", "Олжас",
];

export const LAST_NAMES = [
  "Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов",
  "Попов", "Лебедев", "Соколов", "Михайлов", "Новиков",
  "Морозов", "Волков", "Алимов", "Жанибеков", "Касымов",
  "Турсунов", "Сапаров", "Бердыбеков", "Абенов", "Рахимов",
  "Тлеубаев", "Кудайбергенов", "Серикбаев", "Ниязов", "Бакиров",
  "Жумабаев", "Алтынбеков", "Омаров", "Утегенов", "Майлин",
];

export const POSITIONS = ["Вратарь", "Защитник", "Полузащитник", "Нападающий"];
export const SKILL_LABELS = ["Новичок", "Любитель", "Уверенный", "Полупрофи", "Про"];

// Соответствие текстового уровня буквенному уровню в UI (см. src/lib/playerBadges.ts).
const SKILL_TO_LEVEL = {
  "Новичок": "d",
  "Любитель": "c",
  "Уверенный": "b",
  "Полупрофи": "a",
  "Про": "aplus",
};

// Включающие [min, max] диапазоны рейтинга для каждого буквенного уровня.
// Зеркало бакетов из src/lib/playerBadges.ts: 0-25→D, 26-55→C, 56-72→B, 73-88→A, 89-100→A+.
const LEVEL_RATING_RANGE = {
  d: [5, 25],
  c: [26, 55],
  b: [56, 72],
  a: [73, 88],
  aplus: [89, 100],
};

// Допустимые соседи по позиции при двух-позиционных игроках.
// Вратарь не комбинируется с полузащитником/нападающим — нелогично.
const POSITION_NEIGHBORS = {
  "Вратарь": ["Защитник"],
  "Защитник": ["Вратарь", "Полузащитник"],
  "Полузащитник": ["Защитник", "Нападающий"],
  "Нападающий": ["Полузащитник"],
};

// Универсальное трио для 3-позиционных полевых игроков.
const FIELD_TRIO = ["Защитник", "Полузащитник", "Нападающий"];

// 70% игроков — одна позиция, 25% — две, 5% — три. Вратарь не получает 3 позиции.
function buildPositions(i) {
  const main = POSITIONS[i % POSITIONS.length];
  const r = (i * 7) % 100;
  let count = 1;
  if (r >= 70 && r < 95) count = 2;
  else if (r >= 95) count = 3;
  if (main === "Вратарь" && count === 3) count = 2;

  if (count === 1) return [main];
  if (count === 2) {
    const neighbors = POSITION_NEIGHBORS[main];
    return [main, neighbors[i % neighbors.length]];
  }
  return [main, ...FIELD_TRIO.filter((p) => p !== main)];
}

// 80% игроков получают рейтинг в диапазоне их буквенного уровня.
function buildRating(i, skillLabel) {
  const wantRating = (i * 11) % 100 < 80;
  if (!wantRating) return null;
  const level = SKILL_TO_LEVEL[skillLabel];
  const [lo, hi] = LEVEL_RATING_RANGE[level];
  const span = hi - lo + 1;
  return lo + ((i * 17) % span);
}

// Транслит русских букв в латиницу для slug-имён файлов.
const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(text) {
  return text
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? (/[a-z0-9]/.test(c) ? c : "-"))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Генерация 100 уникальных игроков.
// Декартово произведение: для i=0..99 → (firstIdx = i % 30, lastIdx = floor(i/30)).
// Это гарантирует уникальные пары имя+фамилия → уникальные имена файлов аватаров.
export function generatePlayers(count = 100) {
  const players = [];
  for (let i = 0; i < count; i++) {
    const firstIdx = i % FIRST_NAMES.length;
    const lastIdx = Math.floor(i / FIRST_NAMES.length);
    if (lastIdx >= LAST_NAMES.length) {
      throw new Error(`Не хватает фамилий для ${count} игроков (максимум ${FIRST_NAMES.length * LAST_NAMES.length})`);
    }
    const firstName = FIRST_NAMES[firstIdx];
    const lastName = LAST_NAMES[lastIdx];

    const districtIdx = i % 8; // только Алматы (первые 8 районов)
    const positions = buildPositions(i);
    const skillIdx = (i * 13) % SKILL_LABELS.length;
    const skillLabel = SKILL_LABELS[skillIdx];
    const rating = buildRating(i, skillLabel);
    const lookingForTeam = i % 7 === 0;
    const birthYear = 1985 + (i % 23);
    const birthMonth = ((i * 3) % 12) + 1;
    const birthDay = ((i * 5) % 28) + 1;

    players.push({
      idx: i,
      name: `${firstName} ${lastName}`,
      // Имя файла аватара в bucket `avatars`. Формат: player-{firstname}-{lastname}.jpg
      avatar_filename: `player-${slugify(firstName)}-${slugify(lastName)}.jpg`,
      telegram_id: -(1000 + i),
      city: "Алматы",
      district_idx_in_almaty: districtIdx,
      sport: "football",
      bio: i % 4 === 0 ? `Играю с ${birthYear + 18} года. Готов к матчам по выходным.` : null,
      birth_date: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      position: positions,
      skill_level: skillLabel,
      rating,
      looking_for_team: lookingForTeam,
    });
  }
  return players;
}

// Распределение игроков по командам.
// 6 команд × 13 = 78 игроков в командах, остальные 22 — без команды.
// Первый игрок в каждой команде — organizer.
export function distributePlayers(playersCount = 100, teamsCount = 6) {
  const inTeam = 78;
  const distribution = Array.from({ length: teamsCount }, () => []);
  for (let i = 0; i < inTeam; i++) {
    const teamIdx = i % teamsCount;
    distribution[teamIdx].push(i);
  }
  return distribution;
}

// События: 4 на команду — 2 будущих, 2 прошедших.
export const EVENTS_PER_TEAM = [
  { offsetDays: 2, type: "training", description: "Тренировка по тактике", min_players: 10, price: 3000, status: "planned", is_public: false },
  { offsetDays: 7, type: "game", description: "Товарищеский матч", min_players: 14, price: 5000, status: "planned", is_public: true },
  { offsetDays: -3, type: "training", description: "Утренняя тренировка", min_players: 8, price: 2500, status: "completed", is_public: false },
  { offsetDays: -10, type: "game", description: "Игра с другой командой", min_players: 14, price: 5000, status: "completed", is_public: false },
];
