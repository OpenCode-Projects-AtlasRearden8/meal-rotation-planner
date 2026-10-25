# Meal Rotation Kitchen 🍲

An **offline, zero-dependency** meal planner for low-energy home cooking, made by
[Asdale Dynamics, LLC](https://dylanasdale.github.io) in the spirit of "explain it
like a friend would."

You keep a deck of meals in the order you actually feel like eating them. Cook
one and it goes to the back of the deck — nothing repeats until everything has
had a turn. Open the fridge side of your brain and close the "what's for
dinner?!" tab for good.

## Why you might like it

- **Zero setup.** Pure HTML/JS/CSS. No build step, no install, no server, no
  accounts, no network. Double-click `index.html` and you're running it.
- **Local-first.** Everything lives in your browser's `localStorage` on your
  device. Nothing leaves this folder.
- **Gentle on low-energy days.** It never guilts you. There's a whole row of
  frozen/near-instant "too tired" backup meals for exactly those nights.
- **ADHD-friendly.** One screen shows: today's pick, what's expiring soon, and
  what to buy — so dinner decisions cost one glance instead of ten tabs.

## Features

### The meal deck
Six starter meals ship with the app, each with a short, real-human recipe.
Cook tonight's pick and it moves to the **back of the deck**, so meals rotate
naturally without you thinking about it. Drag cards to reorder, tap **Pick** to
make something today's dinner, and **Edit** any recipe — including swapping in
your family's actual meals.

### Today's pick
Drag any meal card into the "Today" dropzone (or press **Pick** — drag and
keyboard-friendly both work). When you've eaten, hit **Cooked it**: the meal
cycles to the back of the deck and your recipe's declared leftovers become
reminder chips.

### Shopping list, auto-generated
Every meal has an **Add to list** checkbox, and today's pick is always
included. Ingredients from several typed-in recipes are **merged**
("chicken, 1 lb" + "chicken, 0.5 lb" → one line: 1.5 lb) and **grouped by
grocery-store aisle** so your trip through the store is one pass.

### Pantry list
Type what you already have ("rice, 6 cup"). Items whose **name and unit match**
a recipe line are subtracted from the shopping list. Anything fully covered
moves to an "Already in pantry (no need to buy)" section. Different units are
never silently mixed — 5 lb of rice won't pay your "1 cup" debt.

### Leftover reminder chips
Cooked chili on Monday? A chip appears: 🥡 *Chili — 4 days*, and it turns
urgent (⚠️) on its last day, then disappears. Good for: yesterday's rice,
half the sheet-pan sausage, existence in general.

### Too-tired backups
A row of frozen/near-instant meals (frozen burritos, potstickers + rice,
box mac & cheese…) that never rotate and never judge. One tap: **Use instead**
for tonight. Cooking one doesn't disturb your deck.

### Your data is yours
- **Export** downloads a JSON backup file.
- **Import** restores from that file — handy across browsers or after a reset.
- **Reset to starters** brings back the original six meals.

## Getting started

Option 1 — just open it:

1. Download/clone this folder.
2. Double-click `index.html` (or open it in any modern browser).

Option 2 — serve it (only if you prefer):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

That's it. No dependencies, no install, works from `file://`.

## How the rotation & list logic works (nerd corner)

The deck is a plain array of meal ids; `js/logic.js` holds all the pure logic:

| Function                | What it does |
| ----------------------- | ------------ |
| `cycleDeck(deck, id)`   | Moves a meal to the back (the rotation core) |
| `suggestPick(deck, log)`| Front-of-deck suggestion that skips recently cooked meals |
| `mergeIngredients(map)` | Sums quantities across meals, case-insensitive, unit-safe |
| `buildShoppingList(meals, pantry)` | Merges, subtracts pantry stock (matching name + unit), groups by aisle |
| `buildLeftoverChips(events)` | Days-remaining math with DST-safe date handling |

## Running the tests

The UI logic is covered by tests using **Node's built-in test runner** — no
packages to install:

```bash
npm test        # runs node --test tests/
```

Covers rotation (deck cycling, suggestions, round-trips), list merging
(summing, unit separation, aisle grouping, pantry subtraction and its
edge cases), leftover chip expiry, state sanitizing, and starter-data integrity.

## Project layout

```
index.html          the app
css/styles.css      styles
js/logic.js         pure logic (rotation, merging, chips) — testable, no DOM
js/data.js          the six starter meals + too-tired backups
js/app.js           rendering, drag & drop, localStorage
tests/logic.test.js tests
```

## Privacy

No analytics, no requests, no accounts, no cookies. Your meals and pantry
stay on your device. Export files are JSON you own.

## Credits

Meal Rotation Kitchen is a project of **Asdale Dynamics, LLC** — the company
behind *The Massive AI Manual* and [dylanasdale.github.io](https://dylanasdale.github.io),
which explains AI like a friend would: plain English, step by step, never
condescending.

## License

MIT — see [LICENSE](LICENSE). © 2026 Asdale Dynamics, LLC.
