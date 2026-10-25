/*
 * Meal Rotation Kitchen - core logic.
 *
 * Pure functions only: no DOM, no storage, no I/O. This module runs in the
 * browser (exposed as window.MRPLogic) and under Node (module.exports) so the
 * same code that powers the app is covered by the automated tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MRPLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_AISLE = 'Other';

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function normalizeName(name) {
    return String(name == null ? '' : name).trim().toLowerCase();
  }

  function normalizeUnit(unit) {
    return String(unit == null ? '' : unit).trim().toLowerCase();
  }

  function normalizeAisle(aisle) {
    var a = String(aisle == null ? '' : aisle).trim();
    return a === '' ? DEFAULT_AISLE : a;
  }

  function todayISO(now) {
    var d = now ? new Date(now) : new Date();
    return localDateStr(d);
  }

  function localDateStr(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  // Whole days between two YYYY-MM-DD dates (positive when "to" is later).
  // Parsed as UTC noon so daylight-saving shifts cannot create off-by-one days.
  function diffDays(fromStr, toStr) {
    function parse(s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
      if (!m) return NaN;
      return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    }
    var from = parse(fromStr);
    var to = parse(toStr);
    if (isNaN(from) || isNaN(to)) return 0;
    return Math.round((to - from) / 86400000);
  }

  function addDaysStr(dateStr, days) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr));
    if (!m) return todayISO();
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    d.setDate(d.getDate() + Number(days));
    return localDateStr(d);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function qtyLabel(qty) {
    var n = Number(qty) || 0;
    if (n === 0) return '';
    if (Number.isInteger(n)) return String(n);
    return String(round2(n));
  }

  // ---------------------------------------------------------------------------
  // Deck rotation
  //
  // The meal deck is an ordered array of meal ids. Cooking today's pick moves
  // that meal to the back of the deck, so no meal repeats until everything else
  // has had a turn. "Too tired" backup meals never join the deck.
  // ---------------------------------------------------------------------------

  /**
   * Move a meal (by id) to the back of the deck. Deck order is otherwise kept
   * exactly as-is. Unknown ids are ignored, so callers never have to guard.
   */
  function cycleDeck(deck, mealId) {
    var d = clone(deck || []);
    var idx = d.indexOf(mealId);
    if (idx === -1) return d;
    d.splice(idx, 1);
    d.push(mealId);
    return d;
  }

  /**
   * Suggested "today's pick": the first meal in deck order that has not been
   * cooked within the last `cooldown` cooked-meals (so the deck naturally
   * rotates). If every meal is inside the cooldown window, falls back to the
   * first deck meal that was least recently cooked; for an empty log that is
   * simply the front of the deck.
   */
  function suggestPick(deck, cookLog, cooldown) {
    var d = deck || [];
    if (d.length === 0) return null;
    var windowSize = Math.max(0, cooldown == null ? Math.max(1, d.length - 1) : cooldown);
    var log = cookLog || [];
    var recent = log
      .slice(-windowSize)
      .map(function (entry) { return entry && entry.mealId; });

    for (var i = 0; i < d.length; i++) {
      if (recent.indexOf(d[i]) === -1) return d[i];
    }
    // Every meal is inside the cooldown: pick the least recently cooked one.
    for (var j = 0; j < d.length; j++) {
      for (var k = log.length - 1; k >= 0; k--) {
        if (log[k] && log[k].mealId === d[j]) break;
      }
      if (k < 0) return d[j];
    }
    return d[0];
  }

  /**
   * History entries for a meal id, newest first.
   */
  function cookHistory(cookLog, mealId) {
    return (cookLog || [])
      .filter(function (e) { return e && e.mealId === mealId; })
      .map(function (e) { return e.date; })
      .reverse();
  }

  // ---------------------------------------------------------------------------
  // Shopping list building
  //
  // Ingredients merge by normalized name + unit. Aisle is taken from the first
  // ingredient seen (defaults to "Other"), then rows are grouped by aisle.
  // ---------------------------------------------------------------------------

  /**
   * Merge the ingredient lists of one or more meals.
   * Returns rows keyed by name+unit with combined quantities.
   */
  function mergeIngredients(meals) {
    var byKey = {};
    var rows = [];
    var order = [];

    (meals || []).forEach(function (meal) {
      if (!meal || !Array.isArray(meal.ingredients)) return;
      meal.ingredients.forEach(function (ing) {
        if (!ing || normalizeName(ing.name) === '') return;
        var unit = normalizeUnit(ing.unit);
        var key = normalizeName(ing.name) + '|' + unit;
        var row = byKey[key];
        if (!row) {
          row = {
            key: key,
            name: String(ing.name).trim(),
            unit: ing.unit == null ? '' : String(ing.unit).trim(),
            aisle: normalizeAisle(ing.aisle),
            qty: 0,
            meals: [],
          };
          byKey[key] = row;
          rows.push(row);
          order.push(key);
        }
        row.qty += Number(ing.qty) || 0;
        var label = meal.name || meal.id || '';
        if (row.meals.indexOf(label) === -1) row.meals.push(label);
      });
    });

    rows.forEach(function (row) { row.qty = round2(row.qty); });
    return rows;
  }

  /**
   * Sum pantry entries so duplicate "rice, 1 cup" lines become one row.
   */
  function sumPantry(pantry) {
    var items = (pantry || []).filter(Boolean);
    var byKey = {};
    var qties = {};
    items.forEach(function (p) {
      var name = normalizeName(p.name);
      var unit = normalizeUnit(p.unit);
      var key = name + '|' + unit;
      if (!byKey[key]) {
        byKey[key] = { name: name, unit: unit, qty: 0 };
        qties[key] = byKey[key];
      }
      qties[key].qty += Number(p.qty) || 0;
    });
    var map = {};
    Object.keys(qties).forEach(function (k) {
      map[k] = { name: qties[k].name, unit: qties[k].unit, qty: round2(qties[k].qty) };
    });
    return map;
  }

  /**
   * Build the grouped shopping list for the planned meals.
   *
   * - Rows merge across meals (same name + unit).
   * - Pantry stock is subtracted only when both the name and the unit match;
     a pantry item measured differently is never silently spent.
   * - Rows fully covered by the pantry move to a separate "already stocked"
   *   section so the store trip stays short.
   *
   * Returns { groups: [{aisle, items:[{name, buy, unit, have, need}]}],
   *           stocked: [{name, need, have, unit, aisle}] }.
   */
  function buildShoppingList(meals, pantry) {
    var merged = mergeIngredients(meals);
    var pantryMap = sumPantry(pantry);
    var need = [];
    var stocked = [];

    merged.forEach(function (row) {
      var have = pantryMap[row.key];
      var haveQty = have ? have.qty : 0;
      var buy = round2(Math.max(0, row.qty - haveQty));
      if (have && buy <= 0) {
        stocked.push({
          name: row.name,
          need: row.qty,
          have: round2(haveQty),
          unit: row.unit,
          aisle: row.aisle,
        });
      } else {
        need.push({
          name: row.name,
          buy: buy,
          need: row.qty,
          have: round2(haveQty),
          unit: row.unit,
          aisle: row.aisle,
          meals: row.meals,
        });
      }
    });

    var aisleOrder = [];
    var groups = {};
    need.forEach(function (r) {
      var aisle = r.aisle || DEFAULT_AISLE;
      if (!groups[aisle]) {
        groups[aisle] = [];
        aisleOrder.push(aisle);
      }
      groups[aisle].push(r);
    });

    aisleOrder.sort(function (a, b) { return a.localeCompare(b); });
    return {
      groups: aisleOrder.map(function (aisle) {
        return { aisle: aisle, items: groups[aisle] };
      }),
      stocked: stocked.sort(function (a, b) { return a.name.localeCompare(b.name); }),
    };
  }

  // ---------------------------------------------------------------------------
  // Leftover reminder chips
  // ---------------------------------------------------------------------------

  /**
   * Turn cooked leftover events into fresh/expiring chips.
   * Events: [{id, name, cookedOn, goodForDays}]. Chips active while days
   * remaining > 0; expired events are dropped entirely.
   * Returns active chips (soonest to expire first) plus anything expired today.
   */
  function buildLeftoverChips(events, todayStr) {
    var today = todayStr || todayISO();
    return (events || [])
      .filter(function (e) { return e && e.name; })
      .map(function (e) {
        var goodFor = Math.max(1, Number(e.goodForDays) || 3);
        var age = diffDays(e.cookedOn, today);
        return {
          id: e.id,
          name: e.name,
          cookedOn: e.cookedOn,
          goodForDays: goodFor,
          daysLeft: goodFor - age,
        };
      })
      .filter(function (c) { return c.daysLeft > 0; })
      .sort(function (a, b) {
        if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
        return String(a.cookedOn).localeCompare(String(b.cookedOn));
      });
  }

  // ---------------------------------------------------------------------------
  // State guards
  // ---------------------------------------------------------------------------

  /**
   * Repair a loaded state object so the UI can always render: removes deck
   * entries whose meals vanished, keeps ids unique, and fills missing fields.
   */
  function sanitizeState(state, defaults) {
    var s = clone(state || {});
    var out = clone(defaults || {});
    Object.keys(out).forEach(function (k) {
      if (s[k] === undefined) s[k] = out[k];
    });
    var byId = {};
    s.meals = (Array.isArray(s.meals) ? s.meals : []).filter(function (m) {
      if (!m || !m.id || byId[m.id]) return false;
      m.name = String(m.name || 'Untitled meal');
      m.ingredients = Array.isArray(m.ingredients) ? m.ingredients.filter(Boolean) : [];
      m.leftovers = Array.isArray(m.leftovers) ? m.leftovers.filter(Boolean) : [];
      m.inPlan = Boolean(m.inPlan);
      byId[m.id] = m;
      return true;
    });
    var deckSeen = {};
    s.deck = (Array.isArray(s.deck) ? s.deck : []).filter(function (id) {
      if (!byId[id] || deckSeen[id]) return false;
      deckSeen[id] = true;
      return true;
    });
    s.pantry = (Array.isArray(s.pantry) ? s.pantry : []).filter(function (p) {
      return p && normalizeName(p.name) !== '';
    });
    s.leftovers = (Array.isArray(s.leftovers) ? s.leftovers : []).filter(Boolean);
    s.cookLog = (Array.isArray(s.cookLog) ? s.cookLog : []).filter(Boolean);
    s.pick = s.pick && byId[s.pick] ? s.pick : null;
    return s;
  }

  return {
    DEFAULT_AISLE: DEFAULT_AISLE,
    round2: round2,
    normalizeName: normalizeName,
    normalizeUnit: normalizeUnit,
    normalizeAisle: normalizeAisle,
    todayISO: todayISO,
    localDateStr: localDateStr,
    diffDays: diffDays,
    addDaysStr: addDaysStr,
    clone: clone,
    qtyLabel: qtyLabel,
    cycleDeck: cycleDeck,
    suggestPick: suggestPick,
    cookHistory: cookHistory,
    mergeIngredients: mergeIngredients,
    sumPantry: sumPantry,
    buildShoppingList: buildShoppingList,
    buildLeftoverChips: buildLeftoverChips,
    sanitizeState: sanitizeState,
  };
});
