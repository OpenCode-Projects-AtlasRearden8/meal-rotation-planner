/*
 * Meal Rotation Kitchen - starter data.
 *
 * Six low-energy starter meals with recipes you can edit, plus a "too tired"
 * backup row of frozen / near-instant meals. Runs in the browser
 * (window.MRPData) and under Node (module.exports) so tests can inspect it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MRPData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STARTER_MEALS = [
    {
      id: 'starter-1',
      name: 'Sheet-Pan Sausage & Veggies',
      notes: 'Everything on one tray. Chop while the oven heats; done in about 30 minutes.',
      servings: 4,
      effort: 'easy',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Smoked sausage', qty: 14, unit: 'oz', aisle: 'Meat' },
        { name: 'Baby potatoes', qty: 1.5, unit: 'lb', aisle: 'Produce' },
        { name: 'Broccoli florets', qty: 1, unit: 'lb', aisle: 'Produce' },
        { name: 'Bell peppers', qty: 2, unit: '', aisle: 'Produce' },
        { name: 'Olive oil', qty: 3, unit: 'tbsp', aisle: 'Pantry' },
        { name: 'Garlic powder', qty: 1, unit: 'tsp', aisle: 'Pantry' },
        { name: 'Salt', qty: 1, unit: 'tsp', aisle: 'Pantry' },
      ],
      leftovers: [
        { name: 'Sheet-pan sausage & veggies', goodForDays: 4 },
      ],
    },
    {
      id: 'starter-2',
      name: 'Chicken Taco Bowls',
      notes: 'One skillet of taco chicken plus microwave rice. Everyone builds their own bowl.',
      servings: 4,
      effort: 'easy',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Chicken thighs', qty: 1.25, unit: 'lb', aisle: 'Meat' },
        { name: 'Taco seasoning', qty: 1, unit: 'packet', aisle: 'Pantry' },
        { name: 'Microwaveable rice', qty: 2, unit: 'bag', aisle: 'Pantry' },
        { name: 'Black beans', qty: 1, unit: 'can', aisle: 'Pantry' },
        { name: 'Corn', qty: 1, unit: 'can', aisle: 'Pantry' },
        { name: 'Shredded cheese', qty: 8, unit: 'oz', aisle: 'Dairy' },
        { name: 'Salsa', qty: 1, unit: 'jar', aisle: 'Pantry' },
        { name: 'Baby spinach', qty: 5, unit: 'oz', aisle: 'Produce' },
      ],
      leftovers: [
        { name: 'Taco chicken & rice', goodForDays: 3 },
      ],
    },
    {
      id: 'starter-3',
      name: 'One-Pot Pasta Primavera',
      notes: 'Pasta and veggies cook together in one pot. Barely any dishes.',
      servings: 4,
      effort: 'easy',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Penne pasta', qty: 1, unit: 'lb', aisle: 'Pantry' },
        { name: 'Cherry tomatoes', qty: 1, unit: 'pint', aisle: 'Produce' },
        { name: 'Zucchini', qty: 2, unit: '', aisle: 'Produce' },
        { name: 'Garlic', qty: 4, unit: 'clove', aisle: 'Produce' },
        { name: 'Parmesan', qty: 4, unit: 'oz', aisle: 'Dairy' },
        { name: 'Olive oil', qty: 3, unit: 'tbsp', aisle: 'Pantry' },
        { name: 'Vegetable broth', qty: 4, unit: 'cup', aisle: 'Pantry' },
      ],
      leftovers: [
        { name: 'Primavera pasta', goodForDays: 3 },
      ],
    },
    {
      id: 'starter-4',
      name: 'Slow-Cooker Chili',
      notes: 'Brown the beef, dump everything in, forget about it until dinner.',
      servings: 6,
      effort: 'medium',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Ground beef', qty: 1.5, unit: 'lb', aisle: 'Meat' },
        { name: 'Kidney beans', qty: 2, unit: 'can', aisle: 'Pantry' },
        { name: 'Crushed tomatoes', qty: 1, unit: 'can', aisle: 'Pantry' },
        { name: 'Diced tomatoes with chiles', qty: 1, unit: 'can', aisle: 'Pantry' },
        { name: 'Chili powder', qty: 2, unit: 'tbsp', aisle: 'Pantry' },
        { name: 'Onion', qty: 1, unit: '', aisle: 'Produce' },
        { name: 'Shredded cheese', qty: 8, unit: 'oz', aisle: 'Dairy' },
        { name: 'Corn chips', qty: 1, unit: 'bag', aisle: 'Pantry' },
      ],
      leftovers: [
        { name: 'Chili (even better tomorrow)', goodForDays: 4 },
      ],
    },
    {
      id: 'starter-5',
      name: '15-Minute Fried Rice',
      notes: 'Built for leftover rice. Day-old rice works better than fresh.',
      servings: 3,
      effort: 'easy',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Cooked rice', qty: 4, unit: 'cup', aisle: 'Pantry' },
        { name: 'Frozen peas & carrots', qty: 1, unit: 'bag', aisle: 'Frozen' },
        { name: 'Eggs', qty: 3, unit: '', aisle: 'Dairy' },
        { name: 'Soy sauce', qty: 3, unit: 'tbsp', aisle: 'Pantry' },
        { name: 'Green onions', qty: 1, unit: 'bunch', aisle: 'Produce' },
        { name: 'Sesame oil', qty: 1, unit: 'tbsp', aisle: 'Pantry' },
      ],
      leftovers: [
        { name: 'Fried rice', goodForDays: 3 },
      ],
    },
    {
      id: 'starter-6',
      name: 'Lemon Garlic Chicken Tray',
      notes: 'Chicken thighs, lemon, green beans: one tray, 35 minutes, nothing fancy.',
      servings: 4,
      effort: 'easy',
      isBackup: false,
      inPlan: false,
      ingredients: [
        { name: 'Chicken thighs', qty: 2, unit: 'lb', aisle: 'Meat' },
        { name: 'Lemons', qty: 2, unit: '', aisle: 'Produce' },
        { name: 'Green beans', qty: 1, unit: 'lb', aisle: 'Produce' },
        { name: 'Baby potatoes', qty: 1, unit: 'lb', aisle: 'Produce' },
        { name: 'Garlic', qty: 4, unit: 'clove', aisle: 'Produce' },
        { name: 'Butter', qty: 4, unit: 'tbsp', aisle: 'Dairy' },
        { name: 'Italian seasoning', qty: 1, unit: 'tbsp', aisle: 'Pantry' },
      ],
      leftovers: [
        { name: 'Lemon chicken', goodForDays: 4 },
      ],
    },
  ];

  var BACKUP_MEALS = [
    {
      id: 'backup-1',      isBackup: true,
      name: 'Frozen burritos',
      notes: 'Microwave 2-3 minutes. Add salsa if you have it.',
      effort: 'instant',
      ingredients: [{ name: 'Frozen burritos', qty: 2, unit: '', aisle: 'Frozen' }],
    },
    {
      id: 'backup-2',      isBackup: true,
      name: 'Potstickers + rice',
      notes: 'Frozen potstickers in a skillet, microwave rice on the side.',
      effort: 'quick',
      ingredients: [
        { name: 'Frozen potstickers', qty: 1, unit: 'bag', aisle: 'Frozen' },
        { name: 'Microwaveable rice', qty: 1, unit: 'bag', aisle: 'Pantry' },
      ],
    },
    {
      id: 'backup-3',      isBackup: true,
      name: 'Boxed mac & cheese',
      notes: 'Follow the box. Stir in frozen peas if you want a veggie.',
      effort: 'quick',
      ingredients: [
        { name: 'Boxed mac & cheese', qty: 1, unit: 'box', aisle: 'Pantry' },
        { name: 'Frozen peas', qty: 0.5, unit: 'bag', aisle: 'Frozen' },
      ],
    },
    {
      id: 'backup-4',      isBackup: true,
      name: 'Canned soup + grilled cheese',
      notes: 'Soup from the can, cheese toasties while it warms.',
      effort: 'quick',
      ingredients: [
        { name: 'Canned soup', qty: 1, unit: 'can', aisle: 'Pantry' },
        { name: 'Bread', qty: 4, unit: 'slice', aisle: 'Bakery' },
        { name: 'Cheese slices', qty: 2, unit: '', aisle: 'Dairy' },
        { name: 'Butter', qty: 1, unit: 'tbsp', aisle: 'Dairy' },
      ],
    },
    {
      id: 'backup-5',      isBackup: true,
      name: 'Instant ramen upgrade',
      notes: 'Add an egg and whatever frozen veggie is in the freezer.',
      effort: 'instant',
      ingredients: [
        { name: 'Instant ramen', qty: 1, unit: 'pack', aisle: 'Pantry' },
        { name: 'Eggs', qty: 1, unit: '', aisle: 'Dairy' },
      ],
    },
    {
      id: 'backup-6',      isBackup: true,
      name: 'Deli sandwich night',
      notes: 'Bread, deli meat, cheese, done. No stove required.',
      effort: 'instant',
      ingredients: [
        { name: 'Bread', qty: 4, unit: 'slice', aisle: 'Bakery' },
        { name: 'Deli meat', qty: 0.5, unit: 'lb', aisle: 'Meat' },
        { name: 'Cheese slices', qty: 2, unit: '', aisle: 'Dairy' },
      ],
    },
  ];

  function starterState() {
    var all = STARTER_MEALS.concat(BACKUP_MEALS);
    return {
      schema: 1,
      meals: all.map(function (m) {
        return Object.assign({}, m, {
          isBackup: Boolean(m.isBackup),
          inPlan: Boolean(m.inPlan),
          ingredients: m.ingredients.map(function (i) { return Object.assign({}, i); }),
          leftovers: (m.leftovers || []).map(function (l) { return Object.assign({}, l); }),
        });
      }),
      deck: STARTER_MEALS.map(function (m) { return m.id; }),
      pick: null,
      plan: [],
      pantry: [],
      leftovers: [],
      cookLog: [],
    };
  }

  return {
    STARTER_MEALS: STARTER_MEALS,
    BACKUP_MEALS: BACKUP_MEALS,
    starterState: starterState,
  };
});
