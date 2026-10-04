# Large-scale tactical shooter data, as read

Dated readings and reference tables for large-scale tactical shooters (a match
holds dozens to a hundred players), collected by [Shooter Atlas](https://shooteratlas.com)
and published here as plain CSV and JSON so the numbers can be cited, checked
and reused without scraping a page.

Every file carries the day — or the minute — its figures were read. That is the
point of the repository: a concurrency number without the moment it was taken
is not evidence, it is a rumour with a decimal point.

## What is in here

| File | What it holds | Read |
|---|---|---|
| `data/steam-current-players.csv` · `.json` | Valve's own count of accounts with each game open, from the public `GetNumberOfCurrentPlayers` endpoint — one row per game | the minute in each row (`2026-10-04T00:15Z` for this copy) |
| `data/appids.txt` | the Steam app ids those readings cover | — |
| `data/wardogs-achievements.csv` | all ten WARDOGS achievements with Valve's global unlock rate for each | 28 September 2026 |
| `data/wardogs-price-by-region.csv` | base game and Supporter Edition price in nine Steam regions, and the premium between them | 29 September 2026 |
| `data/wardogs-languages.csv` | the fourteen languages on the store page, column by column: interface, full audio, subtitles | 30 September 2026 |
| `data/wardogs-steam-genres.csv` · `-categories.csv` | the genre and category ids Valve stores for the game | 30 September 2026 |
| `data/wardogs-map-towers.csv` · `-summary.csv` | the twelve tower positions the community projects agree on, in kilometres from the west and north edges of a 16 × 16 km grid | 3 October 2026 |
| `data/wardogs-map-points.json` | the same positions with each one's own source, as served to the site's map page | 3 October 2026 |
| `tools/steam-current-players.mjs` | reads the current count for a list of app ids and prints a table, CSV or JSON | — |

## Where the numbers come from

Three kinds, and each file names the one it uses:

- **Valve's public endpoints.** `api.steampowered.com` — `GetNumberOfCurrentPlayers`
  for the live count, `appdetails` for prices, languages, genres and platforms.
  No key, no sign-in, one request per app id.
- **Community projects.** For the map positions, several independent projects
  each publish a set of coordinates. `wardogs-map-towers.csv` records how far
  apart they place the same tower instead of silently picking one of them.
- **Readings taken in the game**, where a figure exists on no public page. Where
  that applies, the file that carries it says so.

Nothing here is estimated or filled in. The Russian row of the price table is
empty because Valve's Russian store view returned no price for either edition;
the "Not published" row of the achievements table is Valve's own state, not a
translation failure.

## Use

No dependencies. Node 18 or newer (for `fetch`).

```sh
node tools/steam-current-players.mjs 1867240 393380 505460
node tools/steam-current-players.mjs --file data/appids.txt --format csv
node tools/steam-current-players.mjs wardogs --format json
```

The script prints a table by default, and CSV or JSON on request. An app id
Valve does not answer for is reported as a failure with the reason; it never
becomes a zero.

## Reuse

Cite Shooter Atlas and the read date. The useful citation is the page a figure
came from — the `page` column carries it — because that page also carries the
source link and says what the number cannot tell you.

## What these files do not say

- A Steam count is **sessions with the game open**, not people in a match. Menu,
  queue and idle all land in the same number, and only the studio's own tools
  can split it.
- A **concurrency peak** is not a fact about a game; it is the highest number one
  sampler happened to catch. Two trackers with different intervals will disagree
  and neither is lying. Valve publishes no history of its own.
- **Prices are regional store views, not conversions.** Converting one region's
  price into another currency produces a number nobody can pay.
- The map positions are **community readings of game files**, not the studio's
  data, and agreement between projects is not confirmation.
