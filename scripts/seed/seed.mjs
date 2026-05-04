// Оркестратор сидинга: districts → users → venues → teams → memberships → events → attendances → finances.
// Storage НЕ трогается. Сидер только пишет в БД ссылки на ожидаемые файлы в bucket'ах.
// Файлы в Storage кладёшь сам через Supabase Studio с именами, указанными в data.mjs.

import { randomUUID } from "node:crypto";
import {
  DISTRICTS,
  VENUES,
  TEAMS,
  EVENTS_PER_TEAM,
  generatePlayers,
  distributePlayers,
} from "./data.mjs";

// Строим публичный URL на файл в bucket'е без проверки существования.
// Если файла нет — UI покажет плейсхолдер, добавишь файл позже и оно само заработает.
function publicUrl(supabase, bucket, filename) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export async function wipeDatabase(supabase, log) {
  // Чистим в обратном порядке FK-зависимостей.
  const tablesInOrder = [
    "financial_transactions",
    "event_attendances",
    "events",
    "join_requests",
    "team_memberships",
    "teams",
    "venues",
    "users",
    "districts",
  ];
  for (const table of tablesInOrder) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`Failed to wipe ${table}: ${error.message}`);
    log(`  ${table}: cleared`);
  }
}

export async function seedDistricts(supabase, log) {
  const rows = DISTRICTS.map((d) => ({
    id: randomUUID(),
    city: d.city,
    name: d.name,
  }));
  const { error } = await supabase.from("districts").insert(rows);
  if (error) throw new Error(`Insert districts: ${error.message}`);
  log(`  inserted ${rows.length} districts`);

  const byKey = new Map();
  for (const r of rows) byKey.set(`${r.city}::${r.name}`, r.id);
  return byKey;
}

export async function seedPlayers(supabase, log, districtMap) {
  const players = generatePlayers(100);
  const almatyDistricts = DISTRICTS.filter((d) => d.city === "Алматы");

  const rows = players.map((p) => {
    const districtName = almatyDistricts[p.district_idx_in_almaty].name;
    const districtId = districtMap.get(`Алматы::${districtName}`);
    return {
      id: randomUUID(),
      telegram_id: p.telegram_id,
      name: p.name,
      city: p.city,
      sport: p.sport,
      onboarding_completed: true,
      bio: p.bio,
      birth_date: p.birth_date,
      position: p.position,
      skill_level: p.skill_level,
      looking_for_team: p.looking_for_team,
      district_id: districtId,
      avatar_url: publicUrl(supabase, "avatars", p.avatar_filename),
    };
  });

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("users").insert(batch);
    if (error) throw new Error(`Insert users batch ${i}: ${error.message}`);
  }
  log(`  inserted ${rows.length} players (avatar_url ссылается на bucket avatars)`);

  return rows;
}

export async function seedVenues(supabase, log, districtMap, systemUserId) {
  const rows = VENUES.map((v) => {
    const districtId = districtMap.get(`${v.city}::${v.district}`);
    if (!districtId) throw new Error(`District not found: ${v.city}/${v.district}`);
    return {
      id: randomUUID(),
      name: v.name,
      address: v.address,
      city: v.city,
      district_id: districtId,
      phone: v.phone,
      website: v.website,
      description: v.description,
      default_cost: v.default_cost,
      photo_url: publicUrl(supabase, "venues", v.photo_filename),
      created_by: systemUserId,
    };
  });

  const { error } = await supabase.from("venues").insert(rows);
  if (error) throw new Error(`Insert venues: ${error.message}`);
  log(`  inserted ${rows.length} venues (photo_url ссылается на bucket venues)`);

  return rows;
}

export async function seedTeams(supabase, log, playerRows) {
  const distribution = distributePlayers(100, TEAMS.length);

  const teamRows = TEAMS.map((t, i) => ({
    id: randomUUID(),
    name: t.name,
    city: t.city,
    sport: t.sport,
    description: t.description,
    looking_for_players: t.looking_for_players,
    created_by: playerRows[distribution[i][0]].id,
    logo_url: null, // конвенция имени файла лого пока не зафиксирована
  }));

  const { error } = await supabase.from("teams").insert(teamRows);
  if (error) throw new Error(`Insert teams: ${error.message}`);
  log(`  inserted ${teamRows.length} teams (logo_url=null до фиксации конвенции)`);

  return { teamRows, distribution };
}

export async function seedMemberships(supabase, log, playerRows, teamRows, distribution) {
  const memberships = [];
  for (let teamIdx = 0; teamIdx < distribution.length; teamIdx++) {
    const playerIdxs = distribution[teamIdx];
    const teamId = teamRows[teamIdx].id;
    for (let pos = 0; pos < playerIdxs.length; pos++) {
      const playerIdx = playerIdxs[pos];
      memberships.push({
        id: randomUUID(),
        user_id: playerRows[playerIdx].id,
        team_id: teamId,
        role: pos === 0 ? "organizer" : "player",
      });
    }
  }
  const { error } = await supabase.from("team_memberships").insert(memberships);
  if (error) throw new Error(`Insert memberships: ${error.message}`);
  log(`  inserted ${memberships.length} memberships`);
}

export async function seedEvents(supabase, log, teamRows, distribution, playerRows, venueRows) {
  const almatyVenues = venueRows.filter((v) => v.city === "Алматы");

  const eventRows = [];
  const eventToTeamPlayers = new Map();

  for (let teamIdx = 0; teamIdx < teamRows.length; teamIdx++) {
    const team = teamRows[teamIdx];
    const playerIdxs = distribution[teamIdx];
    const playerIds = playerIdxs.map((i) => playerRows[i].id);
    const organizerId = playerIds[0];

    for (let evIdx = 0; evIdx < EVENTS_PER_TEAM.length; evIdx++) {
      const tpl = EVENTS_PER_TEAM[evIdx];
      const venue = almatyVenues[(teamIdx + evIdx) % almatyVenues.length];
      const date = new Date();
      date.setDate(date.getDate() + tpl.offsetDays);
      date.setHours(19, 0, 0, 0);

      const eventId = randomUUID();
      eventRows.push({
        id: eventId,
        team_id: team.id,
        venue_id: venue.id,
        type: tpl.type,
        date: date.toISOString(),
        price_per_player: tpl.price,
        min_players: tpl.min_players,
        description: tpl.description,
        status: tpl.status,
        venue_cost: venue.default_cost ?? 0,
        venue_paid: tpl.status === "completed" ? venue.default_cost ?? 0 : 0,
        created_by: organizerId,
        is_public: tpl.is_public,
      });
      eventToTeamPlayers.set(eventId, playerIds);
    }
  }

  for (let i = 0; i < eventRows.length; i += 50) {
    const batch = eventRows.slice(i, i + 50);
    const { error } = await supabase.from("events").insert(batch);
    if (error) throw new Error(`Insert events batch: ${error.message}`);
  }
  log(`  inserted ${eventRows.length} events`);

  return { eventRows, eventToTeamPlayers };
}

export async function seedAttendancesAndFinances(
  supabase, log, eventRows, eventToTeamPlayers,
) {
  const attendances = [];
  const transactions = [];

  const eventToTeam = new Map();
  for (const ev of eventRows) eventToTeam.set(ev.id, ev.team_id);

  for (const ev of eventRows) {
    const playerIds = eventToTeamPlayers.get(ev.id) ?? [];

    if (ev.status === "planned") {
      for (let i = 0; i < playerIds.length; i++) {
        const r = (i * 13) % 100;
        let vote = null;
        if (r < 70) vote = "yes";
        else if (r < 85) vote = "no";
        if (vote === null) continue;
        attendances.push({
          id: randomUUID(),
          event_id: ev.id,
          user_id: playerIds[i],
          vote,
          attended: null,
        });
      }
    } else if (ev.status === "completed") {
      for (let i = 0; i < playerIds.length; i++) {
        const attended = (i * 11) % 100 < 80;
        const vote = attended ? "yes" : (i % 2 === 0 ? "yes" : "no");
        attendances.push({
          id: randomUUID(),
          event_id: ev.id,
          user_id: playerIds[i],
          vote,
          attended,
        });

        if (attended) {
          const paid = (i * 17) % 100 < 80;
          if (paid) {
            transactions.push({
              id: randomUUID(),
              team_id: eventToTeam.get(ev.id),
              player_id: playerIds[i],
              amount: ev.price_per_player,
              type: "event_payment",
              event_id: ev.id,
              note: null,
              confirmed_by: playerIds[0],
            });
          }
        }
      }
    }
  }

  for (let i = 0; i < attendances.length; i += 200) {
    const batch = attendances.slice(i, i + 200);
    const { error } = await supabase.from("event_attendances").insert(batch);
    if (error) throw new Error(`Insert attendances: ${error.message}`);
  }
  log(`  inserted ${attendances.length} attendances`);

  for (let i = 0; i < transactions.length; i += 200) {
    const batch = transactions.slice(i, i + 200);
    const { error } = await supabase.from("financial_transactions").insert(batch);
    if (error) throw new Error(`Insert transactions: ${error.message}`);
  }
  log(`  inserted ${transactions.length} financial transactions`);
}
