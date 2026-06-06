/**
 * sim.js — Match simulation & season logic
 */

// ── Team strength ──────────────────────────────────────────────────────────────

/**
 * Return the average rating of the best 11 players on a team.
 * Ensures at least 1 GK, 3 DEF, 3 MID, 1 FWD are included before
 * filling remaining slots with the highest-rated players left.
 */
function teamStrength(teamId, G) {
  const team    = G.teams.find(t => t.id === teamId);
  if (!team) return 50;
  const players = team.playerIds
    .map(pid => G.players.find(p => p.id === pid))
    .filter(Boolean);

  if (players.length === 0) return 50;

  // Sort each position bucket descending
  const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    if (byPos[p.position]) byPos[p.position].push(p);
  }
  for (const pos in byPos) {
    byPos[pos].sort((a, b) => b.overall - a.overall);
  }

  const xi = [];   // chosen players for the XI

  // Guaranteed minimums
  const slots = { GK: 1, DEF: 3, MID: 3, FWD: 1 };
  for (const [pos, min] of Object.entries(slots)) {
    xi.push(...byPos[pos].slice(0, min));
  }

  // Pool of everyone not yet chosen, sorted by overall desc
  const chosen = new Set(xi.map(p => p.id));
  const remaining = players
    .filter(p => !chosen.has(p.id))
    .sort((a, b) => b.overall - a.overall);

  // Fill to 11
  for (const p of remaining) {
    if (xi.length >= 11) break;
    xi.push(p);
  }

  if (xi.length === 0) return 50;
  return xi.reduce((s, p) => s + p.overall, 0) / xi.length;
}

// ── Goal generation ────────────────────────────────────────────────────────────

function strengthToXG(diff) {
  const base   = 1.3;
  const scaled = diff / 20;
  return Math.max(0.15, Math.min(4.0, base + scaled * 0.9));
}

/** Knuth Poisson sampler, capped at 8 */
function sampleGoals(xg) {
  const L = Math.exp(-Math.max(0.01, xg));
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return Math.min(k - 1, 8);
}

// ── Player stats ───────────────────────────────────────────────────────────────

function awardPlayerStats(teamId, goalsScored, G) {
  if (goalsScored === 0) return;

  const team    = G.teams.find(t => t.id === teamId);
  if (!team) return;
  const players = team.playerIds
    .map(pid => G.players.find(p => p.id === pid))
    .filter(Boolean);

  const weights = { FWD: 4, MID: 2, DEF: 1, GK: 0 };
  const pool    = players.filter(p => weights[p.position] > 0);
  if (pool.length === 0) return;

  const totalWeight = pool.reduce((s, p) => s + weights[p.position], 0);

  for (let g = 0; g < goalsScored; g++) {
    // Pick scorer via weighted random
    let r = Math.random() * totalWeight;
    let scorer = pool[pool.length - 1]; // fallback
    for (const p of pool) {
      r -= weights[p.position];
      if (r <= 0) { scorer = p; break; }
    }
    scorer.goals = (scorer.goals || 0) + 1;

    // ~70% chance of an assist
    if (Math.random() < 0.7) {
      const assistPool = pool.filter(p => p.id !== scorer.id);
      if (assistPool.length > 0) {
        const assister = pick(assistPool);
        assister.assists = (assister.assists || 0) + 1;
      }
    }
  }

  // Games played for top 11
  const top11 = [...players].sort((a, b) => b.overall - a.overall).slice(0, 11);
  for (const p of top11) p.gamesPlayed = (p.gamesPlayed || 0) + 1;
}

// ── Single match ───────────────────────────────────────────────────────────────

function simulateMatch(homeId, awayId, G) {
  const homeTeam = G.teams.find(t => t.id === homeId);
  const awayTeam = G.teams.find(t => t.id === awayId);
  if (!homeTeam || !awayTeam) return { homeScore: 0, awayScore: 0 };

  const homeStr = teamStrength(homeId, G) + 3; // home advantage
  const awayStr = teamStrength(awayId, G);

  const homeScore = sampleGoals(strengthToXG(homeStr - awayStr));
  const awayScore = sampleGoals(strengthToXG(awayStr - homeStr));

  homeTeam.played++; awayTeam.played++;
  homeTeam.gf += homeScore; homeTeam.ga += awayScore;
  awayTeam.gf += awayScore; awayTeam.ga += homeScore;

  if (homeScore > awayScore) {
    homeTeam.wins++;   homeTeam.points += 3;
    awayTeam.losses++;
  } else if (awayScore > homeScore) {
    awayTeam.wins++;   awayTeam.points += 3;
    homeTeam.losses++;
  } else {
    homeTeam.draws++;  homeTeam.points++;
    awayTeam.draws++;  awayTeam.points++;
  }

  awardPlayerStats(homeId, homeScore, G);
  awardPlayerStats(awayId, awayScore, G);

  return { homeScore, awayScore };
}

// ── Matchday simulation ────────────────────────────────────────────────────────

function simulateNextMatchday(G) {
  const day = G.schedule.find(d => !d.played);
  if (!day) return null;

  for (const match of day.matches) {
    const result     = simulateMatch(match.home, match.away, G);
    match.homeScore  = result.homeScore;
    match.awayScore  = result.awayScore;
  }

  day.played       = true;
  G.currentMatchday = day.matchday;
  return day;
}

function simulateFullSeason(G) {
  while (G.schedule.some(d => !d.played)) {
    simulateNextMatchday(G);
  }
}

// ── Player development ─────────────────────────────────────────────────────────

function applyPlayerDevelopment(G) {
  // Develop all players regardless of team (including free agents)
  const allPlayers = [...G.players, ...G.freeAgents];

  for (const p of allPlayers) {
    p.age++;

    let delta = 0;
    if (p.age <= 21) {
      const gap = (p.potential || p.overall) - p.overall;
      delta = randInt(0, Math.max(0, Math.floor(gap * 0.4)));
    } else if (p.age <= 24) {
      const gap = (p.potential || p.overall) - p.overall;
      delta = randInt(0, Math.max(0, Math.floor(gap * 0.2)));
    } else if (p.age <= 29) {
      delta = randInt(-1, 1);
    } else if (p.age <= 32) {
      delta = randInt(-3, 0);
    } else {
      delta = randInt(-5, -1);
    }

    p.overall = Math.min(99, Math.max(30, p.overall + delta));

    // Recalculate value
    const ageMult = p.age <= 23 ? 1.6 : p.age <= 27 ? 1.2 : p.age <= 31 ? 0.85 : 0.5;
    p.value = parseFloat(
      Math.max(0.5, (((p.overall - 40) / 60) * 80 * ageMult) + randInt(0, 3)).toFixed(1)
    );
  }
}

// ── Season reset ───────────────────────────────────────────────────────────────

function resetTeamStats(G) {
  for (const t of G.teams) {
    t.history = t.history || [];
    t.history.push({
      season: G.season,
      points: t.points, wins: t.wins, draws: t.draws, losses: t.losses,
      gf: t.gf, ga: t.ga,
    });
    t.played = 0; t.wins = 0; t.draws = 0; t.losses = 0;
    t.gf = 0; t.ga = 0; t.points = 0;
  }
  // Reset season stats for all players
  const allPlayers = [...G.players, ...G.freeAgents];
  for (const p of allPlayers) {
    p.goals = 0; p.assists = 0; p.gamesPlayed = 0;
  }
}

function startNewSeason(G) {
  resetTeamStats(G);
  G.season++;
  G.currentMatchday = 0;
  G.schedule = generateSchedule(G.teams.map(t => t.id));
}

// ── Transfers ──────────────────────────────────────────────────────────────────

/**
 * Find a player by ID across G.players AND G.freeAgents.
 */
function findPlayer(playerId, G) {
  return G.players.find(p => p.id === playerId)
      || G.freeAgents.find(p => p.id === playerId)
      || null;
}

function buyPlayer(playerId, G) {
  const player   = findPlayer(playerId, G);
  const userTeam = G.teams.find(t => t.id === G.userTeamId);

  if (!player)                              return { success: false, message: "Player not found." };
  if (player.teamId === G.userTeamId)       return { success: false, message: "Already in your squad." };
  if (userTeam.budget < player.value)       return { success: false, message: `Not enough budget. Need £${player.value}M, have £${userTeam.budget.toFixed(1)}M.` };

  const isFreeAgent = player.teamId === "free_agent" || !player.teamId;

  if (!isFreeAgent) {
    const oldTeam = G.teams.find(t => t.id === player.teamId);
    if (oldTeam) {
      // Block if old team would drop below 11 players
      if (oldTeam.playerIds.length <= 11) {
        return { success: false, message: `${oldTeam.name} refuses to sell — squad too small.` };
      }
      oldTeam.playerIds = oldTeam.playerIds.filter(id => id !== playerId);
      oldTeam.budget   += player.value * 0.9;
    }
  } else {
    // Remove from free agent pool
    G.freeAgents = G.freeAgents.filter(p => p.id !== playerId);
  }

  player.teamId = G.userTeamId;
  userTeam.playerIds.push(playerId);
  // Make sure the player is in G.players (move from freeAgents if needed)
  if (!G.players.find(p => p.id === playerId)) {
    G.players.push(player);
  }
  userTeam.budget -= player.value;

  return { success: true, message: `Signed ${player.name} for £${player.value}M!` };
}

function sellPlayer(playerId, G) {
  const player   = G.players.find(p => p.id === playerId);
  const userTeam = G.teams.find(t => t.id === G.userTeamId);

  if (!player)                          return { success: false, message: "Player not found." };
  if (player.teamId !== G.userTeamId)   return { success: false, message: "Not your player." };
  if (userTeam.playerIds.length <= 11)  return { success: false, message: "Can't sell — need at least 11 players." };

  userTeam.playerIds = userTeam.playerIds.filter(id => id !== playerId);
  userTeam.budget   += player.value;
  player.teamId      = "free_agent";
  G.freeAgents.push(player);

  return { success: true, message: `Sold ${player.name} for £${player.value}M.` };
}

// ── Standings helpers ──────────────────────────────────────────────────────────

function getSortedStandings(G) {
  return [...G.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

function getUserPosition(G) {
  return getSortedStandings(G).findIndex(t => t.id === G.userTeamId) + 1;
}

function getRecentResults(teamId, G, n = 5) {
  const results = [];
  for (const day of G.schedule) {
    if (!day.played) continue;
    for (const m of day.matches) {
      if (m.home !== teamId && m.away !== teamId) continue;
      const isHome  = m.home === teamId;
      const myScore = isHome ? m.homeScore : m.awayScore;
      const opScore = isHome ? m.awayScore : m.homeScore;
      const oppId   = isHome ? m.away : m.home;
      const opp     = G.teams.find(t => t.id === oppId);
      results.push({
        opponent: opp ? opp.name : "?",
        myScore, opScore,
        home: isHome,
        result: myScore > opScore ? "W" : myScore < opScore ? "L" : "D",
        matchday: day.matchday,
      });
    }
  }
  return results.slice(-n);
}
