/* Meal Rotation Kitchen - app layer.
 * Renders UI from state, mutates state through MRPLogic helpers, and
 * persists everything to localStorage. Works from file:// with no server.
 */
(function () {
  'use strict';

  var L = window.MRPLogic;
  var D = window.MRPData;
  var STORAGE_KEY = 'meal-rotation-kitchen-v1';
  var AISLES = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Frozen', 'Bakery', 'Other'];

  var state = null;
  var dialogMealId = null;

  var $ = function (sel) { return document.querySelector(sel); };

  function uid() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('Could not save: ' + err.message);
    }
  }

  function load() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      raw = null;
    }
    var parsed = raw ? tryParse(raw) : null;
    return L.sanitizeState(parsed, D.starterState());
  }

  function tryParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function mealById(id) {
    for (var i = 0; i < state.meals.length; i++) {
      if (state.meals[i].id === id) return state.meals[i];
    }
    return null;
  }

  function deckMeals() {
    return state.deck.map(mealById).filter(Boolean);
  }

  function today() {
    return L.todayISO();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function render() {
    renderPick();
    renderLeftovers();
    renderDeck();
    renderShopping();
    renderPantry();
    renderBackups();
  }

  /* --- Today's pick ------------------------------------------------------ */

  function renderPick() {
    var zone = $('#pick-zone');
    var empty = $('#pick-empty');
    var card = $('#pick-card');
    var meal = state.pick ? mealById(state.pick) : null;

    var suggestion = L.suggestPick(state.deck, state.cookLog);
    var sMeal = suggestion ? mealById(suggestion) : null;
    $('#suggest-line').textContent = sMeal
      ? 'Deck suggests: ' + sMeal.name + ' (front of the rotation)'
      : 'Add meals to your deck to get suggestions.';

    if (!meal) {
      empty.hidden = false;
      card.hidden = true;
      zone.classList.remove('has-pick');
      return;
    }
    empty.hidden = true;
    card.hidden = false;
    zone.classList.add('has-pick');

    $('#pick-name').textContent = meal.name;
    $('#pick-notes').textContent = meal.notes || '';
    $('#pick-effort').textContent = meal.isBackup ? 'backup meal' : (meal.effort || 'easy');
    $('#pick-servings').textContent = meal.servings ? 'feeds ' + meal.servings : '';
  }

  /* --- Leftover chips ---------------------------------------------------- */

  function renderLeftovers() {
    var wrap = $('#leftover-chips');
    clearChildren(wrap);
    var chips = L.buildLeftoverChips(state.leftovers, today());
    if (chips.length === 0) {
      var note = document.createElement('span');
      note.className = 'empty-note';
      note.textContent = 'No leftovers waiting right now.';
      wrap.appendChild(note);
      return;
    }
    chips.forEach(function (chip) {
      var el = document.createElement('span');
      el.className = 'chip ' + (chip.daysLeft <= 1 ? 'chip-soon' : 'chip-fresh');
      var icon = chip.daysLeft <= 1 ? '⚠️' : '🥡';
      var dayTxt = chip.daysLeft === 1 ? '1 day' : chip.daysLeft + ' days';
      el.textContent = icon + ' ' + chip.name + ' — ' + dayTxt;
      el.title = 'Cooked ' + chip.cookedOn + ', good for ' + chip.goodForDays + ' days';
      var x = document.createElement('button');
      x.className = 'chip-x';
      x.type = 'button';
      x.setAttribute('aria-label', 'Dismiss leftover reminder');
      x.textContent = '×';
      x.addEventListener('click', function () {
        state.leftovers = state.leftovers.filter(function (e) { return e.id !== chip.id; });
        save();
        renderLeftovers();
      });
      el.appendChild(x);
      wrap.appendChild(el);
    });
  }

  /* --- Meal deck --------------------------------------------------------- */

  function renderDeck() {
    var grid = $('#meal-grid');
    clearChildren(grid);
    var meals = deckMeals();

    if (meals.length === 0) {
      var note = document.createElement('p');
      note.className = 'empty-note';
      note.textContent = 'No meals yet — press “+ New meal” to add your first recipe.';
      grid.appendChild(note);
      return;
    }

    meals.forEach(function (meal) {
      grid.appendChild(buildMealCard(meal));
    });
  }

  function buildMealCard(meal) {
    var card = document.createElement('article');
    card.className = 'meal-card';
    card.dataset.mealId = meal.id;
    card.draggable = true;
    if (meal.id === state.pick) card.classList.add('is-pick');

    var top = document.createElement('div');
    top.className = 'meal-top';

    var title = document.createElement('h3');
    title.textContent = meal.name;
    top.appendChild(title);

    var metaWrap = document.createElement('div');
    metaWrap.className = 'meal-meta';
    var ingCount = (meal.ingredients || []).length;
    var meta = document.createElement('span');
    meta.className = 'chip chip-effort';
    meta.textContent = (meal.effort || 'easy') + ' · ' + ingCount + ' ingredients';
    metaWrap.appendChild(meta);
    top.appendChild(metaWrap);
    card.appendChild(top);

    if (meal.notes) {
      var notes = document.createElement('p');
      notes.className = 'meal-ing';
      notes.textContent = meal.notes;
      card.appendChild(notes);
    }

    var actions = document.createElement('div');
    actions.className = 'meal-actions';

    actions.appendChild(actionBtn('Pick', 'btn btn-ghost btn-sm', function () {
      setPick(meal.id);
    }));
    actions.appendChild(cookBtn(meal));
    actions.appendChild(actionBtn('Edit', 'btn btn-ghost btn-sm', function () {
      openMealEditor(meal.id);
    }));

    var planLabel = document.createElement('label');
    planLabel.className = 'query-toggle';
    var planBox = document.createElement('input');
    planBox.type = 'checkbox';
    planBox.checked = Boolean(meal.inPlan);
    planBox.addEventListener('change', function () {
      meal.inPlan = planBox.checked;
      save();
      renderShopping();
    });
    planLabel.appendChild(planBox);
    planLabel.appendChild(document.createTextNode(' Add to list'));
    actions.appendChild(planLabel);

    card.appendChild(actions);

    // Drag & drop: onto pick zone sets pick; onto another card reorders deck.
    card.addEventListener('dragstart', function (ev) {
      ev.dataTransfer.setData('text/plain', meal.id);
      ev.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      clearDropTargets();
    });
    card.addEventListener('dragover', function (ev) {
      if (meal.id === state.pick) return;
      ev.preventDefault();
      card.classList.add('is-drop-target');
    });
    card.addEventListener('dragleave', function () {
      card.classList.remove('is-drop-target');
    });
    card.addEventListener('drop', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      card.classList.remove('is-drop-target');
      var draggedId = ev.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === meal.id) return;
      reorderDeck(draggedId, meal.id);
    });

    return card;
  }

  function actionBtn(label, cls, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function cookBtn(meal, small) {
    return actionBtn(
      small ? 'Cooked it' : 'Cooked it tonight',
      'btn btn-primary btn-sm',
      function () { cookMeal(meal.id); }
    );
  }

  function clearDropTargets() {
    document.querySelectorAll('.is-drop-target').forEach(function (el) {
      el.classList.remove('is-drop-target');
    });
  }

  function reorderDeck(draggedId, targetId) {
    var from = state.deck.indexOf(draggedId);
    var to = state.deck.indexOf(targetId);
    if (from === -1 || to === -1) return;
    state.deck.splice(from, 1);
    var insertAt = state.deck.indexOf(targetId);
    state.deck.splice(insertAt, 0, draggedId);
    save();
    render();
    toast('Deck reordered: “' + (mealById(draggedId) || {}).name + '” moved.');
  }

  /* --- Shopping list ------------------------------------------------------ */

  function plannedMeals() {
    var meals = state.meals.filter(function (m) { return m.inPlan; });
    if (state.pick) {
      var pickMeal = mealById(state.pick);
      if (pickMeal && meals.indexOf(pickMeal) === -1) meals.unshift(pickMeal);
    }
    return meals;
  }

  function renderShopping() {
    var wrap = $('#shopping-list');
    clearChildren(wrap);
    var result = L.buildShoppingList(plannedMeals(), state.pantry);

    if (result.groups.length === 0 && result.stocked.length === 0) {
      var note = document.createElement('p');
      note.className = 'empty-note';
      note.textContent = 'Check “Add to list” on a meal (or set today’s pick) and its ingredients show up here.';
      wrap.appendChild(note);
      return;
    }

    var groupsGrid = document.createElement('div');
    groupsGrid.className = 'list-groups';
    result.groups.forEach(function (group) {
      var box = document.createElement('div');
      box.className = 'list-group';
      var h = document.createElement('h3');
      h.textContent = group.aisle;
      box.appendChild(h);
      var ul = document.createElement('ul');
      group.items.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'list-line';

        var qty = document.createElement('span');
        qty.className = 'qty';
        var havePart = item.have > 0 ? '' + L.qtyLabel(item.have) + ' ' + item.unit + ' in pantry, buy ' : 'buy ';
        qty.textContent = havePart + L.qtyLabel(item.buy) + ' ' + item.unit;
        li.appendChild(qty);

        var name = document.createElement('span');
        name.textContent = item.name;
        li.appendChild(name);

        var mealsUsed = document.createElement('small');
        mealsUsed.textContent = ' — ' + item.meals.join(', ');
        li.appendChild(mealsUsed);

        ul.appendChild(li);
      });
      box.appendChild(ul);
      groupsGrid.appendChild(box);
    });
    wrap.appendChild(groupsGrid);

    if (result.stocked.length > 0) {
      var stocked = document.createElement('div');
      stocked.className = 'list-group';
      var sh = document.createElement('h3');
      sh.textContent = 'Already in pantry (no need to buy)';
      stocked.appendChild(sh);
      var sul = document.createElement('ul');
      result.stocked.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'list-line pantry-covered';
        var s = document.createElement('span');
        s.textContent = item.name + ' — have ' + L.qtyLabel(item.have) + ' ' + item.unit + ' (need ' + L.qtyLabel(item.need) + ')';
        li.appendChild(s);
        sul.appendChild(li);
      });
      stocked.appendChild(sul);
      wrap.appendChild(stocked);
    }
  }

  /* --- Pantry -------------------------------------------------------------- */

  function renderPantry() {
    var wrap = $('#pantry-list');
    clearChildren(wrap);
    wrap.className = 'pantry-chips';

    if (state.pantry.length === 0) {
      var note = document.createElement('span');
      note.className = 'empty-note';
      note.textContent = 'Pantry is empty. Add things like “rice, 6 cup”.';
      wrap.appendChild(note);
      return;
    }

    state.pantry.forEach(function (item, idx) {
      var el = document.createElement('span');
      el.className = 'chip pantry-item';
      var qtyTxt = item.qty ? ' ' + L.qtyLabel(item.qty) + (' ' + (item.unit || '')).trim() : '';
      el.textContent = item.name + qtyTxt;
      var x = document.createElement('button');
      x.className = 'chip-x';
      x.type = 'button';
      x.setAttribute('aria-label', 'Remove ' + item.name + ' from pantry');
      x.textContent = '×';
      x.dataset.index = String(idx);
      x.addEventListener('click', function (ev) {
        var i = Number(ev.currentTarget.dataset.index);
        state.pantry.splice(i, 1);
        save();
        renderPantry();
        renderShopping();
      });
      el.appendChild(x);
      wrap.appendChild(el);
    });
  }

  /* --- Backups ------------------------------------------------------------- */

  function renderBackups() {
    var row = $('#backup-row');
    clearChildren(row);
    state.meals.filter(function (m) { return m.isBackup; }).forEach(function (meal) {
      var card = document.createElement('div');
      card.className = 'backup-card';
      var h = document.createElement('h3');
      h.textContent = meal.name;
      card.appendChild(h);
      var p = document.createElement('p');
      p.textContent = meal.notes || '';
      card.appendChild(p);
      var actions = document.createElement('div');
      actions.className = 'meal-actions';
      actions.appendChild(actionBtn('Use instead', 'btn btn-ghost btn-sm', function () {
        setPick(meal.id);
        toast('Backup on deck tonight: ' + meal.name);
      }));
      actions.appendChild(cookBtn(meal, true));
      actions.appendChild(actionBtn('Edit', 'btn btn-ghost btn-sm', function () {
        openMealEditor(meal.id);
      }));
      card.appendChild(actions);
      row.appendChild(card);
    });
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function setPick(mealId) {
    state.pick = mealId;
    save();
    render();
  }

  function cookMeal(mealId) {
    var meal = mealById(mealId);
    if (!meal) return;
    state.cookLog.push({ mealId: mealId, date: today() });
    state.deck = L.cycleDeck(state.deck, mealId);

    (meal.leftovers || []).forEach(function (lo) {
      state.leftovers.push({
        id: uid(),
        name: lo.name || meal.name + ' leftovers',
        goodForDays: Number(lo.goodForDays) || 3,
        cookedOn: today(),
      });
    });

    state.pick = null;
    save();
    render();
    var backInDeck = state.deck.indexOf(mealId) !== -1;
    toast('Made “' + meal.name + '” 🎉' + (backInDeck ? ' It goes to the back of the deck.' : ''));
  }

  // ---------------------------------------------------------------------------
  // Meal editor dialog
  // ---------------------------------------------------------------------------

  function openMealEditor(mealId) {
    dialogMealId = mealId;
    var meal = mealId ? mealById(mealId) : null;

    $('#meal-dialog-title').textContent = meal ? 'Edit meal' : 'New meal';
    $('#meal-name').value = meal ? meal.name : '';
    $('#meal-servings').value = meal && meal.servings ? meal.servings : 4;
    $('#meal-effort').value = (meal && meal.effort) || 'easy';
    $('#meal-notes').value = meal ? meal.notes || '' : '';
    $('#meal-backup').checked = meal ? Boolean(meal.isBackup) : false;
    $('#meal-inplan').checked = meal ? Boolean(meal.inPlan) : false;

    buildIngRows(meal);
    buildLoRows(meal);
    $('#btn-meal-delete').hidden = !meal;
    var dialog = $('#meal-dialog');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
      dialog.dataset.fallback = '1';
      dialog.style.display = 'block';
      dialog.style.position = 'fixed';
      dialog.style.top = '50%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translate(-50%,-50%)';
      dialog.style.zIndex = '40';
    }
  }

  function closeMealEditor(saveIt) {
    if (saveIt) {
      if (!saveMealFromDialog()) return;
    }
    var dialog = $('#meal-dialog');
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      dialog.style.display = '';
    }
    dialogMealId = null;
  }

  function addIngRow(ing) {
    ing = ing || {};
    var tbody = $('#ing-table tbody');
    var row = document.createElement('tr');

    row.appendChild(cellText('ing-name', ing.name || '', 'e.g. Chicken thighs'));
    row.appendChild(cellText('ing-qty', ing.qty == null ? '' : String(ing.qty), '1.5', true));
    var unitTd = document.createElement('td');
    var unitInput = document.createElement('input');
    unitInput.setAttribute('list', 'unit-options');
    unitInput.setAttribute('placeholder', 'lb, cup, can…');
    unitInput.value = ing.unit || '';
    unitTd.appendChild(unitInput);
    row.appendChild(unitTd);

    var aisleTd = document.createElement('td');
    var aisleSel = document.createElement('select');
    AISLES.forEach(function (a) {
      var opt = document.createElement('option');
      opt.value = a;
      opt.textContent = a;
      aisleSel.appendChild(opt);
    });
    aisleSel.value = ing.aisle || 'Pantry';
    aisleTd.appendChild(aisleSel);
    row.appendChild(aisleTd);

    var xTd = document.createElement('td');
    xTd.className = 'col-x';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'chip-x';
    x.textContent = '×';
    x.setAttribute('aria-label', 'Remove ingredient row');
    x.addEventListener('click', function () { row.remove(); });
    xTd.appendChild(x);
    row.appendChild(xTd);

    tbody.appendChild(row);
  }

  function addLoRow(lo) {
    lo = lo || {};
    var tbody = $('#lo-table tbody');
    var row = document.createElement('tr');
    row.appendChild(cellText('lo-name', lo.name || '', 'e.g. Leftover chili'));
    var daysTd = document.createElement('td');
    var daysInput = document.createElement('input');
    daysInput.type = 'number';
    daysInput.min = '1';
    daysInput.max = '14';
    daysInput.value = lo.goodForDays == null ? '3' : String(lo.goodForDays);
    daysTd.appendChild(daysInput);
    row.appendChild(daysTd);

    var xTd = document.createElement('td');
    xTd.className = 'col-x';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'chip-x';
    x.textContent = '×';
    x.setAttribute('aria-label', 'Remove leftover row');
    x.addEventListener('click', function () { row.remove(); });
    xTd.appendChild(x);
    row.appendChild(xTd);

    tbody.appendChild(row);
  }

  function cellText(cls, value, placeholder, isQty) {
    var td = document.createElement('td');
    var input = document.createElement('input');
    input.className = cls;
    input.type = isQty ? 'number' : 'text';
    if (isQty) { input.step = 'any'; input.min = '0'; }
    input.value = value || '';
    input.setAttribute('placeholder', placeholder || '');
    td.appendChild(input);
    return td;
  }

  function buildIngRows(meal) {
    var tbody = $('#ing-table tbody');
    while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }
    var rows = (meal && meal.ingredients) ? meal.ingredients : [];
    rows.forEach(function (r) { addIngRow(r); });
    if (tbody.children.length === 0) { addIngRow(); }
  }

  function buildLoRows(meal) {
    var tbody = $('#lo-table tbody');
    while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }
    var rows = (meal && meal.leftovers) ? meal.leftovers : [];
    rows.forEach(function (r) { addLoRow(r); });
    if (tbody.children.length === 0) { addLoRow(); }
  }

  function collectIngredients() {
    var out = [];
    document.querySelectorAll('#ing-table tbody tr').forEach(function (tr) {
      var tds = tr.children;
      var name = (tds[0].querySelector('input') || {}).value || '';
      var qtyRaw = (tds[1].querySelector('input') || {}).value || '';
      var unit = (tds[2].querySelector('input') || {}).value || '';
      var aisle = (tds[3].querySelector('select') || {}).value || 'Pantry';
      name = name.trim();
      if (!name) return;
      var qty = parseFloat(qtyRaw);
      out.push({
        name: name,
        qty: isNaN(qty) ? 0 : qty,
        unit: unit.trim(),
        aisle: aisle,
      });
    });
    return out;
  }

  function collectLeftovers() {
    var out = [];
    document.querySelectorAll('#lo-table tbody tr').forEach(function (tr) {
      var tds = tr.children;
      var name = (tds[0].querySelector('input') || {}).value || '';
      var days = Number((tds[1].querySelector('input') || {}).value) || 3;
      name = name.trim();
      if (!name) return;
      out.push({ name: name, goodForDays: Math.min(14, Math.max(1, days)) });
    });
    return out;
  }

  function saveMealFromDialog() {
    var name = $('#meal-name').value.trim();
    if (!name) {
      toast('Give the meal a name first.');
      return false;
    }
    var data = {
      name: name,
      servings: Math.max(1, Number($('#meal-servings').value) || 4),
      effort: $('#meal-effort').value,
      notes: $('#meal-notes').value.trim(),
      isBackup: $('#meal-backup').checked,
      inPlan: $('#meal-inplan').checked,
      ingredients: collectIngredients(),
      leftovers: collectLeftovers(),
    };

    var existing = dialogMealId ? mealById(dialogMealId) : null;
    if (existing) {
      Object.keys(data).forEach(function (k) { existing[k] = data[k]; });
      if (existing.isBackup) {
        state.deck = state.deck.filter(function (id) { return id !== existing.id; });
      } else if (state.deck.indexOf(existing.id) === -1) {
        state.deck.push(existing.id);
      }
      toast('Saved “' + data.name + '”.');
    } else {
      var meal = Object.assign({ id: uid() }, data);
      state.meals.push(meal);
      if (!meal.isBackup) state.deck.push(meal.id);
      toast('Added “' + data.name + '” to your deck.');
    }
    save();
    render();
    return true;
  }

  function deleteMealFromDialog() {
    var meal = dialogMealId ? mealById(dialogMealId) : null;
    if (!meal) return;
    if (!window.confirm('Delete “' + meal.name + '”? This cannot be undone.')) return;
    state.meals = state.meals.filter(function (m) { return m.id !== dialogMealId; });
    state.deck = state.deck.filter(function (id) { return id !== dialogMealId; });
    if (state.pick === dialogMealId) state.pick = null;
    save();
    render();
    closeMealEditor(false);
    toast('Deleted “' + meal.name + '”.');
  }

  // ---------------------------------------------------------------------------
  // Export / import / reset
  // ---------------------------------------------------------------------------

  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'meal-rotation-kitchen-backup.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = tryParse(String(reader.result));
      if (!parsed) {
        toast('That file is not valid JSON.');
        return;
      }
      state = L.sanitizeState(parsed, D.starterState());
      save();
      render();
      toast('Imported your planner. 🎉');
    };
    reader.onerror = function () { toast('Could not read that file.'); };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------

  function wireDrag() {
    var zone = $('#pick-zone');
    zone.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      zone.classList.remove('dragover');
      var draggedId = ev.dataTransfer.getData('text/plain');
      if (!draggedId || !mealById(draggedId)) return;
      setPick(draggedId);
      var meal = mealById(draggedId);
      toast('Today’s pick: ' + meal.name);
    });
  }

  function wire() {
    wireDrag();

    $('#btn-cook').addEventListener('click', function () {
      if (state.pick) cookMeal(state.pick);
    });
    $('#btn-clear-pick').addEventListener('click', function () {
      state.pick = null;
      save();
      renderPick();
    });
    $('#btn-new-meal').addEventListener('click', function () { openMealEditor(null); });
    $('#btn-meal-save').addEventListener('click', function () { closeMealEditor(true); });
    $('#btn-meal-cancel').addEventListener('click', function () { closeMealEditor(false); });
    $('#btn-meal-delete').addEventListener('click', deleteMealFromDialog);
    $('#btn-add-ing').addEventListener('click', function () { addIngRow(); });
    $('#btn-add-lo').addEventListener('click', function () { addLoRow(); });

    $('#form-leftover').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('#leftover-name').value.trim();
      if (!name) return;
      state.leftovers.push({
        id: uid(),
        name: name,
        goodForDays: Math.min(14, Math.max(1, Number($('#leftover-days').value) || 3)),
        cookedOn: today(),
      });
      $('#leftover-name').value = '';
      $('#leftover-days').value = '3';
      save();
      renderLeftovers();
    });

    $('#form-pantry').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('#pantry-name').value.trim();
      if (!name) return;
      var qty = parseFloat($('#pantry-qty').value);
      state.pantry.push({
        id: uid(),
        name: name,
        qty: isNaN(qty) ? 0 : qty,
        unit: $('#pantry-unit').value.trim(),
        aisle: $('#pantry-aisle').value,
      });
      $('#pantry-name').value = '';
      $('#pantry-qty').value = '';
      $('#pantry-unit').value = '';
      save();
      renderPantry();
      renderShopping();
    });

    $('#btn-export').addEventListener('click', exportData);
    $('#btn-import').addEventListener('click', function () { $('#import-file').click(); });
    $('#import-file').addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (file) importData(file);
      ev.target.value = '';
    });

    $('#btn-reset').addEventListener('click', function () {
      if (!window.confirm('Reset everything to the six starter meals? Your current data is replaced (plus starter pantry/leftovers are cleared).')) return;
      state = D.starterState();
      save();
      render();
      toast('Reset to starter meals.');
    });
  }

  function init() {
    state = load();
    wire();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
