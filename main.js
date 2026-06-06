/**
 * main.js — Game controller
 * Wires up all event listeners, handles tab switching, save/load.
 */

let G = null;
const SAVE_KEY     = "football_gm_save";
const SAVE_VERSION = 3;   // bump when save structure changes

// ── Boot ───────────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  wireSetupScreen();
  wireTabNav();
  wireModalButtons();
  wireHeaderButtons();
  wireRosterFilters();
  wireScheduleFilter();
  wireTransferControls();

  // Try to load existing save
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      // Discard saves from an older version to avoid data shape mismatches
      if (saved && saved.version === SAVE_VERSION) {
        G = saved;
        launchGame();
        return;
      }
    } catch (e) {
      console.warn("Corrupt save, ignoring.", e);
    }
    localStorage.removeItem(SAVE_KEY);
  }
  // Show setup screen
  document.getElementById("setup-screen").classList.remove("hidden");
});

// ── Setup ──────────────────────────────────────────────────────────────────────

// Emoji options for the badge picker
const BADGE_OPTIONS = [
  "🦁","🦊","🐻","🐺","🦅","⚡","🐘","🦌","⚙️","🐯",
  "🌊","🌹","🦆","🐦","🏰","🦋","👑","🔴","🗿","🌿",
  "🔥","❄️","⭐","🏔️","🌙","☀️","🦈","🐉","🦏","🦬",
  "🎯","💎","🛡️","⚔️","🏹","🌪️","🦉","🐍","🦚","🦜",
];

let selectedBadge = "⚽";

function wireSetupScreen() {
  // Build badge picker grid
  const picker = document.getElementById("badge-picker");
  BADGE_OPTIONS.forEach(emoji => {
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "badge-option";
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".badge-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedBadge = emoji;
    });
    picker.appendChild(btn);
  });
  // Select first by default
  picker.firstChild.classList.add("selected");
  selectedBadge = BADGE_OPTIONS[0];

  // Live-update colour label
  const colorInput = document.getElementById("kit-color");
  const colorLabel = document.getElementById("kit-color-label");
  colorInput.addEventListener("input", () => {
    colorLabel.textContent = colorInput.value;
  });

  // Start button
  document.getElementById("start-btn").addEventListener("click", () => {
    const rawName = document.getElementById("club-name-input").value.trim();
    const clubName = rawName || "My FC";
    const manager  = document.getElementById("manager-name").value.trim() || "The Gaffer";
    const tier     = parseInt(document.getElementById("league-tier").value, 10);
    const kitColor = document.getElementById("kit-color").value;

    initNewGame({ clubName, badge: selectedBadge, kitColor, tier }, manager);
  });
}

function initNewGame(clubConfig, managerName) {
  const { teams, players } = generateLeague();

  // The user's team is always index 0 — rename it with their custom details
  const userTeam      = teams[0];
  userTeam.name       = clubConfig.clubName;
  userTeam.badge      = clubConfig.badge;
  userTeam.colors     = [clubConfig.kitColor, "#ffffff"];
  userTeam.tier       = clubConfig.tier;
  // Adjust budget to match chosen tier
  userTeam.budget     = clubConfig.tier === 1 ? randInt(70, 120)
                      : clubConfig.tier === 2 ? randInt(28, 65)
                      : randInt(8, 25);

  G = {
    version:          SAVE_VERSION,
    season:           1,
    currentMatchday:  0,
    userTeamId:       userTeam.id,
    managerName,
    teams,
    players,
    freeAgents:       generateFreeAgents(40),
    schedule:         generateSchedule(teams.map(t => t.id)),
  };
  saveGame();
  launchGame();
}

function launchGame() {
  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  // Reset dashboard button state correctly
  updateSimButtons();
  switchTab("dashboard");
}

// ── Tab navigation ─────────────────────────────────────────────────────────────

function wireTabNav() {
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  );
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => {
    c.classList.add("hidden");
    c.classList.remove("active");
  });

  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const con = document.getElementById(`tab-${tabName}`);
  if (btn) btn.classList.add("active");
  if (con) { con.classList.remove("hidden"); con.classList.add("active"); }

  if (!G) return;
  switch (tabName) {
    case "dashboard":  renderDashboard(G);  break;
    case "roster":     renderRoster(G);     break;
    case "standings":  renderStandings(G);  break;
    case "schedule":   renderSchedule(G);   break;
    case "transfers":  renderTransfers(G);  break;
  }
}

// ── Header buttons ─────────────────────────────────────────────────────────────

function wireHeaderButtons() {
  document.getElementById("btn-new-game").addEventListener("click", () => {
    showModal("Start New Career?",
      "This will erase your current save. Are you sure?"
    ).then(confirmed => {
      if (!confirmed) return;
      localStorage.removeItem(SAVE_KEY);
      G = null;
      document.getElementById("game-screen").classList.add("hidden");
      document.getElementById("setup-screen").classList.remove("hidden");
      // reset result area
      const r = document.getElementById("dash-result");
      r.innerHTML = ""; r.classList.add("hidden");
    });
  });
}

// ── Dashboard controls ─────────────────────────────────────────────────────────

document.addEventListener("click", e => {
  if (e.target.id === "btn-sim-day")     handleSimDay();
  if (e.target.id === "btn-sim-season")  handleSimSeason();
  if (e.target.id === "btn-next-season") handleNextSeason();
});

function handleSimDay() {
  if (!G) return;
  if (G.schedule.every(d => d.played)) {
    showToast("Season over — start the next one!", "info");
    return;
  }
  const day = simulateNextMatchday(G);
  if (!day) return;
  renderMatchResult(day, G);
  renderDashboard(G);
  checkSeasonEnd();
  saveGame();
}

function handleSimSeason() {
  if (!G) return;
  const left = G.schedule.filter(d => !d.played).length;
  if (left === 0) { showToast("Season already finished.", "info"); return; }
  showModal("Simulate Full Season?", `Simulate all ${left} remaining matchday(s) at once?`)
    .then(confirmed => {
      if (!confirmed) return;
      simulateFullSeason(G);
      renderDashboard(G);
      checkSeasonEnd();
      saveGame();
      showToast("Season complete!", "success");
    });
}

function handleNextSeason() {
  if (!G) return;
  applyPlayerDevelopment(G);
  for (const t of G.teams) {
    if (t.id !== G.userTeamId) t.budget = Math.max(5, t.budget + randInt(5, 20));
  }
  aiTransferWindow(G);
  startNewSeason(G);
  updateSimButtons();
  const r = document.getElementById("dash-result");
  r.innerHTML = ""; r.classList.add("hidden");
  renderDashboard(G);
  saveGame();
  showToast(`Season ${G.season} has begun!`, "success");
}

function checkSeasonEnd() {
  if (!G.schedule.every(d => d.played)) return;
  renderSeasonEndBanner(G, document.getElementById("dash-result"));
  updateSimButtons();
}

/** Toggle which sim buttons are visible based on season state */
function updateSimButtons() {
  if (!G) return;
  const over = G.schedule.length > 0 && G.schedule.every(d => d.played);
  document.getElementById("btn-sim-day").classList.toggle("hidden", over);
  document.getElementById("btn-sim-season").classList.toggle("hidden", over);
  document.getElementById("btn-next-season").classList.toggle("hidden", !over);
}

// ── Roster filter wiring ───────────────────────────────────────────────────────

function wireRosterFilters() {
  ["roster-filter-pos", "roster-filter-type", "roster-sort"].forEach(id =>
    document.getElementById(id).addEventListener("change", () => { if (G) renderRoster(G); })
  );
}

// ── Schedule filter ────────────────────────────────────────────────────────────

function wireScheduleFilter() {
  document.getElementById("schedule-filter").addEventListener("change", () => { if (G) renderSchedule(G); });
}

// ── Transfer wiring ────────────────────────────────────────────────────────────

function wireTransferControls() {
  ["transfer-filter-pos", "transfer-filter-type", "transfer-sort"].forEach(id =>
    document.getElementById(id).addEventListener("change", () => { if (G) renderTransfers(G); })
  );
  document.getElementById("transfer-search-btn").addEventListener("click", () => { if (G) renderTransfers(G); });
  document.getElementById("transfer-max-val").addEventListener("input", () => { if (G) renderTransferMarket(G); });
}

// ── Transfer handlers (called from inline onclick) ─────────────────────────────

window.handleBuyPlayer = function(playerId) {
  if (!G) return;
  // Search both pools
  const player = G.players.find(p => p.id === playerId)
              || G.freeAgents.find(p => p.id === playerId);
  if (!player) { showToast("Player not found.", "error"); return; }

  const fromClub = (!player.teamId || player.teamId === "free_agent")
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

window.handleSellFromRoster = function(playerId) {
  if (!G) return;
  const player = G.players.find(p => p.id === playerId);
  if (!player) return;
  showModal("Sell Player?",
    `Sell ${player.name} (OVR ${player.overall}) for £${player.value}M?`
  ).then(confirmed => {
    if (!confirmed) return;
    const result = sellPlayer(playerId, G);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) { renderRoster(G); renderHeader(G); saveGame(); }
  });
};

window.handleSellPlayer = function(playerId) {
  if (!G) return;
  const player = G.players.find(p => p.id === playerId);
  if (!player) return;
  showModal("Sell Player?",
    `Sell ${player.name} (OVR ${player.overall}) for £${player.value}M?`
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
    if (e.target.id === "modal-overlay") closeModal(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("modal-overlay").classList.contains("hidden")) {
      closeModal(false);
    }
  });
}

// ── Save ───────────────────────────────────────────────────────────────────────

function saveGame() {
  if (!G) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch (e) {
    console.warn("Save failed (storage full?):", e);
  }
}

// ── AI transfer window ─────────────────────────────────────────────────────────

function aiTransferWindow(G) {
  const aiTeams = G.teams.filter(t => t.id !== G.userTeamId);

  for (const team of aiTeams) {
    // Collect players sorted worst-first
    let squad = team.playerIds
      .map(pid => G.players.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a, b) => a.overall - b.overall);

    // Release weakest players while over 20
    while (squad.length > 20) {
      const worst = squad.shift();
      team.playerIds = team.playerIds.filter(id => id !== worst.id);
      worst.teamId   = "free_agent";
      G.freeAgents.push(worst);
    }

    // Attempt to sign up to 2 free agents
    const maxBuys   = Math.min(2, Math.floor(team.budget / 8));
    const candidates = [...G.freeAgents]
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 15);

    let bought = 0;
    for (const fa of candidates) {
      if (bought >= maxBuys) break;
      if (fa.value <= team.budget && fa.value > 0) {
        team.playerIds.push(fa.id);
        team.budget -= fa.value;
        fa.teamId    = team.id;
        // Move to G.players if not already there
        if (!G.players.find(p => p.id === fa.id)) G.players.push(fa);
        G.freeAgents = G.freeAgents.filter(p => p.id !== fa.id);
        bought++;
      }
    }
  }
}
