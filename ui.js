/**
 * ui.js — All DOM rendering functions
 */

// ── Header ─────────────────────────────────────────────────────────────────────

function renderHeader(G) {
  const team = G.teams.find(t => t.id === G.userTeamId);
  if (!team) return;
  document.getElementById("hdr-badge").textContent     = team.badge;
  document.getElementById("hdr-club").textContent      = team.name;
  document.getElementById("hdr-season").textContent    = `Season ${G.season}`;
  document.getElementById("hdr-matchday").textContent  = `Matchday ${G.currentMatchday} / ${G.schedule.length}`;
  document.getElementById("hdr-budget").textContent    = `£${team.budget.toFixed(1)}M`;
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function renderDashboard(G) {
  renderHeader(G);
  renderDashOverview(G);
  renderDashRecent(G);
  renderDashPosition(G);
}

function renderDashOverview(G) {
  const team = G.teams.find(t => t.id === G.userTeamId);
  const gd   = team.gf - team.ga;
  document.getElementById("dash-overview").innerHTML = `
    <div class="overview-stats">
      <div class="stat-item">
        <div class="stat-label">Points</div>
        <div class="stat-value text-green">${team.points}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Record</div>
        <div class="stat-value">${team.wins}W ${team.draws}D ${team.losses}L</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Goals For</div>
        <div class="stat-value">${team.gf}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Goal Diff</div>
        <div class="stat-value ${gd >= 0 ? 'text-green' : 'text-red'}">${gd >= 0 ? '+' : ''}${gd}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Squad</div>
        <div class="stat-value">${team.playerIds.length}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Budget</div>
        <div class="stat-value text-yellow">£${team.budget.toFixed(1)}M</div>
      </div>
    </div>`;
}

function renderDashRecent(G) {
  const results = getRecentResults(G.userTeamId, G, 5);
  const el = document.getElementById("dash-recent");
  if (results.length === 0) {
    el.innerHTML = `<p class="text-muted">No matches played yet.</p>`;
    return;
  }
  el.innerHTML = `<div class="result-list">${results.map(r => {
    const pill  = r.result === "W" ? "pill-win" : r.result === "L" ? "pill-loss" : "pill-draw";
    const where = r.home ? "vs" : "@";
    return `<div class="result-item">
      <span class="text-muted" style="font-size:11px;flex-shrink:0">MD${r.matchday}</span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${where} ${r.opponent}</span>
      <span class="score-pill ${pill}">${r.myScore}–${r.opScore}</span>
    </div>`;
  }).join("")}</div>`;
}

function renderDashPosition(G) {
  const pos  = getUserPosition(G);
  const suf  = pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th";
  const col  = pos <= 4 ? "text-green" : pos >= 18 ? "text-red" : "";
  let zone   = pos <= 4 ? "🏆 Champions League" : pos <= 6 ? "🏅 Europa League" : pos >= 18 ? "⬇️ Relegation Zone" : "";
  document.getElementById("dash-position").innerHTML = `
    <div class="pos-indicator">
      <div class="pos-number ${col}">${pos}<span class="pos-suffix">${suf}</span></div>
      <div class="pos-label">in the league</div>
      ${zone ? `<div class="mt-8" style="color:var(--text2);font-size:12px">${zone}</div>` : ""}
    </div>`;
}

// ── Roster ─────────────────────────────────────────────────────────────────────

function renderRoster(G) {
  if (!G) return;
  const team       = G.teams.find(t => t.id === G.userTeamId);
  const filterPos  = document.getElementById("roster-filter-pos").value;
  const filterType = document.getElementById("roster-filter-type").value;
  const sortBy     = document.getElementById("roster-sort").value;

  let players = team.playerIds
    .map(pid => G.players.find(p => p.id === pid))
    .filter(Boolean);

  if (filterPos  !== "ALL")  players = players.filter(p => p.position === filterPos);
  if (filterType === "real") players = players.filter(p => p.isReal);
  if (filterType === "gen")  players = players.filter(p => !p.isReal);

  players.sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "age")     return a.age - b.age;
    if (sortBy === "name")    return a.name.localeCompare(b.name);
    if (sortBy === "value")   return b.value - a.value;
    return 0;
  });

  document.getElementById("roster-body").innerHTML = players.map(p => `
    <tr class="${p.isReal ? 'real-player-row' : ''}">
      <td>
        ${p.isReal ? '<span class="real-badge">⭐</span>' : ''}
        <strong>${escHtml(p.name)}</strong>
      </td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td>${p.age}</td>
      <td>
        <div class="rating-bar">
          <span>${p.overall}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${p.overall}%"></div></div>
        </div>
      </td>
      <td>${p.potential}</td>
      <td>£${p.value}M</td>
      <td>${p.goals || 0}</td>
      <td>${p.assists || 0}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="handleSellFromRoster('${p.id}')">Sell</button>
      </td>
    </tr>`).join("");
}

// ── Standings ──────────────────────────────────────────────────────────────────

function renderStandings(G) {
  if (!G) return;
  document.getElementById("standings-season").textContent = `Season ${G.season}`;
  const sorted = getSortedStandings(G);

  document.getElementById("standings-body").innerHTML = sorted.map((t, i) => {
    const pos    = i + 1;
    const gd     = t.gf - t.ga;
    const isUser = t.id === G.userTeamId;
    const rowCls = isUser ? "my-team" : "";
    const sepCls = pos === 4 ? "sep-champions" : pos === 6 ? "sep-europa" : pos === 17 ? "sep-relegation" : "";

    return `<tr class="${rowCls} ${sepCls}">
      <td><strong>${pos}</strong></td>
      <td>${t.badge} ${isUser ? `<strong>${escHtml(t.name)}</strong>` : escHtml(t.name)}</td>
      <td>${t.played}</td>
      <td>${t.wins}</td>
      <td>${t.draws}</td>
      <td>${t.losses}</td>
      <td>${t.gf}</td>
      <td>${t.ga}</td>
      <td class="${gd >= 0 ? 'text-green' : 'text-red'}">${gd >= 0 ? '+' : ''}${gd}</td>
      <td><strong class="${t.points > 0 ? 'text-green' : ''}">${t.points}</strong></td>
    </tr>`;
  }).join("");
}

// ── Schedule ───────────────────────────────────────────────────────────────────

function renderSchedule(G) {
  if (!G) return;
  const filter = document.getElementById("schedule-filter").value;
  const el     = document.getElementById("schedule-list");
  let days     = G.schedule;

  if (filter === "played")   days = days.filter(d => d.played);
  if (filter === "upcoming") days = days.filter(d => !d.played);
  if (filter === "mine")     days = days.filter(d =>
    d.matches.some(m => m.home === G.userTeamId || m.away === G.userTeamId)
  );

  if (days.length === 0) {
    el.innerHTML = `<p class="text-muted text-center" style="padding:16px">No matchdays to show.</p>`;
    return;
  }

  el.innerHTML = days.map(day => {
    const fixtures = day.matches.map(m => {
      const home   = G.teams.find(t => t.id === m.home);
      const away   = G.teams.find(t => t.id === m.away);
      const isUser = m.home === G.userTeamId || m.away === G.userTeamId;
      const score  = day.played
        ? `<span class="fixture-score played">${m.homeScore} – ${m.awayScore}</span>`
        : `<span class="fixture-score">vs</span>`;
      return `<div class="fixture-row${isUser ? ' my-fixture' : ''}">
        <div class="fixture-home">${home ? home.badge + ' ' + escHtml(home.name) : '?'}</div>
        ${score}
        <div class="fixture-away">${away ? away.badge + ' ' + escHtml(away.name) : '?'}</div>
      </div>`;
    }).join("");
    return `<div class="matchday-group">
      <h4>Matchday ${day.matchday}${day.played ? ' ✓' : ''}</h4>
      ${fixtures}
    </div>`;
  }).join("");
}

// ── Transfers ──────────────────────────────────────────────────────────────────

function renderTransfers(G) {
  if (!G) return;
  renderTransferMarket(G);
  renderSellPanel(G);
}

function renderTransferMarket(G) {
  const filterPos  = document.getElementById("transfer-filter-pos").value;
  const filterType = document.getElementById("transfer-filter-type").value;
  const sortBy     = document.getElementById("transfer-sort").value;
  const maxVal     = parseFloat(document.getElementById("transfer-max-val").value) || Infinity;
  const userTeam   = G.teams.find(t => t.id === G.userTeamId);

  // All players not on the user's team (from both G.players and G.freeAgents)
  let available = [
    ...G.freeAgents,
    ...G.players.filter(p => p.teamId !== G.userTeamId && p.teamId !== "free_agent"),
  ];

  // Deduplicate by id (safety guard)
  const seen = new Set();
  available = available.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  if (filterPos  !== "ALL")  available = available.filter(p => p.position === filterPos);
  if (filterType === "real") available = available.filter(p => p.isReal);
  if (filterType === "gen")  available = available.filter(p => !p.isReal);
  available = available.filter(p => p.value <= maxVal);

  available.sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "age")     return a.age - b.age;
    if (sortBy === "value")   return a.value - b.value;
    return 0;
  });

  document.getElementById("transfer-body").innerHTML = available.slice(0, 80).map(p => {
    const clubName  = p.teamId === "free_agent" || !p.teamId
      ? "Free Agent"
      : (G.teams.find(t => t.id === p.teamId)?.name || "?");
    const canAfford = userTeam.budget >= p.value;
    return `<tr class="${p.isReal ? 'real-player-row' : ''}">
      <td>${p.isReal ? '<span class="real-badge">⭐</span>' : ''}<strong>${escHtml(p.name)}</strong></td>
      <td class="text-muted" style="font-size:12px">${escHtml(clubName)}</td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td>${p.age}</td>
      <td>
        <div class="rating-bar">
          <span>${p.overall}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${p.overall}%"></div></div>
        </div>
      </td>
      <td>£${p.value}M</td>
      <td>
        <button class="btn btn-primary btn-sm${canAfford ? '' : ' disabled'}"
                ${canAfford ? `onclick="handleBuyPlayer('${p.id}')"` : 'disabled title="Not enough budget"'}>
          Buy
        </button>
      </td>
    </tr>`;
  }).join("");
}

function renderSellPanel(G) {
  const team    = G.teams.find(t => t.id === G.userTeamId);
  const players = team.playerIds
    .map(pid => G.players.find(p => p.id === pid))
    .filter(Boolean)
    .sort((a, b) => b.overall - a.overall);

  document.getElementById("sell-body").innerHTML = players.map(p => `
    <tr class="${p.isReal ? 'real-player-row' : ''}">
      <td>${p.isReal ? '<span class="real-badge">⭐</span>' : ''}<strong>${escHtml(p.name)}</strong></td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td>${p.age}</td>
      <td>${p.overall}</td>
      <td>£${p.value}M</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="handleSellPlayer('${p.id}')">Sell</button>
      </td>
    </tr>`).join("");
}

// ── Match result card ──────────────────────────────────────────────────────────

function renderMatchResult(day, G) {
  const userMatch = day.matches.find(m => m.home === G.userTeamId || m.away === G.userTeamId);
  const el        = document.getElementById("dash-result");

  if (!userMatch) {
    el.className  = "result-box";
    el.innerHTML  = `<p class="text-muted text-center">No fixture this matchday.</p>`;
    el.classList.remove("hidden");
    return;
  }

  const isHome  = userMatch.home === G.userTeamId;
  const myScore = isHome ? userMatch.homeScore : userMatch.awayScore;
  const opScore = isHome ? userMatch.awayScore : userMatch.homeScore;
  const opp     = G.teams.find(t => t.id === (isHome ? userMatch.away : userMatch.home));
  const result  = myScore > opScore ? "win" : myScore < opScore ? "loss" : "draw";
  const myTeam  = G.teams.find(t => t.id === G.userTeamId);

  el.className = `result-box ${result}`;
  el.innerHTML = `
    <div class="result-score">${myScore} – ${opScore}</div>
    <div class="result-teams">
      <span>${isHome ? '🏠 ' : ''}${escHtml(myTeam.name)}</span>
      <span>${!isHome ? '🏠 ' : ''}${opp ? escHtml(opp.name) : '?'}</span>
    </div>
    <p class="text-center mt-8 text-muted" style="font-size:11px">Matchday ${day.matchday}</p>`;
  el.classList.remove("hidden");
}

// ── Season end banner ──────────────────────────────────────────────────────────

function renderSeasonEndBanner(G, el) {
  const pos  = getUserPosition(G);
  const suf  = pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th";
  const team = G.teams.find(t => t.id === G.userTeamId);
  const msg  = pos === 1       ? "🏆 LEAGUE CHAMPIONS!"
             : pos <= 4        ? "🌍 Champions League qualification!"
             : pos <= 6        ? "🏅 Europa League qualification!"
             : pos >= 18       ? "⬇️ RELEGATED!"
             : `Finished ${pos}${suf} place.`;

  el.className = "result-box";
  el.innerHTML = `
    <div class="season-end-banner">
      <h4>${msg}</h4>
      <p>${team.points} pts · ${team.wins}W ${team.draws}D ${team.losses}L · ${team.gf} GF · ${team.gf - team.ga >= 0 ? '+' : ''}${team.gf - team.ga} GD</p>
    </div>`;
  el.classList.remove("hidden");
}

// ── Modal ──────────────────────────────────────────────────────────────────────

let _modalResolve = null;

function showModal(title, body) {
  return new Promise(resolve => {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").textContent  = body;
    document.getElementById("modal-overlay").classList.remove("hidden");
    _modalResolve = resolve;
  });
}

function closeModal(confirmed) {
  document.getElementById("modal-overlay").classList.add("hidden");
  if (_modalResolve) { _modalResolve(confirmed); _modalResolve = null; }
}

// ── Toast ──────────────────────────────────────────────────────────────────────

let _toastTimer = null;

function showToast(msg, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className   = `show toast-${type}`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = ""; }, 3500);
}

// ── Setup screen team select ───────────────────────────────────────────────────

function populateTeamSelect() {
  const sel = document.getElementById("team-select");
  sel.innerHTML = "";
  TEAM_TEMPLATES.forEach((t, i) => {
    const opt     = document.createElement("option");
    opt.value     = `team_${i}`;
    opt.textContent = `${t.badge} ${t.name}`;
    sel.appendChild(opt);
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Escape HTML special characters to prevent XSS in innerHTML */
function escHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
