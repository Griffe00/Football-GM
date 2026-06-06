/**
 * main.js — Game controller
 *
 * SAVE_KEY uses a timestamp-based key so there is NEVER a stale
 * save conflict when the code changes — old saves are ignored by
 * design (they'll just sit unused in localStorage).
 */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────────
let G = null;

const SAVE_KEY = "fgm_v4";          // change suffix here to invalidate old saves

// ── Badge emoji options ────────────────────────────────────────────────────────
const BADGES = [
  "🦁","🦊","🐻","🐺","🦅","⚡","🐘","🦌","🐯","🌊",
  "🌹","🦆","🐦","🏰","🦋","👑","🔥","❄️","⭐","🏔️",
  "🌙","☀️","🦈","🐉","🎯","💎","🛡️","⚔️","🦉","🐍",
  "🦚","🦜","🌪️","🦏","🦬","🐊","🦝","🐋","🦇","🐲",
];

let _selectedBadge = BADGES[0];

// ── Boot ───────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  buildBadgePicker();
  wireColorPicker();
  wireStartButton();
  wireTabNav();
  wireModalButtons();
  wireNewGameButton();
  wireRosterFilters();
  wireScheduleFilter();
  wireTransferFilters();

  // Try to restore existing save
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      G = JSON.parse(raw);
      if (G && G.teams && G.players && G.schedule) {
        showGameScreen();
        return;
      }
    }
  } catch (e) {
    console.warn("Could not load save:", e);
  }
  localStorage.removeItem(SAVE_KEY);
  showSetupScreen();
});

// ── Setup screen ───────────────────────────────────────────────────────────────
function showSetupScreen() {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("setup-screen").classList.remove("hidden");
}

function showGameScreen() {
  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  updateSimButtons();
  switchTab("dashboard");
}

function buildBadgePicker() {
  const container = document.getElementById("badge-picker");
  container.innerHTML = "";
  BADGES.forEach((emoji, idx) => {
    const btn = document.createElement("button");
    btn.type        = "button";
    btn.className   = "badge-opt" + (idx === 0 ? " active" : "");
    btn.textContent = emoji;
    btn.setAttribute("data-emoji", emoji);
    btn.addEventListener("click", () => {
      container.querySelectorAll(".badge-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      _selectedBadge = emoji;
    });
    container.appendChild(btn);
  });
  _selectedBadge = BADGES[0];
}

function wireColorPicker() {
  const input = document.getElementById("kit-color");
  const label = document.getElementById("kit-color-label");
  if (!input || !label) return;
  input.addEventListener("input", () => { label.textContent = input.value; });
}

function wireStartButton() {
  document.getElementById("start-btn").addEventListener("click", () => {
    const clubName   = (document.getElementById("club-name-input").value.trim()) || "My FC";
    const badge      = _selectedBadge;
    const kitColor   = document.getElementById("kit-color").value || "#c8001e";
    const managerName= (document.getElementById("manager-name").value.trim()) || "The Gaffer";
    const tier       = parseInt(document.getElementById("league-tier").value, 10) || 2;

    startNewGame(clubName, badge, kitColor, managerName, tier);
  });
}

function startNewGame(clubName, badge, kitColor, managerName, tier) {
  const { teams, players } = generateLeague();

  // Overwrite the first team slot with the player's custom club
  const myTeam      = teams[0];
  myTeam.name       = clubName;
  myTeam.badge      = badge;
  myTeam.colors     = [kitColor, "#ffffff"];
  myTeam.tier       = tier;
  myTeam.budget     = tier === 1 ? randInt(70, 120)
                    : tier === 2 ? randInt(28,  65)
                    :              randInt( 8,  25);

  G = {
    season:          1,
    currentMatchday: 0,
    userTeamId:      myTeam.id,
    managerName,
    teams,
    players,
    freeAgents:      generateFreeAgents(40),
    schedule:        generateSchedule(teams.map(t => t.id)),
  };

  saveGame();
  showGameScreen();
}

// ── Tab navigation ─────────────────────────────────────────────────────────────
function wireTabNav() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => {
    c.classList.remove("active");
    c.classList.add("hidden");
  });

  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  const pane = document.getElementById("tab-" + name);
  if (btn)  btn.classList.add("active");
  if (pane) { pane.classList.remove("hidden"); pane.classList.add("active"); }

  if (!G) return;
  if (name === "dashboard")  renderDashboard(G);
  if (name === "roster")     renderRoster(G);
  if (name === "standings")  renderStandings(G);
  if (name === "schedule")   renderSchedule(G);
  if (name === "transfers")  renderTransfers(G);
}

// ── "New Game" button in header ────────────────────────────────────────────────
function wireNewGameButton() {
  document.getElementById("btn-new-game").addEventListener("click", () => {
    showModal("Start New Career?", "This will erase your current save. Are you sure?")
      .then(ok => {
        if (!ok) return;
        localStorage.removeItem(SAVE_KEY);
        G = null;
        showSetupScreen();
      });
  });
}

// ── Dashboard sim buttons ──────────────────────────────────────────────────────
document.addEventListener("click", e => {
  const id = e.target.id;
  if (id === "btn-sim-day")     onSimDay();
  if (id === "btn-sim-season")  onSimSeason();
  if (id === "btn-next-season") onNextSeason();
});

function onSimDay() {
  if (!G) return;
  if (isSeasonOver()) { showToast("Season over — start the next one!", "info"); return; }
  const day = simulateNextMatchday(G);
  if (!day) return;
  renderMatchResult(day, G);
  renderDashboard(G);
  checkSeasonEnd();
  saveGame();
}

function onSimSeason() {
  if (!G) return;
  const left = G.schedule.filter(d => !d.played).length;
  if (!left) { showToast("Season already finished.", "info"); return; }
  showModal("Simulate Full Season?", `Simulate all ${left} remaining matchday(s)?`)
    .then(ok => {
      if (!ok) return;
      simulateFullSeason(G);
      renderDashboard(G);
      checkSeasonEnd();
      saveGame();
      showToast("Season complete!", "success");
    });
}

function onNextSeason() {
  if (!G) return;
  applyPlayerDevelopment(G);
  // give AI teams a small budget top-up
  G.teams.forEach(t => { if (t.id !== G.userTeamId) t.budget = Math.max(5, t.budget + randInt(5,20)); });
  aiTransferWindow(G);
  startNewSeason(G);
  updateSimButtons();
  const r = document.getElementById("dash-result");
  r.innerHTML = "";
  r.classList.add("hidden");
  renderDashboard(G);
  saveGame();
  showToast(`Season ${G.season} has begun!`, "success");
}

function isSeasonOver() {
  return G.schedule.length > 0 && G.schedule.every(d => d.played);
}

function checkSeasonEnd() {
  if (!isSeasonOver()) return;
  const el = document.getElementById("dash-result");
  renderSeasonEndBanner(G, el);
  updateSimButtons();
}

function updateSimButtons() {
  const over = isSeasonOver();
  document.getElementById("btn-sim-day").classList.toggle("hidden", over);
  document.getElementById("btn-sim-season").classList.toggle("hidden", over);
  document.getElementById("btn-next-season").classList.toggle("hidden", !over);
}

// ── Roster filter wiring ───────────────────────────────────────────────────────
function wireRosterFilters() {
  ["roster-pos","roster-type","roster-sort"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => { if (G) renderRoster(G); });
  });
}

// ── Schedule filter ────────────────────────────────────────────────────────────
function wireScheduleFilter() {
  const el = document.getElementById("schedule-filter");
  if (el) el.addEventListener("change", () => { if (G) renderSchedule(G); });
}

// ── Transfer filter wiring ─────────────────────────────────────────────────────
function wireTransferFilters() {
  ["mkt-pos","mkt-type","mkt-sort"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => { if (G) renderTransferMarket(G); });
  });
  const maxEl = document.getElementById("mkt-max");
  if (maxEl) maxEl.addEventListener("input", () => { if (G) renderTransferMarket(G); });
}

// ── Transfer buy/sell handlers (called from table buttons) ─────────────────────
window.handleBuyPlayer = function(pid) {
  if (!G) return;
  const player = G.players.find(p => p.id === pid)
              || G.freeAgents.find(p => p.id === pid);
  if (!player) { showToast("Player not found.", "error"); return; }

  const fromClub = (!player.teamId || player.teamId === "free_agent")
    ? "Free Agent"
    : (G.teams.find(t => t.id === player.teamId)?.name || "Unknown");

  showModal("Sign Player?",
    `Sign ${player.name} (${player.position}, OVR ${player.overall}) from ${fromClub} for £${player.value.toFixed(1)}M?`
  ).then(ok => {
    if (!ok) return;
    const res = buyPlayer(pid, G);
    showToast(res.message, res.success ? "success" : "error");
    if (res.success) { renderTransfers(G); renderHeader(G); saveGame(); }
  });
};

window.handleSellFromRoster = function(pid) {
  if (!G) return;
  const player = G.players.find(p => p.id === pid);
  if (!player) return;
  showModal("Sell Player?", `Sell ${player.name} (OVR ${player.overall}) for £${player.value.toFixed(1)}M?`)
    .then(ok => {
      if (!ok) return;
      const res = sellPlayer(pid, G);
      showToast(res.message, res.success ? "success" : "error");
      if (res.success) { renderRoster(G); renderHeader(G); saveGame(); }
    });
};

window.handleSellPlayer = function(pid) {
  if (!G) return;
  const player = G.players.find(p => p.id === pid);
  if (!player) return;
  showModal("Sell Player?", `Sell ${player.name} (OVR ${player.overall}) for £${player.value.toFixed(1)}M?`)
    .then(ok => {
      if (!ok) return;
      const res = sellPlayer(pid, G);
      showToast(res.message, res.success ? "success" : "error");
      if (res.success) { renderTransfers(G); renderHeader(G); saveGame(); }
    });
};

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

function closeModal(val) {
  document.getElementById("modal-overlay").classList.add("hidden");
  if (_modalResolve) { _modalResolve(val); _modalResolve = null; }
}

function wireModalButtons() {
  document.getElementById("modal-confirm").addEventListener("click", () => closeModal(true));
  document.getElementById("modal-cancel").addEventListener("click",  () => closeModal(false));
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target.id === "modal-overlay") closeModal(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" &&
        !document.getElementById("modal-overlay").classList.contains("hidden")) {
      closeModal(false);
    }
  });
}

// ── Save / load ────────────────────────────────────────────────────────────────
function saveGame() {
  if (!G) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); }
  catch (e) { console.warn("Save failed:", e); }
}

// ── AI transfer window (between seasons) ───────────────────────────────────────
function aiTransferWindow(G) {
  G.teams.filter(t => t.id !== G.userTeamId).forEach(team => {
    // Release worst players down to 20
    let squad = team.playerIds
      .map(pid => G.players.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a,b) => a.overall - b.overall);

    while (squad.length > 20) {
      const worst = squad.shift();
      team.playerIds = team.playerIds.filter(id => id !== worst.id);
      worst.teamId   = "free_agent";
      G.freeAgents.push(worst);
    }

    // Buy up to 2 free agents
    const maxBuys    = Math.min(2, Math.floor(team.budget / 8));
    const candidates = [...G.freeAgents].sort((a,b) => b.overall - a.overall).slice(0, 15);
    let bought = 0;
    for (const fa of candidates) {
      if (bought >= maxBuys) break;
      if (fa.value > 0 && fa.value <= team.budget) {
        team.playerIds.push(fa.id);
        team.budget -= fa.value;
        fa.teamId    = team.id;
        if (!G.players.find(p => p.id === fa.id)) G.players.push(fa);
        G.freeAgents = G.freeAgents.filter(p => p.id !== fa.id);
        bought++;
      }
    }
  });
}
