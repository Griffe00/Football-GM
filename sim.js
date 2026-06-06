/**
 * sim.js — Match simulation, player development, transfers
 */
"use strict";

// ── Team strength ──────────────────────────────────────────────────────────────
function teamStrength(teamId, G) {
  const team = G.teams.find(t => t.id === teamId);
  if (!team) return 50;

  const players = team.playerIds
    .map(pid => G.players.find(p => p.id === pid))
    .filter(Boolean);
  if (!players.length) return 50;

  // Sort each position bucket descending by overall
  const byPos = { GK:[], DEF:[], MID:[], FWD:[] };
  players.forEach(p => { if (byPos[p.position]) byPos[p.position].push(p); });
  Object.values(byPos).forEach(arr => arr.sort((a,b) => b.overall-a.overall));

  // Pick guaranteed minimums
  const xi = [
    ...byPos.GK.slice(0,1),
    ...byPos.DEF.slice(0,3),
    ...byPos.MID.slice(0,3),
    ...byPos.FWD.slice(0,1),
  ];

  // Fill remaining slots with best available
  const chosenIds = new Set(xi.map(p => p.id));
  const rest = players
    .filter(p => !chosenIds.has(p.id))
    .sort((a,b) => b.overall-a.overall);
  for (const p of rest) {
    if (xi.length >= 11) break;
    xi.push(p);
  }

  if (!xi.length) return 50;
  return xi.reduce((s,p) => s+p.overall, 0) / xi.length;
}

// ── Goal generation ────────────────────────────────────────────────────────────
function toXG(strengthDiff) {
  return Math.max(0.15, Math.min(4.0, 1.3 + (strengthDiff / 20) * 0.9));
}

function sampleGoals(xg) {
  // Knuth Poisson, capped at 8
  const L = Math.exp(-Math.max(0.01, xg));
  let k=0, p=1;
  do { k++; p *= Math.random(); } while (p > L);
  return Math.min(k-1, 8);
}

// ── Player stat attribution ────────────────────────────────────────────────────
function awardStats(teamId, goals, G) {
  if (!goals) return;
  const team = G.teams.find(t => t.id===teamId);
  if (!team) return;
  const players = team.playerIds.map(pid => G.players.find(p=>p.id===pid)).filter(Boolean);
  const weights = { FWD:4, MID:2, DEF:1, GK:0 };
  const pool    = players.filter(p => weights[p.position] > 0);
  if (!pool.length) return;

  const total = pool.reduce((s,p) => s+weights[p.position], 0);

  for (let g=0; g<goals; g++) {
    // weighted random scorer
    let r = Math.random()*total;
    let scorer = pool[pool.length-1];
    for (const p of pool) { r -= weights[p.position]; if (r<=0){ scorer=p; break; } }
    scorer.goals = (scorer.goals||0)+1;

    // 70% chance of assist
    if (Math.random()<0.7) {
      const ap = pool.filter(p=>p.id!==scorer.id);
      if (ap.length) { const a=pick(ap); a.assists=(a.assists||0)+1; }
    }
  }
  // games played for best 11
  [...players].sort((a,b)=>b.overall-a.overall).slice(0,11)
    .forEach(p => { p.gamesPlayed=(p.gamesPlayed||0)+1; });
}

// ── Single match ───────────────────────────────────────────────────────────────
function simulateMatch(homeId, awayId, G) {
  const ht = G.teams.find(t=>t.id===homeId);
  const at = G.teams.find(t=>t.id===awayId);
  if (!ht||!at) return {homeScore:0,awayScore:0};

  const hs = teamStrength(homeId,G) + 3;  // home advantage
  const as_ = teamStrength(awayId,G);

  const homeScore = sampleGoals(toXG(hs - as_));
  const awayScore = sampleGoals(toXG(as_ - hs));

  ht.played++; at.played++;
  ht.gf+=homeScore; ht.ga+=awayScore;
  at.gf+=awayScore; at.ga+=homeScore;

  if (homeScore>awayScore)      { ht.wins++; ht.points+=3; at.losses++; }
  else if (awayScore>homeScore) { at.wins++; at.points+=3; ht.losses++; }
  else                          { ht.draws++; ht.points++; at.draws++; at.points++; }

  awardStats(homeId, homeScore, G);
  awardStats(awayId, awayScore, G);
  return {homeScore, awayScore};
}

// ── Matchday / season ──────────────────────────────────────────────────────────
function simulateNextMatchday(G) {
  const day = G.schedule.find(d => !d.played);
  if (!day) return null;
  day.matches.forEach(m => {
    const r = simulateMatch(m.home, m.away, G);
    m.homeScore = r.homeScore;
    m.awayScore = r.awayScore;
  });
  day.played = true;
  G.currentMatchday = day.matchday;
  return day;
}

function simulateFullSeason(G) {
  while (G.schedule.some(d=>!d.played)) simulateNextMatchday(G);
}

// ── Player development ─────────────────────────────────────────────────────────
function applyPlayerDevelopment(G) {
  const all = [...G.players, ...G.freeAgents];
  all.forEach(p => {
    p.age++;
    let delta = 0;
    const gap = (p.potential||p.overall) - p.overall;
    if      (p.age<=21) delta = randInt(0, Math.max(0, Math.floor(gap*0.4)));
    else if (p.age<=24) delta = randInt(0, Math.max(0, Math.floor(gap*0.2)));
    else if (p.age<=29) delta = randInt(-1,1);
    else if (p.age<=32) delta = randInt(-3,0);
    else                delta = randInt(-5,-1);

    p.overall = Math.min(99, Math.max(30, p.overall+delta));

    const am = p.age<=23?1.6:p.age<=27?1.2:p.age<=31?0.85:0.5;
    p.value  = parseFloat(Math.max(0.5,
      (((p.overall-40)/60)*80*am)+randInt(0,3)
    ).toFixed(1));
  });
}

// ── Season reset ───────────────────────────────────────────────────────────────
function startNewSeason(G) {
  G.teams.forEach(t => {
    t.history = t.history||[];
    t.history.push({ season:G.season, points:t.points, wins:t.wins,
                     draws:t.draws, losses:t.losses, gf:t.gf, ga:t.ga });
    t.played=0; t.wins=0; t.draws=0; t.losses=0;
    t.gf=0; t.ga=0; t.points=0;
  });
  [...G.players,...G.freeAgents].forEach(p => { p.goals=0; p.assists=0; p.gamesPlayed=0; });
  G.season++;
  G.currentMatchday = 0;
  G.schedule = generateSchedule(G.teams.map(t=>t.id));
}

// ── Transfer: buy ──────────────────────────────────────────────────────────────
function buyPlayer(pid, G) {
  const player   = G.players.find(p=>p.id===pid) || G.freeAgents.find(p=>p.id===pid);
  const myTeam   = G.teams.find(t=>t.id===G.userTeamId);
  if (!player)                        return {success:false, message:"Player not found."};
  if (player.teamId===G.userTeamId)   return {success:false, message:"Already in your squad."};
  if (myTeam.budget < player.value)   return {success:false,
    message:`Not enough budget. Need £${player.value.toFixed(1)}M, have £${myTeam.budget.toFixed(1)}M.`};

  const isFree = !player.teamId || player.teamId==="free_agent";

  if (!isFree) {
    const oldTeam = G.teams.find(t=>t.id===player.teamId);
    if (oldTeam) {
      if (oldTeam.playerIds.length <= 11)
        return {success:false, message:`${oldTeam.name} refuses to sell — squad too small.`};
      oldTeam.playerIds = oldTeam.playerIds.filter(id=>id!==pid);
      oldTeam.budget   += player.value * 0.9;
    }
  } else {
    G.freeAgents = G.freeAgents.filter(p=>p.id!==pid);
  }

  player.teamId = G.userTeamId;
  myTeam.playerIds.push(pid);
  if (!G.players.find(p=>p.id===pid)) G.players.push(player);
  myTeam.budget -= player.value;

  return {success:true, message:`Signed ${player.name} for £${player.value.toFixed(1)}M!`};
}

// ── Transfer: sell ─────────────────────────────────────────────────────────────
function sellPlayer(pid, G) {
  const player  = G.players.find(p=>p.id===pid);
  const myTeam  = G.teams.find(t=>t.id===G.userTeamId);
  if (!player)                         return {success:false, message:"Player not found."};
  if (player.teamId!==G.userTeamId)    return {success:false, message:"Not your player."};
  if (myTeam.playerIds.length <= 11)   return {success:false, message:"Can't sell — need at least 11 players."};

  myTeam.playerIds = myTeam.playerIds.filter(id=>id!==pid);
  myTeam.budget   += player.value;
  player.teamId    = "free_agent";
  G.freeAgents.push(player);

  return {success:true, message:`Sold ${player.name} for £${player.value.toFixed(1)}M.`};
}

// ── Standings helpers ──────────────────────────────────────────────────────────
function getSortedStandings(G) {
  return [...G.teams].sort((a,b) => {
    if (b.points!==a.points) return b.points-a.points;
    const gdA=a.gf-a.ga, gdB=b.gf-b.ga;
    if (gdB!==gdA) return gdB-gdA;
    return b.gf-a.gf;
  });
}

function getUserPosition(G) {
  return getSortedStandings(G).findIndex(t=>t.id===G.userTeamId)+1;
}

function getRecentResults(teamId, G, n=5) {
  const out=[];
  for (const day of G.schedule) {
    if (!day.played) continue;
    for (const m of day.matches) {
      if (m.home!==teamId && m.away!==teamId) continue;
      const isHome  = m.home===teamId;
      const myScore = isHome?m.homeScore:m.awayScore;
      const opScore = isHome?m.awayScore:m.homeScore;
      const opp     = G.teams.find(t=>t.id===(isHome?m.away:m.home));
      out.push({
        opponent: opp?opp.name:"?",
        myScore, opScore,
        home: isHome,
        result: myScore>opScore?"W":myScore<opScore?"L":"D",
        matchday: day.matchday,
      });
    }
  }
  return out.slice(-n);
}
