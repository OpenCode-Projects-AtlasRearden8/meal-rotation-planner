/* Tests for Meal Rotation Kitchen core logic + starter data.
 * Run with: npm test  (uses Node's built-in test runner, zero dependencies)
 */
'use strict';

var test = require('node:test');
var assert = require('node:assert');

var L = require('../js/logic.js');
var D = require('../js/data.js');

// ---------------------------------------------------------------------------
// Rotation / deck logic
// ---------------------------------------------------------------------------

test('cycleDeck moves the cooked meal to the back of the deck', function () {
  var deck = ['a', 'b', 'c', 'd'];
  assert.deepStrictEqual(L.cycleDeck(deck, 'b'), ['a', 'c', 'd', 'b']);
});

test('cycleDeck preserves the order of unrelated meals', function () {
  var deck = ['a', 'b', 'c', 'd', 'e'];
  assert.deepStrictEqual(L.cycleDeck(deck, 'a'), ['b', 'c', 'd', 'e', 'a']);
  assert.deepStrictEqual(L.cycleDeck(deck, 'e'), ['a', 'b', 'c', 'd', 'e']);
});

test('cycleDeck cycles fully: picking the last meal leaves the deck unchanged', function () {
  var deck = ['a', 'b', 'c'];
  assert.deepStrictEqual(L.cycleDeck(deck, 'c'), deck);
});

test('cycleDeck does not mutate the original deck array', function () {
  var deck = ['a', 'b', 'c'];
  var copy = deck.slice();
  var next = L.cycleDeck(deck, 'a');
  assert.notStrictEqual(next, deck);
  assert.deepStrictEqual(deck, copy);
});

test('cycleDeck ignores ids that are not in the deck (e.g. backup meals)', function () {
  var deck = ['a', 'b'];
  assert.deepStrictEqual(L.cycleDeck(deck, 'backup-1'), ['a', 'b']);
  assert.deepStrictEqual(L.cycleDeck(deck, null), ['a', 'b']);
});

test('suggestPick with no history picks the front of the deck', function () {
  assert.strictEqual(L.suggestPick(['a', 'b', 'c'], []), 'a');
  assert.strictEqual(L.suggestPick(['a', 'b', 'c'], null), 'a');
});

test('suggestPick skips meals cooked within the cooldown window', function () {
  var deck = ['a', 'b', 'c'];
  var log = [{ mealId: 'a', date: '2026-01-01' }];
  // Cooldown defaults to deck length - 1: only "a" is excluded.
  assert.strictEqual(L.suggestPick(deck, log), 'b');
});

test('suggestPick falls back to the front of the deck when everything is recent', function () {
  var deck = ['a', 'b'];
  var log = [
    { mealId: 'b', date: '2026-01-01' },
    { mealId: 'a', date: '2026-01-02' },
  ];
  assert.strictEqual(L.suggestPick(deck, log), 'b'); // least recently cooked
});

test('suggestPick handles an empty deck gracefully', function () {
  assert.strictEqual(L.suggestPick([], []), null);
});

test('a full rotation round-trip: each meal cooked once returns the deck to start', function () {
  var deck = ['a', 'b', 'c'];
  var log = [];
  ['a', 'b', 'c'].forEach(function (id) {
    log.push({ mealId: id, date: '2026-01-01' });
    deck = L.cycleDeck(deck, id);
  });
  assert.deepStrictEqual(deck, ['a', 'b', 'c']);
});

test('cookHistory returns newest-first dates for a meal', function () {
  var log = [
    { mealId: 'a', date: '2026-01-01' },
    { mealId: 'b', date: '2026-01-02' },
    { mealId: 'a', date: '2026-01-05' },
  ];
  assert.deepStrictEqual(L.cookHistory(log, 'a'), ['2026-01-05', '2026-01-01']);
  assert.deepStrictEqual(L.cookHistory(log, 'c'), []);
});

// ---------------------------------------------------------------------------
// List merging / shopping list
// ---------------------------------------------------------------------------

var tacos = {
  id: 'm1',
  name: 'Tacos',
  ingredients: [
    { name: 'Chicken', qty: 1, unit: 'lb', aisle: 'Meat' },
    { name: 'Tortillas', qty: 8, unit: '', aisle: 'Bakery' },
  ],
};

var bowls = {
  id: 'm2',
  name: 'Bowls',
  ingredients: [
    { name: 'chicken', qty: 0.5, unit: 'lb', aisle: 'Meat' },
    { name: 'Rice', qty: 2, unit: 'cup', aisle: 'Pantry' },
  ],
};

var pasta = {
  id: 'm3',
  name: 'Pasta',
  ingredients: [
    { name: 'Rice', qty: 1, unit: 'cup', aisle: 'Pantry' },
    { name: 'Parmesan', qty: 4, unit: 'oz', aisle: 'Dairy' },
  ],
};

function findRow(rows, name) {
  return rows.filter(function (r) { return r.name === name; });
}

test('mergeIngredients sums quantities of the same item across meals', function () {
  var rows = L.mergeIngredients([tacos, bowls, pasta]);
  var chicken = findRow(rows, 'Chicken');
  assert.strictEqual(chicken.length, 1);
  assert.strictEqual(chicken[0].qty, 1.5);
  assert.strictEqual(chicken[0].unit, 'lb');
  assert.deepStrictEqual(chicken[0].meals, ['Tacos', 'Bowls']);
});

test('mergeIngredients is case-insensitive on item names', function () {
  var rows = L.mergeIngredients([{ name: 'A', ingredients: [{ name: 'EGGS', qty: 2, unit: '', aisle: 'Dairy' }] },
                                  { name: 'B', ingredients: [{ name: 'eggs', qty: 1, unit: '', aisle: 'Dairy' }] }]);
  var eggs = findRow(rows, 'EGGS');
  assert.strictEqual(eggs.length, 1);
  assert.strictEqual(eggs[0].qty, 3);
});

test('mergeIngredients never mixes different units of the same item', function () {
  var rows = L.mergeIngredients([
    { name: 'A', ingredients: [{ name: 'Rice', qty: 2, unit: 'cup', aisle: 'Pantry' }] },
    { name: 'B', ingredients: [{ name: 'Rice', qty: 1, unit: 'lb', aisle: 'Pantry' }] },
    { name: 'C', ingredients: [{ name: 'rice', qty: 3, unit: 'cup', aisle: 'Pantry' }] },
  ]);
  var riceCup = rows.filter(function (r) { return r.name === 'Rice' && r.unit === 'cup'; });
  var riceLb = rows.filter(function (r) { return r.name === 'Rice' && r.unit === 'lb'; });
  assert.strictEqual(riceCup.length, 1);
  assert.strictEqual(riceCup[0].qty, 5);
  assert.strictEqual(riceLb.length, 1);
  assert.strictEqual(riceLb[0].qty, 1);
});

test('mergeIngredients keeps the aisle of the first sighting', function () {
  var rows = L.mergeIngredients([
    { name: 'A', ingredients: [{ name: 'Cilantro', qty: 1, unit: 'bunch', aisle: 'Produce' }] },
    { name: 'B', ingredients: [{ name: 'cilantro', qty: 1, unit: 'bunch', aisle: 'Pantry' }] },
  ]);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].aisle, 'Produce');
});

test('mergeIngredients drops blank ingredient rows but keeps zero-qty lines', function () {
  var rows = L.mergeIngredients([{
    name: 'A',
    ingredients: [
      { name: '', qty: 1, unit: '', aisle: 'Pantry' },
      { name: 'Salt to taste', qty: 0, unit: '', aisle: 'Pantry' },
      null,
    ],
  }]);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].name, 'Salt to taste');
});

test('mergeIngredients rounds float artifacts (0.1 + 0.2 = 0.3)', function () {
  var rows = L.mergeIngredients([
    { name: 'A', ingredients: [{ name: 'Oil', qty: 0.1, unit: 'tbsp', aisle: 'Pantry' }] },
    { name: 'B', ingredients: [{ name: 'Oil', qty: 0.2, unit: 'tbsp', aisle: 'Pantry' }] },
  ]);
  assert.strictEqual(rows[0].qty, 0.3);
});

test('buildShoppingList groups items under their aisle heading', function () {
  var list = L.buildShoppingList([tacos, bowls], []);
  var aisles = list.groups.map(function (g) { return g.aisle; });
  assert.deepStrictEqual(aisles, ['Bakery', 'Meat', 'Pantry']);
  var meat = list.groups.filter(function (g) { return g.aisle === 'Meat'; })[0];
  assert.strictEqual(meat.items[0].name, 'Chicken');
  assert.strictEqual(meat.items[0].buy, 1.5);
  assert.deepStrictEqual(meat.items[0].meals, ['Tacos', 'Bowls'],
    'rows remember which meals they came from (UI shows provenance)');
});

test('buildShoppingList subtracts pantry stock with a matching name+unit', function () {
  var pantry = [{ name: 'chicken', qty: 0.5, unit: 'lb' }];
  var list = L.buildShoppingList([tacos], pantry);
  var meat = list.groups.filter(function (g) { return g.aisle === 'Meat'; })[0];
  assert.strictEqual(meat.items[0].buy, 0.5);
  assert.strictEqual(meat.items[0].have, 0.5);
});

test('buildShoppingList clamps buys at zero when the pantry over-covers', function () {
  var list = L.buildShoppingList([tacos], [{ name: 'Chicken', qty: 2, unit: 'lb' }]);
  var aisles = list.groups.map(function (g) { return g.aisle; });
  assert.ok(aisles.indexOf('Meat') === -1, 'no Meat row: pantry covers the chicken');
  assert.strictEqual(list.stocked.length, 1);
  assert.strictEqual(list.stocked[0].name, 'Chicken');
  assert.strictEqual(list.stocked[0].have, 2);
  assert.strictEqual(list.stocked[0].need, 1);
});

test('buildShoppingList does not spend pantry stock of a different unit', function () {
  var list = L.buildShoppingList([pasta], [{ name: 'Rice', qty: 5, unit: 'lb' }]);
  var pantryGroup = list.groups.filter(function (g) { return g.aisle === 'Pantry'; })[0];
  assert.strictEqual(pantryGroup.items[0].buy, 1);
  assert.strictEqual(pantryGroup.items[0].have, 0);
  assert.strictEqual(pantryGroup.items[0].need, 1);
});

test('buildShoppingList adds duplicate pantry entries before subtracting', function () {
  var pantry = [
    { name: 'rice', qty: 1, unit: 'cup' },
    { name: 'Rice', qty: 1, unit: 'cup' },
  ];
  var list = L.buildShoppingList([pasta], pantry);
  assert.ok(list.groups.some(function (g) { return g.aisle === 'Dairy'; }),
    'rare Parmesan is not covered by rice');
  assert.ok(list.groups.every(function (g) { return g.aisle !== 'Pantry'; }),
    'rice fully covered by summed pantry stock');
  var rice = list.stocked.filter(function (s) { return s.name === 'Rice'; });
  assert.strictEqual(rice.length, 1);
  assert.strictEqual(rice[0].have, 2);
  assert.strictEqual(rice[0].need, 1);
});

test('buildShoppingList leaves the list alone for an empty pantry', function () {
  var list = L.buildShoppingList([pasta], []);
  assert.strictEqual(list.stocked.length, 0);
  assert.strictEqual(list.groups.length, 2);
});

// ---------------------------------------------------------------------------
// Leftover chips
// ---------------------------------------------------------------------------

test('buildLeftoverChips counts days left and sorts soonest-first', function () {
  var chips = L.buildLeftoverChips([
    { id: '1', name: 'Chili', cookedOn: '2026-03-01', goodForDays: 4 },
    { id: '2', name: 'Rice', cookedOn: '2026-03-03', goodForDays: 3 },
  ], '2026-03-04');
  assert.strictEqual(chips.length, 2);
  assert.strictEqual(chips[0].name, 'Chili');
  assert.strictEqual(chips[0].daysLeft, 1);
  assert.strictEqual(chips[1].name, 'Rice');
  assert.strictEqual(chips[1].daysLeft, 2);
});

test('buildLeftoverChips drops expired chips', function () {
  var chips = L.buildLeftoverChips([
    { id: '1', name: 'Chili', cookedOn: '2026-03-01', goodForDays: 4 },
  ], '2026-03-05');
  assert.strictEqual(chips.length, 0);
});

test('buildLeftoverChips flags same-day-expiry chips as urgent', function () {
  var chips = L.buildLeftoverChips([
    { id: '1', name: 'Pasta', cookedOn: '2026-03-01', goodForDays: 4 },
  ], '2026-03-04');
  assert.strictEqual(chips.length, 1);
  assert.strictEqual(chips[0].daysLeft, 1);
});

test('buildLeftoverChips defaults goodForDays to 3', function () {
  var chips = L.buildLeftoverChips([
    { id: '1', name: 'Mystery casserole', cookedOn: '2026-03-01' },
  ], '2026-03-02');
  assert.strictEqual(chips[0].goodForDays, 3);
  assert.strictEqual(chips[0].daysLeft, 2);
});

test('leftover date math is safe across daylight-saving boundaries', function () {
  var chips = L.buildLeftoverChips([
    { id: '1', name: 'Soup', cookedOn: '2026-02-28', goodForDays: 3 },
  ], '2026-03-01');
  assert.strictEqual(chips[0].daysLeft, 2);
});

// ---------------------------------------------------------------------------
// State sanitizer
// ---------------------------------------------------------------------------

test('sanitizeState removes deck entries for deleted meals and clears a dead pick', function () {
  var s = L.sanitizeState({
    meals: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    deck: ['a', 'ghost', 'a', 'b'],
    pick: 'ghost',
  }, { deck: [], meals: [], pantry: [], leftovers: [], cookLog: [] });
  assert.deepStrictEqual(s.deck, ['a', 'b']);
  assert.strictEqual(s.pick, null);
});

test('sanitizeState fills in missing collections', function () {
  var s = L.sanitizeState({}, { meals: [], deck: [], pantry: [], leftovers: [], cookLog: [] });
  assert.ok(Array.isArray(s.meals));
  assert.ok(Array.isArray(s.pantry));
  assert.ok(Array.isArray(s.cookLog));
});

test('sanitizeState drops pantry entries without a name', function () {
  var s = L.sanitizeState({
    pantry: [{ name: 'Rice', qty: 2, unit: 'cup' }, { qty: 1, unit: 'lb' }],
  }, { pantry: [] });
  assert.strictEqual(s.pantry.length, 1);
});

// ---------------------------------------------------------------------------
// Starter data integrity
// ---------------------------------------------------------------------------

test('starter data ships exactly six main meals', function () {
  var mains = D.STARTER_MEALS.filter(function (m) { return !m.isBackup; });
  assert.strictEqual(mains.length, 6);
  assert.strictEqual(D.starterState().deck.length, 6);
});

test('starter meals each have a name, notes, servings and a non-empty recipe', function () {
  D.STARTER_MEALS.forEach(function (meal) {
    assert.ok(meal.id, 'id');
    assert.ok(meal.name, 'name for ' + meal.id);
    assert.ok(meal.notes, 'notes for ' + meal.id);
    assert.ok(meal.servings >= 1, 'servings for ' + meal.id);
    assert.ok(Array.isArray(meal.ingredients) && meal.ingredients.length >= 2,
      'ingredients for ' + meal.id);
    meal.ingredients.forEach(function (ing) {
      assert.ok(ing.name, 'ingredient name in ' + meal.id);
      assert.strictEqual(typeof ing.qty, 'number', 'qty type in ' + meal.id);
      assert.ok(L.normalizeAisle(ing.aisle), 'aisle in ' + meal.id);
    });
  });
});

test('every backup meal is flagged as a backup and keeps out of the deck', function () {
  D.BACKUP_MEALS.forEach(function (b) {
    assert.strictEqual(b.isBackup, true, b.id);
    assert.strictEqual(D.starterState().deck.indexOf(b.id), -1);
  });
});

test('starterState is deep-fresh: mutating it cannot corrupt the templates', function () {
  var s1 = D.starterState();
  s1.meals[0].name = 'Hacked';
  s1.meals[0].ingredients.push({ name: 'Mystery', qty: 1, unit: '', aisle: 'Other' });
  var s2 = D.starterState();
  assert.strictEqual(D.STARTER_MEALS[0].name, 'Sheet-Pan Sausage & Veggies');
  assert.strictEqual(D.STARTER_MEALS[0].ingredients.some(function (i) { return i.name === 'Mystery'; }), false);
  assert.strictEqual(s2.meals[0].name, 'Sheet-Pan Sausage & Veggies');
});

test('starterState passes through its own sanitizer with a valid pick chain', function () {
  var s = L.sanitizeState(D.starterState(), D.starterState());
  assert.strictEqual(s.meals.length, 12);
  assert.strictEqual(s.deck.length, 6);
  assert.notStrictEqual(L.suggestPick(s.deck, s.cookLog), null);
});

test('utility helpers behave (dates, rounding, qty labels)', function () {
  assert.strictEqual(L.round2(0.1 + 0.2), 0.3);
  assert.strictEqual(L.diffDays('2026-01-01', '2026-01-08'), 7);
  assert.strictEqual(L.diffDays('2026-01-08', '2026-01-01'), -7);
  assert.strictEqual(L.addDaysStr('2026-01-30', 3), '2026-02-02');
  assert.strictEqual(L.qtyLabel(2), '2');
  assert.strictEqual(L.qtyLabel(1.5), '1.5');
  assert.strictEqual(L.qtyLabel(0), '');
});
