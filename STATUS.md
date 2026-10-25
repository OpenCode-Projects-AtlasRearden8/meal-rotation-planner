# STATUS.md — Meal Rotation Kitchen

Last updated: 2026-10-25

## What was built

A complete, offline, zero-dependency web app for low-energy home cooking:

- **Rotating meal deck** — 6 starter meals with typed recipes. Cooking
  tonight's pick cycles it to the back of the deck; drag cards to reorder;
  front-of-deck suggestion + full cooked history per meal.
- **Today's pick** — HTML5 drag & drop onto a dropzone (plus buttons for
  keyboard/mouse-only users), "Cooked it" button that rotates the deck and logs
  the meal with today's date.
- **Auto-generated grouped shopping list** — merges ingredients across checked
  meals (case-insensitive, sums quantities, keeps different units separate),
  groups by grocery aisle, and shows which meals each line came from.
- **Pantry list** — chips of what you already have; matching name+unit stock is
  subtracted from the list (clamped at zero), fully-covered items move to an
  "Already in pantry" section, mismatched units are never silently mixed.
- **Leftover-reminder chips** — cooking a meal (or manually adding a chip)
  creates reminders with days-remaining counts, urgent styling on the last day,
  auto-removal after expiry, DST-safe date math.
- **Too-tired backup row** — 6 frozen/near-instant backup meals that never
  rotate; one tap makes one tonight's pick.
- **Meal editor** — dialog form for creating/editing meals, recipes
  (item/qty/unit/aisle rows), leftover declarations, effort, servings, notes.
- **Data safety** — everything persists in `localStorage`; Export downloads a
  JSON backup; Import restores it; Reset returns to starter state. A
  sanitizer repairs corrupt/partial data and removes dangling deck entries.
- **Runs from `file://`** — plain script tags, no modules, no build step, no
  network requests, no secrets, no personal data.

Ships as: `index.html`, `css/styles.css`, `js/logic.js` (pure logic),
`js/data.js` (starter meals/backups), `js/app.js` (UI), `tests/logic.test.js`,
`README.md`, `LICENSE`, `package.json`.

## How to run it

```bash
# Option 1: just open it
open index.html            # (double-click works too; plain file:// is fine)

# Option 2: serve locally (optional)
python3 -m http.server 8000   # then visit http://localhost:8000

# Run the test suite (Node 18+; built-in runner, no packages to install)
npm test
```

## Verification results

- `npm test` — **37/37 passing** (Node v20.19.2, `node --test tests/`).
  Covers: rotation (cycleDeck, suggestion logic, full-deck round-trips,
  immutability), shopping-list merging (summing, unit separation, aisle
  grouping, pantry subtraction/over-cover/mixed-unit edge cases), leftover chip
  expiry/urgency/DST, state sanitizer, and starter-data integrity (6 main
  meals, backups flagged, templates protected from mutation).
- `node --check` — passes for all three JS files (syntax clean).
- Headless DOM smoke run (stubbed `document`/`localStorage` executing the real
  `app.js`): app boots and renders all sections, drag-to->pick sets state,
  cooking cycles starter-1 to the back of the deck, clears the pick, creates a
  leftover chip, and persists to localStorage. This is how the
  `buildShoppingList` missing-`meals`-array bug was caught and fixed.
- File-protocol compatibility appears safe by construction: no ES modules, no
  fetch, all asset paths relative. It has not been eyeballed in an actual
  desktop browser in this environment (see gaps).

## Known gaps / future ideas

- No automated *browser* end-to-end test (no headless browser available in
  this workspace); automation coverage is logic-level plus the smoke run.
- No image import for meals (text recipes only — which is the point).
- No calendar/scheduling view; rotation is implicit via deck order rather
  than calendar slots. History is a simple cooked-meal log with dates.
- Drag-and-drop reordering does not support touch-drag on all mobile
  browsers (HTML5 DnD limitation); the Pick/Cooked buttons cover that path.
- Import does no schema-versioning beyond the sanitizer's repair pass.
- No dark mode (light-cozy theme only).
