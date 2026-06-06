/**
 * ui.js — All DOM rendering functions
 */
"use strict";

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function posBadge(pos) {
  return `<span class="pos pos-${pos}">${pos}</span>`;
}

function ratingBar(val) {
  return `<div class="bar">
    <span>${val}</span>
    <div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div>
  </div>`;
}

// ── Header ─────────────────────────────────────────────────────────────────────
function renderHeader(G) {
  const t = G.teams.find(t => t.id === G.userTeamId);
  if (!t) return;
  document.getElementById("hdr-badge").textContent    = t.badge;
  document.getElementById("hdr-club").textContent     = t.name;
  document.getElementById("hdr-season").textContent   = "Season " + G.season;
  document.getElementById("hdr-matchday").textContent = `MD ${G.currentMatchday} / ${G.schedule.length}`;
  document.getElementById("hdr-budget").textContent   = "£" + t.budget.toFixed(1) + "M";
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function renderDashboard(G) {
  renderHeader(G);
  _renderOverview(G);
  _renderRecent(G);
  _renderPosition(G);
}

function _renderOverview(G) {
  const t  = G.teams.find(t => t.id === G.userTeamId);
  const gd = t.gf - t.ga;
  document.getElementById("dash-overview").innerHTML = `
    <div class="stat-grid">
      <div class="stat-item"><div class="stat-lbl">Points</div><div class="stat-val green">${t.points}</div></div>
      <div class="stat-item"><div class="stat-lbl">Record</div><div class="stat-val">${t.wins}W ${t.draws}D ${t.losses}L</div></div>
      <div class="stat-item"><div class="stat-lbl">Goals For</div><div class="stat-val">${t.gf}</div></div>
      <div class="stat-item"><div class="stat-lbl">Goal Diff</div><div class="stat-val ${gd>=0?'green':'red'}">${gd>=0?'+':''}${gd}</div></div>
      <div class="stat-item"><div class="stat-lbl">Squad</div><div class="stat-val">${t.playerIds.length}</div></div>
      <div class="stat-item"><div class="stat-lbl">Budget</div><div class="stat-val yellow">£${t.budget.toFixed(1)}M</div></div>
    </div>`;
}

function _renderRecent(G) {
  const results = getRecentResults(G.userTeamId, G, 5);
  const el = document.getElementById("dash-recent");
  if (!results.length) { el.innerHTML = `<p class="muted">No matches played yet.</p>`; return; }
  el.innerHTML = `<div class="result-list">${results.map(r =>
    `<div class="result-item">
      <span class="muted" style="font-size:11px;flex-shrink:0">MD${r.matchday}</span>
      <span class="opp">${r.home ? "vs" : "@"} ${esc(r.opponent)}</span>
      <span class="pill pill-${r.result}">${r.myScore}–${r.opScore}</span>
    </div>`
  ).join("")}</div>`;
}

function _renderPosition(G) {
  const pos  = getUserPosition(G);
  const sufx = pos===1?"st":pos===2?"nd":pos===3?"rd":"th";
  const cls  = pos<=4?"green":pos>=18?"red":"";
  const zone = pos<=4 ? "🏆 Champions League"
             : pos<=6 ? "🏅 Europa League"
             : pos>=18? "⬇️ Relegation Zone" : "";
  document.getElementById("dash-position").innerHTML = `
    <div class="pos-block">
      <div class="pos-num ${cls}">${pos}<span class="pos-sup">${sufx}</span></div>
      <div class="pos-label">in the league</div>
      ${zone ? `<div class="mt8 muted" style="font-size:12px">${zone}</div>` : ""}
    </div>`;
}

// ── Roster ─────────────────────────────────────────────────────────────────────
function renderRoster(G) {
  const team     = G.teams.find(t => t.id === G.userTeamId);
  const filterPos  = document.getElementById("roster-pos").value;
  const filterType = document.getElementById("roster-type").value;
  const sortBy     = document.getElementById("roster-sort").value;

  let players = team.playerIds.map(pid => G.players.find(p => p.id === pid)).filter(Boolean);
  if (filterPos  !== "ALL")  players = players.filter(p => p.position === filterPos);
  if (filterType === "real") players = players.filter(p => p.isReal);
  if (filterType === "gen")  players = players.filter(p => !p.isReal);

  players.sort((a,b) => {
    if (sortBy==="overall") return b.overall-a.overall;
    if (sortBy==="age")     return a.age-b.age;
    if (sortBy==="name")    return a.name.localeCompare(b.name);
    if (sortBy==="value")   return b.value-a.value;
    return 0;
  });

  document.getElementById("roster-body").innerHTML = players.map(p => `
    <tr class="${p.isReal?"real-row":""}">
      <td>${p.isReal?'<span class="real-star">⭐</span>':''}<strong>${esc(p.name)}</strong></td>
      <td>${posBadge(p.position)}</td>
      <td>${p.age}</td>
      <td>${ratingBar(p.overall)}</td>
      <td>${p.potential}</td>
      <td>£${p.value.toFixed(1)}M</td>
      <td>${p.goals||0}</td>
      <td>${p.assists||0}</td>
      <td><button class="btn btn-danger btn-sm" onclick="handleSellFromRoster('${p.id}')">Sell</button></td>
    </tr>`).join("");
}

// ── Standings ──────────────────────────────────────────────────────────────────
function renderStandings(G) {
  document.getElementById("standings-season").textContent = "Season " + G.season;
  const sorted = getSortedStandings(G);
  document.getElementById("standings-body").innerHTML = sorted.map((t,i) => {
    const pos   = i + 1;
    const gd    = t.gf - t.ga;
    const mine  = t.id === G.userTeamId;
    const sepCls = pos===4?"sep-cl":pos===6?"sep-el":pos===17?"sep-rel":"";
    return `<tr class="${mine?"my-team":""} ${sepCls}">
      <td><strong>${pos}</strong></td>
      <td>${t.badge} ${mine?`<strong>${esc(t.name)}</strong>`:esc(t.name)}</td>
      <td>${t.played}</td>
      <td>${t.wins}</td><td>${t.draws}</td><td>${t.losses}</td>
      <td>${t.gf}</td><td>${t.ga}</td>
      <td class="${gd>=0?'green':'red'}">${gd>=0?'+':''}${gd}</td>
      <td><strong class="${t.points>0?'green':''}">${t.points}</strong></td>
    </tr>`;
  }).join("");
}

// ── Schedule ───────────────────────────────────────────────────────────────────
function renderSchedule(G) {
  const filter = document.getElementById("schedule-filter").value;
  let days = G.schedule;
  if (filter==="played")   days = days.filter(d => d.played);
  if (filter==="upcoming") days = days.filter(d => !d.played);
  if (filter==="mine")     days = days.filter(d =>
    d.matches.some(m => m.home===G.userTeamId || m.away===G.userTeamId));

  const el = document.getElementById("schedule-list");
  if (!days.length) { el.innerHTML=`<p class="muted tc" style="padding:16px">Nothing to show.</p>`; return; }

  el.innerHTML = days.map(day => {
    const fixtures = day.matches.map(m => {
      const home  = G.teams.find(t => t.id===m.home);
      const away  = G.teams.find(t => t.id===m.away);
      const mine  = m.home===G.userTeamId || m.away===G.userTeamId;
      const score = day.played
        ? `<span class="fix-score played">${m.homeScore} – ${m.awayScore}</span>`
        : `<span class="fix-score">vs</span>`;
      return `<div class="fixture${mine?" mine":""}">
        <div class="fix-home">${home?home.badge+" "+esc(home.name):"?"}</div>
        ${score}
        <div class="fix-away">${away?away.badge+" "+esc(away.name):"?"}</div>
      </div>`;
    }).join("");
    return `<div class="md-group">
      <h4>Matchday ${day.matchday}${day.played?" ✓":""}</h4>${fixtures}
    </div>`;
  }).join("");
}

// ── Transfers ──────────────────────────────────────────────────────────────────
function renderTransfers(G) {
  renderTransferMarket(G);
  renderSellPanel(G);
}

function renderTransferMarket(G) {
  const filterPos  = document.getElementById("mkt-pos").value;
  const filterType = document.getElementById("mkt-type").value;
  const sortBy     = document.getElementById("mkt-sort").value;
  const maxVal     = parseFloat(document.getElementById("mkt-max").value) || Infinity;
  const myTeam     = G.teams.find(t => t.id === G.userTeamId);

  // Combine free agents + players on other teams; deduplicate by id
  const seen = new Set();
  let pool = [...G.freeAgents, ...G.players.filter(p => p.teamId !== G.userTeamId && p.teamId !== "free_agent")]
    .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  if (filterPos  !== "ALL")  pool = pool.filter(p => p.position === filterPos);
  if (filterType === "real") pool = pool.filter(p => p.isReal);
  if (filterType === "gen")  pool = pool.filter(p => !p.isReal);
  pool = pool.filter(p => p.value <= maxVal);

  pool.sort((a,b) => {
    if (sortBy==="overall") return b.overall-a.overall;
    if (sortBy==="age")     return a.age-b.age;
    if (sortBy==="value")   return a.value-b.value;
    return 0;
  });

  document.getElementById("mkt-body").innerHTML = pool.slice(0,80).map(p => {
    const club      = (!p.teamId||p.teamId==="free_agent")
      ? "Free Agent"
      : (G.teams.find(t=>t.id===p.teamId)?.name||"?");
    const afford    = myTeam.budget >= p.value;
    return `<tr class="${p.isReal?"real-row":""}">
      <td>${p.isReal?'<span class="real-star">⭐</span>':''}<strong>${esc(p.name)}</strong></td>
      <td class="muted" style="font-size:12px">${esc(club)}</td>
      <td>${posBadge(p.position)}</td>
      <td>${p.age}</td>
      <td>${ratingBar(p.overall)}</td>
      <td>£${p.value.toFixed(1)}M</td>
      <td>
        <button class="btn btn-primary btn-sm${afford?"":" disabled"}"
          ${afford?`onclick="handleBuyPlayer('${p.id}')"`:
                   `disabled title="Not enough budget"`}>Buy</button>
      </td>
    </tr>`;
  }).join("");
}

function renderSellPanel(G) {
  const team = G.teams.find(t => t.id === G.userTeamId);
  const players = team.playerIds
    .map(pid => G.players.find(p => p.id===pid)).filter(Boolean)
    .sort((a,b) => b.overall-a.overall);

  document.getElementById("sell-body").innerHTML = players.map(p => `
    <tr class="${p.isReal?"real-row":""}">
      <td>${p.isReal?'<span class="real-star">⭐</span>':''}<strong>${esc(p.name)}</strong></td>
      <td>${posBadge(p.position)}</td>
      <td>${p.age}</td>
      <td>${p.overall}</td>
      <td>£${p.value.toFixed(1)}M</td>
      <td><button class="btn btn-danger btn-sm" onclick="handleSellPlayer('${p.id}')">Sell</button></td>
    </tr>`).join("");
}

// ── Match result ───────────────────────────────────────────────────────────────
function renderMatchResult(day, G) {
  const m  = day.matches.find(m => m.home===G.userTeamId || m.away===G.userTeamId);
  const el = document.getElementById("dash-result");

  if (!m) {
    el.className = "result-box";
    el.innerHTML = `<p class="muted tc">No fixture this matchday.</p>`;
    el.classList.remove("hidden");
    return;
  }

  const isHome   = m.home === G.userTeamId;
  const myScore  = isHome ? m.homeScore : m.awayScore;
  const opScore  = isHome ? m.awayScore : m.homeScore;
  const opp      = G.teams.find(t => t.id===(isHome?m.away:m.home));
  const outcome  = myScore>opScore?"win":myScore<opScore?"loss":"draw";
  const myTeam   = G.teams.find(t => t.id===G.userTeamId);

  el.className = "result-box " + outcome;
  el.innerHTML = `
    <div class="result-score">${myScore} – ${opScore}</div>
    <div class="result-teams">
      <span>${isHome?"🏠 ":""}${esc(myTeam.name)}</span>
      <span>${!isHome?"🏠 ":""}${opp?esc(opp.name):"?"}</span>
    </div>
    <p class="tc mt8 muted" style="font-size:11px">Matchday ${day.matchday}</p>`;
  el.classList.remove("hidden");
}

// ── Season end banner ──────────────────────────────────────────────────────────
function renderSeasonEndBanner(G, el) {
  const pos  = getUserPosition(G);
  const sufx = pos===1?"st":pos===2?"nd":pos===3?"rd":"th";
  const t    = G.teams.find(t => t.id===G.userTeamId);
  const msg  = pos===1       ? "🏆 LEAGUE CHAMPIONS!"
             : pos<=4        ? "🌍 Champions League qualification!"
             : pos<=6        ? "🏅 Europa League qualification!"
             : pos>=18       ? "⬇️ RELEGATED!"
             : `Finished ${pos}${sufx} place.`;

  el.className = "result-box";
  el.innerHTML = `<div class="end-banner">
    <h4>${msg}</h4>
    <p>${t.points} pts · ${t.wins}W ${t.draws}D ${t.losses}L · ${t.gf} GF · ${t.gf-t.ga>=0?"+":""}${t.gf-t.ga} GD</p>
  </div>`;
  el.classList.remove("hidden");
}

// ── Toast ──────────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type="info") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className   = `show toast-${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className=""; }, 3500);
}
