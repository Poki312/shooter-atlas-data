#!/usr/bin/env node
// Read Valve's current-player count for one or more Steam app ids.
//
//   node tools/steam-current-players.mjs 1867240 393380
//   node tools/steam-current-players.mjs wardogs squad
//   node tools/steam-current-players.mjs --file data/appids.txt --format csv
//
// The endpoint is Valve's own and needs no key:
//   https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=<id>
//
// It answers "how many accounts have this game open right now" and nothing
// else: no history, no per-server split, no console numbers. One request per
// app id. A read that fails is printed as a failure with the reason, and is
// never counted as zero — a zero is a real reading of an empty game.
//
// No dependencies. Node 18 or newer (for fetch).
import { readFile } from "node:fs/promises";

const ENDPOINT = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=";

// App ids this file knows by name, so a command line can say "wardogs".
const NAMES = {
  wardogs: 1867240,
  squad: 393380,
  foxhole: 505460,
  "hell-let-loose": 686810,
  hellletloose: 686810,
  "arma-reforger": 1874880,
  armareforger: 1874880,
  "rising-storm-2": 418460,
  risingstorm2: 418460,
};

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};

const format = flag("--format", "table");
const file = flag("--file", null);
const wanted = [];
const names = new Map();
// A name given on the command line is also the label for the output.
for (const [name, id] of Object.entries(NAMES)) {
  if (!names.has(String(id))) names.set(String(id), name);
}

function add(raw, label) {
  // Always a string: the same value has to key the name map and build the URL.
  const id = /^\d+$/.test(raw) ? raw : String(NAMES[String(raw).toLowerCase()] ?? "");
  if (!/^\d+$/.test(id)) {
    console.error("not an app id and not a known name: " + raw);
    process.exitCode = 1;
    return;
  }
  if (!wanted.includes(id)) wanted.push(id);
  if (label) names.set(id, label);
}

if (file) {
  // One per line: "<appid> [tab or space] <name>", # for comments.
  for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [id, ...rest] = t.split(/[\t ]+/);
    add(id, rest.join(" "));
  }
}
for (const a of argv) if (!a.startsWith("--")) add(a, null);

if (!wanted.length) {
  console.error("usage: node tools/steam-current-players.mjs <appid|name> ... [--file <list>] [--format table|csv|json]");
  process.exit(2);
}

const read = async (appid) => {
  const url = ENDPOINT + appid;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "shooter-atlas-data/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.json();
    if (res.status !== 200 || body?.response?.result !== 1) {
      return { appid, ok: false, error: "HTTP " + res.status + " result " + (body?.response?.result ?? "?") };
    }
    return { appid, ok: true, count: body.response.player_count };
  } catch (err) {
    return { appid, ok: false, error: String((err && err.message) || err) };
  }
};

const read_at_utc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const rows = [];
for (const appid of wanted) {
  const r = await read(appid);
  rows.push({ ...r, game: names.get(appid) || "", read_at_utc });
}

if (format === "json") {
  console.log(JSON.stringify({ source: ENDPOINT, read_at_utc, results: rows }, null, 2));
} else if (format === "csv") {
  console.log("game,steam_appid,accounts_open,read_at_utc,error");
  for (const r of rows) {
    console.log([r.game, r.appid, r.ok ? r.count : "", r.read_at_utc, r.ok ? "" : r.error].join(","));
  }
} else {
  const width = Math.max(5, ...rows.map((r) => (r.game || String(r.appid)).length));
  console.log("read " + read_at_utc + "  (Valve GetNumberOfCurrentPlayers)");
  for (const r of rows) {
    const label = (r.game || "(app " + r.appid + ")").padEnd(width);
    console.log("  " + label + "  " + (r.ok ? String(r.count).padStart(9) : "FAILED: " + r.error));
  }
}

if (rows.some((r) => !r.ok)) process.exitCode = 1;
