/**
 * data.js — Static data & random generation
 * Real Premier League players are pre-assigned to teams.
 * Remaining squad slots are filled with generated players.
 */

// ── Team templates (fake PL-style clubs) ──────────────────────────────────────
const TEAM_TEMPLATES = [
  { name: "Ashford City",      badge: "🦁", colors: ["#1a3a6e","#c8a951"] },
  { name: "Brentwood United",  badge: "🦊", colors: ["#cc2233","#ffffff"] },
  { name: "Caldwell FC",       badge: "🐻", colors: ["#0047ab","#ffffff"] },
  { name: "Doncaster Town",    badge: "🐺", colors: ["#006633","#ffffff"] },
  { name: "Eastwick Rangers",  badge: "🦅", colors: ["#cc4400","#000000"] },
  { name: "Fairfield Athletic",badge: "⚡", colors: ["#ffcc00","#000000"] },
  { name: "Greystone FC",      badge: "🐘", colors: ["#555555","#cccccc"] },
  { name: "Hartley Rovers",    badge: "🦌", colors: ["#8b0000","#ffffff"] },
  { name: "Ironside City",     badge: "⚙️",  colors: ["#333366","#aaaaaa"] },
  { name: "Jarrow Athletic",   badge: "🐯", colors: ["#ff6600","#000000"] },
  { name: "Kendal Wanderers",  badge: "🌊", colors: ["#006699","#ffffff"] },
  { name: "Lampton FC",        badge: "🌹", colors: ["#cc1122","#ffffff"] },
  { name: "Moorgate City",     badge: "🦆", colors: ["#004488","#ffffff"] },
  { name: "Norwood United",    badge: "🐦", colors: ["#228B22","#ffffff"] },
  { name: "Oldfield Town",     badge: "🏰", colors: ["#660066","#ffffff"] },
  { name: "Penrose United",    badge: "🦋", colors: ["#005577","#ffdd00"] },
  { name: "Queensbury FC",     badge: "👑", colors: ["#8b0000","#ffdd00"] },
  { name: "Redvale Athletic",  badge: "🔴", colors: ["#cc0000","#ffffff"] },
  { name: "Stonebridge FC",    badge: "🗿", colors: ["#555533","#ffffff"] },
  { name: "Thornton City",     badge: "🌿", colors: ["#004422","#ccffcc"] },
];

// ── Real Premier League players database ──────────────────────────────────────
// Format: { name, age, position, overall, potential, value (£M), teamIndex (0-19) }
// teamIndex maps to TEAM_TEMPLATES above (spread across 20 teams)
// Mix of current stars + all-time PL legends, distributed evenly
const REAL_PLAYERS = [

  // ── TEAM 0: Ashford City (Big Club tier) ─────────────────────────────────
  // Current Man City / England stars
  { name: "Erling Haaland",      age: 24, position: "FWD", overall: 93, potential: 96, value: 180.0, teamIndex: 0 },
  { name: "Kevin De Bruyne",     age: 33, position: "MID", overall: 90, potential: 90, value: 55.0,  teamIndex: 0 },
  { name: "Phil Foden",          age: 25, position: "MID", overall: 88, potential: 93, value: 140.0, teamIndex: 0 },
  { name: "Bernardo Silva",      age: 30, position: "MID", overall: 87, potential: 87, value: 70.0,  teamIndex: 0 },
  { name: "Ruben Dias",          age: 27, position: "DEF", overall: 87, potential: 89, value: 80.0,  teamIndex: 0 },
  { name: "Ederson",             age: 31, position: "GK",  overall: 88, potential: 88, value: 45.0,  teamIndex: 0 },
  { name: "Kyle Walker",         age: 35, position: "DEF", overall: 81, potential: 81, value: 15.0,  teamIndex: 0 },
  // PL Legends
  { name: "Sergio Aguero",       age: 36, position: "FWD", overall: 76, potential: 76, value: 4.0,   teamIndex: 0 },
  { name: "Vincent Kompany",     age: 38, position: "DEF", overall: 72, potential: 72, value: 2.0,   teamIndex: 0 },
  { name: "David Silva",         age: 39, position: "MID", overall: 74, potential: 74, value: 2.0,   teamIndex: 0 },

  // ── TEAM 1: Brentwood United ──────────────────────────────────────────────
  // Arsenal / top-6 current
  { name: "Bukayo Saka",         age: 23, position: "FWD", overall: 87, potential: 93, value: 150.0, teamIndex: 1 },
  { name: "Martin Odegaard",     age: 26, position: "MID", overall: 87, potential: 90, value: 110.0, teamIndex: 1 },
  { name: "Declan Rice",         age: 26, position: "MID", overall: 86, potential: 89, value: 115.0, teamIndex: 1 },
  { name: "Gabriel Magalhaes",   age: 27, position: "DEF", overall: 85, potential: 87, value: 70.0,  teamIndex: 1 },
  { name: "David Raya",          age: 29, position: "GK",  overall: 84, potential: 85, value: 40.0,  teamIndex: 1 },
  { name: "Leandro Trossard",    age: 30, position: "FWD", overall: 82, potential: 82, value: 35.0,  teamIndex: 1 },
  { name: "Ben White",           age: 27, position: "DEF", overall: 83, potential: 85, value: 60.0,  teamIndex: 1 },
  // Legends
  { name: "Thierry Henry",       age: 47, position: "FWD", overall: 70, potential: 70, value: 1.0,   teamIndex: 1 },
  { name: "Patrick Vieira",      age: 48, position: "MID", overall: 68, potential: 68, value: 1.0,   teamIndex: 1 },
  { name: "Robert Pires",        age: 51, position: "MID", overall: 66, potential: 66, value: 1.0,   teamIndex: 1 },

  // ── TEAM 2: Caldwell FC ───────────────────────────────────────────────────
  // Chelsea / Liverpool mix
  { name: "Cole Palmer",         age: 22, position: "MID", overall: 87, potential: 94, value: 145.0, teamIndex: 2 },
  { name: "Mohamed Salah",       age: 33, position: "FWD", overall: 90, potential: 90, value: 55.0,  teamIndex: 2 },
  { name: "Virgil van Dijk",     age: 33, position: "DEF", overall: 88, potential: 88, value: 40.0,  teamIndex: 2 },
  { name: "Trent Alexander-Arnold", age: 26, position: "DEF", overall: 87, potential: 89, value: 80.0, teamIndex: 2 },
  { name: "Alisson Becker",      age: 32, position: "GK",  overall: 89, potential: 89, value: 40.0,  teamIndex: 2 },
  { name: "Dominik Szoboszlai",  age: 24, position: "MID", overall: 83, potential: 88, value: 75.0,  teamIndex: 2 },
  { name: "Nicolas Jackson",     age: 23, position: "FWD", overall: 80, potential: 87, value: 60.0,  teamIndex: 2 },
  // Legends
  { name: "Steven Gerrard",      age: 44, position: "MID", overall: 73, potential: 73, value: 1.5,   teamIndex: 2 },
  { name: "Frank Lampard",       age: 46, position: "MID", overall: 72, potential: 72, value: 1.5,   teamIndex: 2 },
  { name: "John Terry",          age: 44, position: "DEF", overall: 71, potential: 71, value: 1.5,   teamIndex: 2 },

  // ── TEAM 3: Doncaster Town ────────────────────────────────────────────────
  // Tottenham / Newcastle
  { name: "Son Heung-min",       age: 32, position: "FWD", overall: 87, potential: 87, value: 50.0,  teamIndex: 3 },
  { name: "Alexander Isak",      age: 25, position: "FWD", overall: 86, potential: 91, value: 120.0, teamIndex: 3 },
  { name: "Bruno Guimaraes",     age: 27, position: "MID", overall: 86, potential: 89, value: 100.0, teamIndex: 3 },
  { name: "James Maddison",      age: 28, position: "MID", overall: 83, potential: 84, value: 55.0,  teamIndex: 3 },
  { name: "Nick Pope",           age: 32, position: "GK",  overall: 83, potential: 83, value: 28.0,  teamIndex: 3 },
  { name: "Cristian Romero",     age: 27, position: "DEF", overall: 84, potential: 86, value: 65.0,  teamIndex: 3 },
  { name: "Pedro Porro",         age: 25, position: "DEF", overall: 81, potential: 85, value: 45.0,  teamIndex: 3 },
  // Legends
  { name: "Alan Shearer",        age: 54, position: "FWD", overall: 72, potential: 72, value: 1.0,   teamIndex: 3 },
  { name: "Les Ferdinand",       age: 57, position: "FWD", overall: 67, potential: 67, value: 1.0,   teamIndex: 3 },
  { name: "Paul Scholes",        age: 50, position: "MID", overall: 72, potential: 72, value: 1.0,   teamIndex: 3 },

  // ── TEAM 4: Eastwick Rangers ──────────────────────────────────────────────
  // Man United / Aston Villa
  { name: "Marcus Rashford",     age: 27, position: "FWD", overall: 83, potential: 86, value: 65.0,  teamIndex: 4 },
  { name: "Rasmus Hojlund",      age: 22, position: "FWD", overall: 80, potential: 89, value: 75.0,  teamIndex: 4 },
  { name: "Ollie Watkins",       age: 29, position: "FWD", overall: 84, potential: 85, value: 65.0,  teamIndex: 4 },
  { name: "Emiliano Martinez",   age: 32, position: "GK",  overall: 86, potential: 86, value: 38.0,  teamIndex: 4 },
  { name: "Morgan Rogers",       age: 22, position: "MID", overall: 78, potential: 88, value: 55.0,  teamIndex: 4 },
  { name: "Ezri Konsa",          age: 27, position: "DEF", overall: 81, potential: 83, value: 45.0,  teamIndex: 4 },
  { name: "Leon Bailey",         age: 27, position: "FWD", overall: 80, potential: 82, value: 38.0,  teamIndex: 4 },
  // Legends
  { name: "Dwight Yorke",        age: 53, position: "FWD", overall: 68, potential: 68, value: 1.0,   teamIndex: 4 },
  { name: "Andy Cole",           age: 53, position: "FWD", overall: 69, potential: 69, value: 1.0,   teamIndex: 4 },
  { name: "Roy Keane",           age: 53, position: "MID", overall: 71, potential: 71, value: 1.0,   teamIndex: 4 },

  // ── TEAM 5: Fairfield Athletic ────────────────────────────────────────────
  // Chelsea / Wolves / West Ham current
  { name: "Pedro Neto",          age: 24, position: "FWD", overall: 83, potential: 89, value: 80.0,  teamIndex: 5 },
  { name: "Joao Pedro",          age: 22, position: "FWD", overall: 80, potential: 88, value: 65.0,  teamIndex: 5 },
  { name: "Jarrod Bowen",        age: 28, position: "FWD", overall: 82, potential: 83, value: 55.0,  teamIndex: 5 },
  { name: "Lucas Paqueta",       age: 27, position: "MID", overall: 83, potential: 84, value: 60.0,  teamIndex: 5 },
  { name: "Moises Caicedo",      age: 23, position: "MID", overall: 83, potential: 89, value: 100.0, teamIndex: 5 },
  { name: "Marc Cucurella",      age: 26, position: "DEF", overall: 79, potential: 82, value: 35.0,  teamIndex: 5 },
  { name: "Robert Sanchez",      age: 27, position: "GK",  overall: 78, potential: 82, value: 28.0,  teamIndex: 5 },
  // Legends
  { name: "Didier Drogba",       age: 47, position: "FWD", overall: 72, potential: 72, value: 1.5,   teamIndex: 5 },
  { name: "Michael Essien",      age: 41, position: "MID", overall: 68, potential: 68, value: 1.0,   teamIndex: 5 },
  { name: "Gianfranco Zola",     age: 58, position: "FWD", overall: 67, potential: 67, value: 1.0,   teamIndex: 5 },

  // ── TEAM 6: Greystone FC ──────────────────────────────────────────────────
  // Everton / Leicester / Fulham
  { name: "Dominic Calvert-Lewin",age:27, position: "FWD", overall: 79, potential: 81, value: 35.0,  teamIndex: 6 },
  { name: "James Tarkowski",     age: 32, position: "DEF", overall: 79, potential: 79, value: 18.0,  teamIndex: 6 },
  { name: "Jordan Pickford",     age: 31, position: "GK",  overall: 82, potential: 82, value: 22.0,  teamIndex: 6 },
  { name: "Abdoulaye Doucoure",  age: 31, position: "MID", overall: 77, potential: 77, value: 15.0,  teamIndex: 6 },
  { name: "Vitaliy Mykolenko",   age: 25, position: "DEF", overall: 75, potential: 80, value: 22.0,  teamIndex: 6 },
  { name: "Stephy Mavididi",     age: 26, position: "FWD", overall: 76, potential: 80, value: 22.0,  teamIndex: 6 },
  { name: "Harry Winks",         age: 28, position: "MID", overall: 76, potential: 77, value: 16.0,  teamIndex: 6 },
  // Legends
  { name: "Robbie Fowler",       age: 50, position: "FWD", overall: 69, potential: 69, value: 1.0,   teamIndex: 6 },
  { name: "Tim Cahill",          age: 45, position: "MID", overall: 68, potential: 68, value: 1.0,   teamIndex: 6 },
  { name: "Peter Schmeichel",    age: 61, position: "GK",  overall: 70, potential: 70, value: 1.0,   teamIndex: 6 },

  // ── TEAM 7: Hartley Rovers ────────────────────────────────────────────────
  // Brighton / Brentford / Crystal Palace
  { name: "Evan Ferguson",       age: 20, position: "FWD", overall: 78, potential: 91, value: 60.0,  teamIndex: 7 },
  { name: "Kaoru Mitoma",        age: 27, position: "FWD", overall: 82, potential: 84, value: 55.0,  teamIndex: 7 },
  { name: "Michael Olise",       age: 23, position: "FWD", overall: 83, potential: 91, value: 70.0,  teamIndex: 7 },
  { name: "Eberechi Eze",        age: 26, position: "MID", overall: 83, potential: 87, value: 65.0,  teamIndex: 7 },
  { name: "Bryan Mbeumo",        age: 25, position: "FWD", overall: 82, potential: 86, value: 60.0,  teamIndex: 7 },
  { name: "Yoane Wissa",         age: 28, position: "FWD", overall: 79, potential: 81, value: 35.0,  teamIndex: 7 },
  { name: "Jason Steele",        age: 34, position: "GK",  overall: 76, potential: 76, value: 8.0,   teamIndex: 7 },
  // Legends
  { name: "Marc Vivien Foe",     age: 51, position: "MID", overall: 65, potential: 65, value: 1.0,   teamIndex: 7 },
  { name: "Chris Sutton",        age: 51, position: "FWD", overall: 67, potential: 67, value: 1.0,   teamIndex: 7 },
  { name: "Matt Le Tissier",     age: 56, position: "MID", overall: 70, potential: 70, value: 1.0,   teamIndex: 7 },

  // ── TEAM 8: Ironside City ─────────────────────────────────────────────────
  // Nottm Forest / Wolves / Bournemouth
  { name: "Nuno Tavares",        age: 24, position: "DEF", overall: 77, potential: 83, value: 28.0,  teamIndex: 8 },
  { name: "Callum Hudson-Odoi",  age: 24, position: "FWD", overall: 77, potential: 82, value: 25.0,  teamIndex: 8 },
  { name: "Hwang Hee-chan",       age: 28, position: "FWD", overall: 78, potential: 79, value: 25.0,  teamIndex: 8 },
  { name: "Matheus Cunha",       age: 25, position: "FWD", overall: 81, potential: 85, value: 50.0,  teamIndex: 8 },
  { name: "Jose Sa",             age: 31, position: "GK",  overall: 81, potential: 81, value: 20.0,  teamIndex: 8 },
  { name: "Dango Ouattara",      age: 22, position: "FWD", overall: 76, potential: 85, value: 35.0,  teamIndex: 8 },
  { name: "Murillo",             age: 22, position: "DEF", overall: 76, potential: 85, value: 32.0,  teamIndex: 8 },
  // Legends
  { name: "Stuart Pearce",       age: 62, position: "DEF", overall: 67, potential: 67, value: 1.0,   teamIndex: 8 },
  { name: "Steve Stone",         age: 52, position: "MID", overall: 65, potential: 65, value: 1.0,   teamIndex: 8 },
  { name: "Kevin Campbell",      age: 55, position: "FWD", overall: 66, potential: 66, value: 1.0,   teamIndex: 8 },

  // ── TEAM 9: Jarrow Athletic ───────────────────────────────────────────────
  // Ipswich / Southampton / Luton era
  { name: "Liam Delap",          age: 21, position: "FWD", overall: 77, potential: 87, value: 40.0,  teamIndex: 9 },
  { name: "Sammie Szmodics",     age: 29, position: "FWD", overall: 77, potential: 78, value: 20.0,  teamIndex: 9 },
  { name: "Cameron Burgess",     age: 29, position: "DEF", overall: 73, potential: 74, value: 8.0,   teamIndex: 9 },
  { name: "Christian Walton",    age: 30, position: "GK",  overall: 73, potential: 73, value: 6.0,   teamIndex: 9 },
  { name: "Massimo Luongo",      age: 32, position: "MID", overall: 73, potential: 73, value: 5.0,   teamIndex: 9 },
  { name: "Omari Hutchinson",    age: 21, position: "FWD", overall: 74, potential: 85, value: 28.0,  teamIndex: 9 },
  { name: "Dara O'Shea",         age: 26, position: "DEF", overall: 75, potential: 79, value: 15.0,  teamIndex: 9 },
  // Legends
  { name: "Mick Mills",          age: 76, position: "DEF", overall: 63, potential: 63, value: 0.5,   teamIndex: 9 },
  { name: "John Wark",           age: 68, position: "MID", overall: 65, potential: 65, value: 0.5,   teamIndex: 9 },
  { name: "Kevin Beattie",       age: 73, position: "DEF", overall: 64, potential: 64, value: 0.5,   teamIndex: 9 },

  // ── TEAM 10: Kendal Wanderers ─────────────────────────────────────────────
  // Leeds / Sheffield / Derby era
  { name: "Crysencio Summerville",age:23, position: "FWD", overall: 79, potential: 86, value: 45.0,  teamIndex: 10 },
  { name: "Patrick Bamford",     age: 31, position: "FWD", overall: 76, potential: 76, value: 12.0,  teamIndex: 10 },
  { name: "Illan Meslier",       age: 24, position: "GK",  overall: 76, potential: 82, value: 18.0,  teamIndex: 10 },
  { name: "Archie Gray",         age: 19, position: "MID", overall: 74, potential: 88, value: 38.0,  teamIndex: 10 },
  { name: "Ethan Nwaneri",       age: 18, position: "MID", overall: 72, potential: 90, value: 35.0,  teamIndex: 10 },
  { name: "Joe Rodon",           age: 27, position: "DEF", overall: 77, potential: 78, value: 18.0,  teamIndex: 10 },
  { name: "Junior Firpo",        age: 28, position: "DEF", overall: 75, potential: 76, value: 12.0,  teamIndex: 10 },
  // Legends
  { name: "Eric Cantona",        age: 58, position: "FWD", overall: 73, potential: 73, value: 1.5,   teamIndex: 10 },
  { name: "Gordon Strachan",     age: 67, position: "MID", overall: 67, potential: 67, value: 1.0,   teamIndex: 10 },
  { name: "David Batty",         age: 56, position: "MID", overall: 67, potential: 67, value: 1.0,   teamIndex: 10 },

  // ── TEAM 11: Lampton FC ───────────────────────────────────────────────────
  // West Ham / Palace / Burnley
  { name: "James Ward-Prowse",   age: 30, position: "MID", overall: 80, potential: 80, value: 25.0,  teamIndex: 11 },
  { name: "Said Benrahma",       age: 29, position: "FWD", overall: 79, potential: 80, value: 22.0,  teamIndex: 11 },
  { name: "Alphonse Areola",     age: 31, position: "GK",  overall: 79, potential: 79, value: 12.0,  teamIndex: 11 },
  { name: "Nayef Aguerd",        age: 28, position: "DEF", overall: 79, potential: 80, value: 22.0,  teamIndex: 11 },
  { name: "Savio",               age: 20, position: "FWD", overall: 78, potential: 89, value: 55.0,  teamIndex: 11 },
  { name: "Aaron Wan-Bissaka",   age: 27, position: "DEF", overall: 78, potential: 79, value: 20.0,  teamIndex: 11 },
  { name: "Carlos Baleba",       age: 21, position: "MID", overall: 76, potential: 87, value: 38.0,  teamIndex: 11 },
  // Legends
  { name: "Paolo Di Canio",      age: 56, position: "FWD", overall: 70, potential: 70, value: 1.0,   teamIndex: 11 },
  { name: "Julian Dicks",        age: 57, position: "DEF", overall: 66, potential: 66, value: 1.0,   teamIndex: 11 },
  { name: "Trevor Sinclair",     age: 51, position: "FWD", overall: 66, potential: 66, value: 1.0,   teamIndex: 11 },

  // ── TEAM 12: Moorgate City ────────────────────────────────────────────────
  // Man United legends heavy + current
  { name: "Harry Maguire",       age: 31, position: "DEF", overall: 78, potential: 78, value: 18.0,  teamIndex: 12 },
  { name: "Alejandro Garnacho",  age: 20, position: "FWD", overall: 80, potential: 90, value: 70.0,  teamIndex: 12 },
  { name: "Andre Onana",         age: 28, position: "GK",  overall: 82, potential: 83, value: 30.0,  teamIndex: 12 },
  { name: "Bruno Fernandes",     age: 30, position: "MID", overall: 86, potential: 86, value: 55.0,  teamIndex: 12 },
  { name: "Kobbie Mainoo",       age: 19, position: "MID", overall: 79, potential: 91, value: 65.0,  teamIndex: 12 },
  { name: "Lisandro Martinez",   age: 27, position: "DEF", overall: 84, potential: 85, value: 60.0,  teamIndex: 12 },
  { name: "Rasmus Hojlund",      age: 22, position: "FWD", overall: 80, potential: 89, value: 75.0,  teamIndex: 12 },
  // Legends
  { name: "Ryan Giggs",          age: 51, position: "MID", overall: 74, potential: 74, value: 1.5,   teamIndex: 12 },
  { name: "Ole Gunnar Solskjaer",age: 51, position: "FWD", overall: 70, potential: 70, value: 1.0,   teamIndex: 12 },
  { name: "Denis Irwin",         age: 59, position: "DEF", overall: 70, potential: 70, value: 1.0,   teamIndex: 12 },

  // ── TEAM 13: Norwood United ───────────────────────────────────────────────
  // Blackburn / Middlesbrough / Sunderland era
  { name: "Adam Wharton",        age: 20, position: "MID", overall: 76, potential: 86, value: 32.0,  teamIndex: 13 },
  { name: "Oliver Glasner",      age: 34, position: "MID", overall: 73, potential: 74, value: 8.0,   teamIndex: 13 },
  { name: "Chris Wood",          age: 32, position: "FWD", overall: 77, potential: 77, value: 12.0,  teamIndex: 13 },
  { name: "Sam Johnstone",       age: 31, position: "GK",  overall: 77, potential: 77, value: 10.0,  teamIndex: 13 },
  { name: "Daniel Munoz",        age: 28, position: "DEF", overall: 77, potential: 78, value: 16.0,  teamIndex: 13 },
  { name: "Jefferson Lerma",     age: 30, position: "MID", overall: 76, potential: 76, value: 12.0,  teamIndex: 13 },
  { name: "Marc Guehi",          age: 24, position: "DEF", overall: 81, potential: 85, value: 50.0,  teamIndex: 13 },
  // Legends
  { name: "Alan Shearer",        age: 54, position: "FWD", overall: 72, potential: 72, value: 1.5,   teamIndex: 13 },
  { name: "Chris Coleman",       age: 54, position: "DEF", overall: 64, potential: 64, value: 0.5,   teamIndex: 13 },
  { name: "Tim Flowers",         age: 58, position: "GK",  overall: 64, potential: 64, value: 0.5,   teamIndex: 13 },

  // ── TEAM 14: Oldfield Town ────────────────────────────────────────────────
  // Spurs legends + current
  { name: "Harry Kane",          age: 31, position: "FWD", overall: 91, potential: 91, value: 75.0,  teamIndex: 14 },
  { name: "Heung-min Son",       age: 32, position: "FWD", overall: 87, potential: 87, value: 45.0,  teamIndex: 14 },
  { name: "Hugo Lloris",         age: 38, position: "GK",  overall: 80, potential: 80, value: 5.0,   teamIndex: 14 },
  { name: "Dele Alli",           age: 29, position: "MID", overall: 75, potential: 76, value: 8.0,   teamIndex: 14 },
  { name: "Eric Dier",           age: 30, position: "DEF", overall: 77, potential: 77, value: 12.0,  teamIndex: 14 },
  { name: "Toby Alderweireld",   age: 36, position: "DEF", overall: 77, potential: 77, value: 5.0,   teamIndex: 14 },
  { name: "Jan Vertonghen",      age: 37, position: "DEF", overall: 76, potential: 76, value: 4.0,   teamIndex: 14 },
  // Legends
  { name: "Teddy Sheringham",    age: 58, position: "FWD", overall: 69, potential: 69, value: 1.0,   teamIndex: 14 },
  { name: "Jurgen Klinsmann",    age: 60, position: "FWD", overall: 71, potential: 71, value: 1.0,   teamIndex: 14 },
  { name: "Darren Anderton",     age: 52, position: "MID", overall: 68, potential: 68, value: 1.0,   teamIndex: 14 },

  // ── TEAM 15: Penrose United ───────────────────────────────────────────────
  // Leicester / Southampton / Watford
  { name: "Jamie Vardy",         age: 37, position: "FWD", overall: 78, potential: 78, value: 6.0,   teamIndex: 15 },
  { name: "James Justin",        age: 26, position: "DEF", overall: 78, potential: 81, value: 22.0,  teamIndex: 15 },
  { name: "Mads Hermansen",      age: 25, position: "GK",  overall: 77, potential: 83, value: 22.0,  teamIndex: 15 },
  { name: "Kiernan Dewsbury-Hall",age:26, position: "MID", overall: 79, potential: 82, value: 28.0,  teamIndex: 15 },
  { name: "Facundo Buonanotte",  age: 20, position: "MID", overall: 75, potential: 87, value: 32.0,  teamIndex: 15 },
  { name: "Victor Kristiansen",  age: 22, position: "DEF", overall: 75, potential: 83, value: 22.0,  teamIndex: 15 },
  { name: "Stevan Jovetic",      age: 35, position: "FWD", overall: 73, potential: 73, value: 3.0,   teamIndex: 15 },
  // Legends
  { name: "Emile Heskey",        age: 46, position: "FWD", overall: 67, potential: 67, value: 1.0,   teamIndex: 15 },
  { name: "Muzzy Izzet",         age: 50, position: "MID", overall: 65, potential: 65, value: 0.5,   teamIndex: 15 },
  { name: "Steve Walsh",         age: 61, position: "DEF", overall: 64, potential: 64, value: 0.5,   teamIndex: 15 },

  // ── TEAM 16: Queensbury FC ────────────────────────────────────────────────
  // Liverpool legends + current
  { name: "Luis Diaz",           age: 27, position: "FWD", overall: 86, potential: 89, value: 100.0, teamIndex: 16 },
  { name: "Darwin Nunez",        age: 25, position: "FWD", overall: 83, potential: 87, value: 80.0,  teamIndex: 16 },
  { name: "Cody Gakpo",          age: 25, position: "FWD", overall: 82, potential: 87, value: 65.0,  teamIndex: 16 },
  { name: "Ryan Gravenberch",    age: 22, position: "MID", overall: 83, potential: 89, value: 75.0,  teamIndex: 16 },
  { name: "Ibrahima Konate",     age: 25, position: "DEF", overall: 83, potential: 87, value: 60.0,  teamIndex: 16 },
  { name: "Andy Robertson",      age: 30, position: "DEF", overall: 83, potential: 83, value: 35.0,  teamIndex: 16 },
  { name: "Caoimhin Kelleher",   age: 25, position: "GK",  overall: 79, potential: 84, value: 30.0,  teamIndex: 16 },
  // Legends
  { name: "Robbie Fowler",       age: 50, position: "FWD", overall: 70, potential: 70, value: 1.5,   teamIndex: 16 },
  { name: "Jamie Carragher",     age: 46, position: "DEF", overall: 71, potential: 71, value: 1.0,   teamIndex: 16 },
  { name: "Sami Hyypia",         age: 51, position: "DEF", overall: 70, potential: 70, value: 1.0,   teamIndex: 16 },

  // ── TEAM 17: Redvale Athletic ─────────────────────────────────────────────
  // Newcastle / Sunderland / Middlesbrough era
  { name: "Fabian Schar",        age: 32, position: "DEF", overall: 80, potential: 80, value: 20.0,  teamIndex: 17 },
  { name: "Anthony Gordon",      age: 23, position: "FWD", overall: 82, potential: 88, value: 75.0,  teamIndex: 17 },
  { name: "Joelinton",           age: 28, position: "MID", overall: 81, potential: 82, value: 35.0,  teamIndex: 17 },
  { name: "Harvey Barnes",       age: 26, position: "FWD", overall: 80, potential: 83, value: 40.0,  teamIndex: 17 },
  { name: "Sven Botman",         age: 24, position: "DEF", overall: 80, potential: 84, value: 42.0,  teamIndex: 17 },
  { name: "Martin Dubravka",     age: 35, position: "GK",  overall: 79, potential: 79, value: 8.0,   teamIndex: 17 },
  { name: "Kieran Trippier",     age: 34, position: "DEF", overall: 82, potential: 82, value: 18.0,  teamIndex: 17 },
  // Legends
  { name: "Peter Beardsley",     age: 63, position: "FWD", overall: 69, potential: 69, value: 0.5,   teamIndex: 17 },
  { name: "Rob Lee",             age: 58, position: "MID", overall: 67, potential: 67, value: 0.5,   teamIndex: 17 },
  { name: "Shay Given",          age: 48, position: "GK",  overall: 68, potential: 68, value: 0.5,   teamIndex: 17 },

  // ── TEAM 18: Stonebridge FC ───────────────────────────────────────────────
  // Burnley / Sheffield Utd / Luton (lower PL clubs)
  { name: "Sander Berge",        age: 26, position: "MID", overall: 78, potential: 80, value: 22.0,  teamIndex: 18 },
  { name: "Zeki Amdouni",        age: 24, position: "FWD", overall: 75, potential: 82, value: 22.0,  teamIndex: 18 },
  { name: "James Trafford",      age: 22, position: "GK",  overall: 76, potential: 85, value: 25.0,  teamIndex: 18 },
  { name: "Hjalmar Ekdal",       age: 25, position: "DEF", overall: 74, potential: 80, value: 16.0,  teamIndex: 18 },
  { name: "Lyle Foster",         age: 24, position: "FWD", overall: 74, potential: 81, value: 16.0,  teamIndex: 18 },
  { name: "Josh Brownhill",      age: 29, position: "MID", overall: 75, potential: 76, value: 12.0,  teamIndex: 18 },
  { name: "Lorenz Assignon",     age: 24, position: "DEF", overall: 74, potential: 80, value: 14.0,  teamIndex: 18 },
  // Legends
  { name: "Glen Little",         age: 51, position: "FWD", overall: 65, potential: 65, value: 0.5,   teamIndex: 18 },
  { name: "Ian Wright",          age: 60, position: "FWD", overall: 70, potential: 70, value: 1.0,   teamIndex: 18 },
  { name: "Paul Warhurst",       age: 56, position: "DEF", overall: 64, potential: 64, value: 0.5,   teamIndex: 18 },

  // ── TEAM 19: Thornton City ────────────────────────────────────────────────
  // Fulham / Brentford / Crystal Palace lower tier
  { name: "Raul Jimenez",        age: 33, position: "FWD", overall: 79, potential: 79, value: 14.0,  teamIndex: 19 },
  { name: "Andreas Pereira",     age: 28, position: "MID", overall: 79, potential: 80, value: 22.0,  teamIndex: 19 },
  { name: "Bernd Leno",          age: 32, position: "GK",  overall: 80, potential: 80, value: 12.0,  teamIndex: 19 },
  { name: "Kenny Tete",          age: 29, position: "DEF", overall: 77, potential: 78, value: 14.0,  teamIndex: 19 },
  { name: "Harrison Reed",       age: 30, position: "MID", overall: 76, potential: 76, value: 10.0,  teamIndex: 19 },
  { name: "Issa Diop",           age: 27, position: "DEF", overall: 77, potential: 79, value: 16.0,  teamIndex: 19 },
  { name: "Tom Cairney",         age: 33, position: "MID", overall: 76, potential: 76, value: 8.0,   teamIndex: 19 },
  // Legends
  { name: "Louis Saha",          age: 46, position: "FWD", overall: 68, potential: 68, value: 1.0,   teamIndex: 19 },
  { name: "Edwin van der Sar",   age: 53, position: "GK",  overall: 70, potential: 70, value: 1.0,   teamIndex: 19 },
  { name: "Brian McBride",       age: 52, position: "FWD", overall: 65, potential: 65, value: 0.5,   teamIndex: 19 },
];

// ── Name pools for generated players ──────────────────────────────────────────
const FIRST_NAMES = [
  "James","Oliver","Jack","Harry","George","Noah","Charlie","Jacob","Alfie","Freddie",
  "Luca","Mason","Logan","Ethan","Lucas","Ryan","Tyler","Nathan","Callum","Kyle",
  "Marcus","Jamal","Raheem","Declan","Trent","Reece","Jordan","Tyrone","Leon","Darnell",
  "Marco","Sergio","Carlos","Diego","Pablo","Mateo","Ivan","Alexei","Nikolai","Stefan",
  "Mohammed","Omar","Youssef","Tariq","Amir","Samir","Karim","Bilal","Hamza","Zaid",
  "Finn","Cian","Seamus","Liam","Conor","Rory","Eoin","Padraig","Oisin","Ciarán",
  "Baptiste","Antoine","Pierre","Hugo","Maxime","Alexandre","Thomas","Remi","Loic","Theo",
  "Kylian","Ousmane","Ibrahima","Malang","Yacine","Adrien","Kingsley","Nuno","Diogo","Goncalo",
];

const LAST_NAMES = [
  "Smith","Jones","Williams","Brown","Taylor","Davies","Evans","Thomas","Roberts","Hughes",
  "Johnson","White","Martin","Thompson","Robinson","Clarke","Walker","Hall","Allen","Young",
  "Silva","Costa","Santos","Ferreira","Alves","Mendes","Sousa","Carvalho","Nunes","Moreira",
  "Garcia","Martinez","Lopez","Sanchez","Gonzalez","Perez","Rodriguez","Fernandez","Torres","Diaz",
  "Diallo","Traore","Kone","Toure","Coulibaly","Dembele","Camara","Keita","Sissoko","Konate",
  "Müller","Schmidt","Fischer","Hoffmann","Wagner","Schulz","Koch","Bauer","Richter","Klein",
  "Novak","Kovac","Petrovic","Djordjevic","Milosevic","Popovic","Jovanovic","Nikolic","Markovic","Ilic",
  "Obi","Mensah","Asante","Boateng","Ayew","Attah","Sarr","Ndiaye","Cisse","Sy",
];

// ── Utility helpers ────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

// ── Player object factory ─────────────────────────────────────────────────────

/** Build a player object from a real-player record */
function makeRealPlayer(data) {
  const ageMult = data.age <= 23 ? 1.6 : data.age <= 27 ? 1.2 : data.age <= 31 ? 0.85 : 0.5;
  return {
    id:          crypto.randomUUID(),
    name:        data.name,
    age:         data.age,
    position:    data.position,
    overall:     data.overall,
    potential:   data.potential,
    value:       data.value,
    isReal:      true,          // flag so UI can show ⭐
    teamId:      null,
    goals:       0,
    assists:     0,
    gamesPlayed: 0,
  };
}

/** Generate a single random player */
function generatePlayer(position, minOvr = 45, maxOvr = 82) {
  const overall   = randInt(minOvr, maxOvr);
  const age       = randInt(17, 34);
  const maxPot    = Math.min(99, overall + randInt(0, Math.max(0, 30 - (age - 17) * 2)));
  const potential = Math.max(overall, randInt(overall, maxPot));
  const ageMult   = age <= 23 ? 1.6 : age <= 27 ? 1.2 : age <= 31 ? 0.85 : 0.5;
  const value     = parseFloat((((overall - 40) / 60) * 80 * ageMult + randInt(1, 5)).toFixed(1));

  return {
    id:          crypto.randomUUID(),
    name:        randomName(),
    age,
    position,
    overall,
    potential,
    value:       Math.max(0.5, value),
    isReal:      false,
    teamId:      null,
    goals:       0,
    assists:     0,
    gamesPlayed: 0,
  };
}

// ── Squad building ────────────────────────────────────────────────────────────

/**
 * Fill remaining positional slots with generated players.
 * Ensures every team has at least: 2 GK, 5 DEF, 5 MID, 5 FWD (17 total min)
 * up to a full 23-man squad.
 */
function fillSquad(existingPlayers, tier) {
  const tierBonus = { 1: 10, 2: 0, 3: -8 };
  const bonus     = tierBonus[tier] || 0;
  const lo = Math.max(35, 48 + bonus);
  const hi = Math.min(88, 78 + bonus);

  // Count existing positions
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of existingPlayers) counts[p.position]++;

  const targets = { GK: 3, DEF: 6, MID: 7, FWD: 7 };
  const fillers = [];

  for (const pos of ["GK","DEF","MID","FWD"]) {
    const needed = Math.max(0, targets[pos] - counts[pos]);
    for (let i = 0; i < needed; i++) {
      fillers.push(generatePlayer(pos, lo, hi));
    }
  }
  return fillers;
}

// ── League generation ─────────────────────────────────────────────────────────

/**
 * Build all 20 teams.
 * Real players are placed first; generated players fill remaining slots.
 */
function generateLeague() {
  const teams      = [];
  const allPlayers = [];

  // Group real players by teamIndex
  const realByTeam = {};
  for (const rp of REAL_PLAYERS) {
    if (!realByTeam[rp.teamIndex]) realByTeam[rp.teamIndex] = [];
    realByTeam[rp.teamIndex].push(rp);
  }

  for (let i = 0; i < TEAM_TEMPLATES.length; i++) {
    const tmpl = TEAM_TEMPLATES[i];
    const tier  = i < 6 ? 1 : i < 14 ? 2 : 3;

    const team = {
      id:        `team_${i}`,
      name:      tmpl.name,
      badge:     tmpl.badge,
      colors:    tmpl.colors,
      tier,
      played:    0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, points: 0,
      budget:    tier === 1 ? randInt(60, 120) : tier === 2 ? randInt(25, 60) : randInt(8, 25),
      history:   [],
      playerIds: [],
    };

    // Add real players
    const reals = (realByTeam[i] || []).map(makeRealPlayer);
    // Add generated fillers
    const fakes = fillSquad(reals, tier);

    const squad = [...reals, ...fakes];
    for (const p of squad) {
      p.teamId = team.id;
      team.playerIds.push(p.id);
      allPlayers.push(p);
    }

    teams.push(team);
  }

  return { teams, players: allPlayers };
}

// ── Schedule generation ───────────────────────────────────────────────────────

function generateSchedule(teamIds) {
  const n        = teamIds.length;
  const fixtures = [];

  for (let half = 0; half < 2; half++) {
    const ids   = [...teamIds];
    const fixed = ids.pop();

    for (let round = 0; round < n - 1; round++) {
      const matchday = [];
      const a = half === 0 ? fixed : ids[0];
      const b = half === 0 ? ids[0] : fixed;
      matchday.push({ home: a, away: b });

      for (let k = 1; k < n / 2; k++) {
        const home = half === 0 ? ids[k]         : ids[n - 1 - k];
        const away = half === 0 ? ids[n - 1 - k] : ids[k];
        matchday.push({ home, away });
      }

      fixtures.push(matchday);
      ids.splice(1, 0, ids.pop());
    }
  }

  return fixtures.map((day, idx) => ({
    matchday: idx + 1,
    played:   false,
    matches:  day.map(f => ({
      home: f.home, away: f.away,
      homeScore: null, awayScore: null,
    })),
  }));
}

// ── Free agent pool ───────────────────────────────────────────────────────────

function generateFreeAgents(count = 40) {
  const agents    = [];
  const positions = ["GK","DEF","DEF","MID","MID","FWD"];
  for (let i = 0; i < count; i++) {
    const pos = pick(positions);
    const p   = generatePlayer(pos, 52, 76);
    p.teamId  = "free_agent";
    agents.push(p);
  }
  return agents;
}
