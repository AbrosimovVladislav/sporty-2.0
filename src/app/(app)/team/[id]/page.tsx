"use client";

// TODO (итерация 2): загрузить Team + TeamMembership для текущего пользователя,
// определить роль, отрендерить нужный режим (не-участник / игрок / организатор).

type TeamRole = "organizer" | "player" | "guest";

// Placeholder: до итерации 2 показываем раскладку как для игрока.
// Роль будет браться из TeamMembership по текущему user + team.
function getCurrentRole(): TeamRole {
  return "player";
}

export default function TeamHomePage() {
  const role = getCurrentRole();

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Состав</p>
        <p className="text-2xl font-display font-bold mt-1">0 игроков</p>
      </section>

      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-sm text-foreground-secondary mt-1">Событий пока нет</p>
      </section>

      {role === "organizer" && (
        <>
          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">
              Финансовый баланс
            </p>
            <p className="text-2xl font-display font-bold mt-1">0 ₽</p>
          </section>

          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">
              Входящие заявки
            </p>
            <p className="text-sm text-foreground-secondary mt-1">Новых заявок нет</p>
          </section>
        </>
      )}
    </>
  );
}
