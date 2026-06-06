/**
 * main.js — Game controller
 * Initialises the game state (G), wires up all event listeners,
 * handles tab switching, save/load via localStorage.
 */

// ── Global game state ─────────────────────────────────────────────────────────

/** G is the single source of truth for the entire game. */
let G = null;

const SAVE_KEY = "football_gm_save";

// ── Initialise ────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  populateTeamSelect();
  wireSetupScreen();
  wireTabNav();
  wireModalButtons();

  // Auto-load save if present
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      G = JSON.parse(saved);
      launchGame();
    } catch (e) {
      console.warn("Save data corrupt, starting fresh.", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }
});

// ── Setup screen ──────────────────────────────────────────────────────────────

function wireSetupScreen() {
  document.getElementById("start-btn").addEventListener("click", () => {
    const teamId      = document.getElementById("team-select").value;
    const managerName = document.getElementById("manager-name").value.trim() || "The Gaffer";
    initNewGame(teamId, managerName);
  });
}

/**
 * Build the initial game world and store in G.
 */
function initNewGame(userTeamId, managerName) {
  const { teams, players } = generateLeague();
  const schedule           = generateSchedule(teams.map(t => t.id));
  const freeAgents         = generateFreeAgents(40);

  G = {
    version:        1,
    season:         1,
    currentMatchday: 0,
    userTeamId,
    managerName,
    teams,
    players,
    freeAgents,
    schedule,
  };

  saveGame();
  launchGame();
}

/** Switch from setup screen to game screen and do first render. */
function launchGame() {
  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  // Default to dashboard tab
  switchTab("dashboard");
  renderDashboard(G);
}

// ── Tab navigation ─────────────────────────────────────────────────────────────

function wireTabNav() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabName) {
  // Deactivate all
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));

  // Activate target
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const con = document.getElementById(`tab-${tabName}`);
  if (btn) btn.classList.add("active");
  if (con) { con.classList.remove("hidden"); con.classList.add("active"); }

  // Render
  if (!G) return;
  if (tabName === "dashboard")  renderDashboard(G);
  if (tabName === "roster")     renderRoster(G);
  if (tabName === "standings")  renderStandings(G);
  if (tabName === "schedule")   renderSchedule(G);
  if (tabName === "transfers")  renderTransfers(G);
}

// ── Dashboard controls ────────────────────────────────────────────────────────

// Simulate one matchday
document.addEventListener("click", e => {
  if (e.target.id === "btn-sim-day") handleSimDay();
  if (e.target.id === "btn-sim-season") handleSimSeason();
  if (e.target.id === "btn-next-season") handleNextSeason();
});

function handleSimDay() {
  if (!G) return;

  const seasonOver = G.schedule.every(d => d.played);
  if (seasonOver) {
    showToast("Season is over! Click 'Start Next Season'.", "info");
    return;
  }

  const day = simulateNextMatchday(G);
  if (!day) {
    showToast("No more matchdays.", "info");
    return;
  }

  renderMatchResult(day, G);
  renderDashboard(G);
  checkSeasonEnd();
  saveGame();
}

function handleSimSeason() {
  if (!G) return;

  const remaining = G.schedule.filter(d => !d.played).length;
  if (remaining === 0) {
    showToast("Season already finished.", "info");
    return;
  }

  showModal("Simulate Full Season?",
    `Simulate all ${remaining} remaining matchday(s) at once?`
  ).then(confirmed => {
    if (!confirmed) return;
    simulateFullSeason(G);
    renderDashboard(G);
    checkSeasonEnd();
    saveGame();
    showToast("Season simulated!", "success");
  });
}

function handleNextSeason() {
  if (!G) return;

  applyPlayerDevelopment(G);
  // Give AI teams some cash for transfers between seasons
  for (const t of G.teams) {
    if (t.id !== G.userTeamId) t.budget += randInt(5, 20);
  }
  // AI teams do simple squad refreshes
  aiTransferWindow(G);

  startNewSeason(G);

  document.getElementById("btn-next-season").classList.add("hidden");
  document.getElementById("btn-sim-day").classList.remove("hidden");
  document.getElementById("btn-sim-season").classList.remove("hidden");

  // Clear result & banner
  document.getElementById("dash-result").classList.add("hidden");
  document.getElementById("dash-result").innerHTML = "";

  renderDashboard(G);
  saveGame();
  showToast(`Season ${G.season} has begun!`, "success");
}

/** Show season-end UI when last matchday is simulated. */
function checkSeasonEnd() {
  const allPlayed = G.schedule.every(d => d.played);
  if (!allPlayed) return;

  const resultEl = document.getElementById("dash-result");
  renderSeasonEndBanner(G, resultEl);
  resultEl.classList.remove("hidden");

  document.getElementById("btn-sim-day").classList.add("hidden");
  document.getElementById("btn-sim-season").classList.add("hidden");
  document.getElementById("btn-next-season").classList.remove("hidden");
}

// ── Roster controls ───────────────────────────────────────────────────────────

document.getElementById("roster-filter-pos").addEventListener("change", () => renderRoster(G));
document.getElementById("roster-filter-type").addEventListener("change", () => renderRoster(G));
document.getElementById("roster-sort").addEventListener("change", () => renderRoster(G));

/** Called by sell buttons rendered inside roster table */
window.handleSellFromRoster = function(playerId) {
  const player = G.players.find(p => p.id === playerId);
  if (!player) return;

  showModal("Sell Player?",
    `List ${player.name} (OVR ${player.overall}) for £${player.value}M?`
  ).then(confirmed => {
    if (!confirmed) return;
    const result = sellPlayer(playerId, G);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) { renderRoster(G); renderHeader(G); saveGame(); }
  });
};

// ── Schedule filter ───────────────────────────────────────────────────────────

document.getElementById("schedule-filter").addEventListener("change", () => renderSchedule(G));

// ── Transfer controls ──────────────────────────────────────────────────────────

document.getElementById("transfer-search-btn").addEventListener("click", () => renderTransfers(G));
document.getElementById("transfer-filter-pos").addEventListener("change", () => renderTransfers(G));
document.getElementById("transfer-filter-type").addEventListener("change", () => renderTransfers(G));
document.getElementById("transfer-sort").addEventListener("change", () => renderTransfers(G));

/** Called by Buy buttons in the transfer table */
window.handleBuyPlayer = function(playerId) {
  const player = G.players.find(p => p.id === playerId) ||
                 G.freeAgents.find(p => p.id === playerId);
  if (!player) return;

  const fromClub = player.teamId === "free_agent"
    ? "Free Agent"
    : (G.teams.find(t => t.id === player.teamId)?.name || "?");

  showModal("Sign Player?",
    `Sign ${player.name} (${player.position}, OVR ${player.overall}) from ${fromClub} for £${player.value}M?`
  ).then(confirmed => {
    if (!confirmed) return;
    const result = buyPlayer(playerId, G);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) { renderTransfers(G); renderHeader(G); saveGame(); }
  });
};

/** Called by List/Sell buttons in the sell panel */
window.handleSellPlayer = function(playerId) {
  const player = G.players.find(p => p.id === playerId);
  if (!player) return;

  showModal("Sell Player?",
    `Sell ${player.name} (OVR ${player.overall}) for £${player.value}M to the open market?`
  ).then(confirmed => {
    if (!confirmed) return;
    const result = sellPlayer(playerId, G);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) { renderTransfers(G); renderHeader(G); saveGame(); }
  });
};

// ── Modal wiring ───────────────────────────────────────────────────────────────

function wireModalButtons() {
  document.getElementById("modal-confirm").addEventListener("click", () => closeModal(true));
  document.getElementById("modal-cancel").addEventListener("click",  () => closeModal(false));
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modal-overlay")) closeModal(false);
  });
}

// ── Save / Load ───────────────────────────────────────────────────────────────

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch (e) {
    console.warn("Could not save game:", e);
  }
}

// ── AI transfer window (between seasons) ─────────────────────────────────────

/**
 * Simple AI: each non-user team buys 1–3 players from free agents
 * and releases old/weak players to free up budget.
 */
function aiTransferWindow(G) {
  const aiTeams = G.teams.filter(t => t.id !== G.userTeamId);

  for (const team of aiTeams) {
    // Release bottom 2 players if squad large enough
    const players = team.playerIds
      .map(pid => G.players.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a, b) => a.overall - b.overall);

    while (players.length > 18 && players.length > 0) {
      const toRelease = players.shift();
      team.playerIds = team.playerIds.filter(id => id !== toRelease.id);
      toRelease.teamId = "free_agent";
      G.freeAgents.push(toRelease);
    }

    // Buy up to 2 free agents if budget allows
    const buys = Math.min(2, Math.floor(team.budget / 10));
    const candidates = [...G.freeAgents]
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 10);

    let bought = 0;
    for (const fa of candidates) {
      if (bought >= buys) break;
      if (fa.value <= team.budget) {
        team.playerIds.push(fa.id);
        fa.teamId  = team.id;
        team.budget -= fa.value;
        G.freeAgents = G.freeAgents.filter(p => p.id !== fa.id);
        bought++;
      }
    }
  }
}
