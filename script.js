function simulateMatch() {
  let team1 = Math.floor(Math.random() * 5);
  let team2 = Math.floor(Math.random() * 5);

  document.getElementById("result").innerText =
    "Team A " + team1 + " - " + team2 + " Team B";
}
