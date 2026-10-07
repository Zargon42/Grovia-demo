import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  addItems,
  changeQuantity,
  total,
  saving,
  price,
  route,
  shortest,
  store,
  finishTrip,
  recipeItems,
  compatibility,
  recipeMatches,
  validateCatalog,
} from "./core";
import { productById, products, recipes, defaultProfile } from "./data";

test("catalog products have valid store locations and stock categories", () => {
  assert.equal(products.length, 30);
  assert.equal(recipes.length, 8);
  assert.ok(validateCatalog());
});
test("route only traverses walkable edges and ends at checkout", () => {
  const result = route(initialState().items);
  assert.equal(result.path[0], store.entrance);
  assert.ok(store.checkouts.includes(result.path.at(-1)!));
  for (let i = 1; i < result.path.length; i++) {
    const a = result.path[i - 1],
      b = result.path[i];
    assert.ok(
      store.edges.some(
        ([x, y]) => (x === a && y === b) || (x === b && y === a),
      ),
      `${a} -> ${b}`,
    );
  }
  const rank = { heavy: 0, dry: 1, beverage: 1, fresh: 2, frozen: 3 };
  for (let i = 1; i < result.order.length; i++)
    assert.ok(
      rank[productById[result.order[i - 1].id].category] <=
        rank[productById[result.order[i].id].category],
    );
});
test("route recalculates from current position and excludes skipped/collected", () => {
  const s = initialState();
  s.items[0].status = "collected";
  s.items[1].status = "skipped";
  s.position = productById[s.items[0].id].node;
  const r = route(s.items, s.position);
  assert.equal(r.path[0], s.position);
  assert.ok(
    !r.order.some((i) => i.id === s.items[0].id || i.id === s.items[1].id),
  );
  const changed = route(
    addItems(s.items, [{ id: "icecream", qty: 1 }]),
    s.position,
  );
  assert.ok(changed.order.some((i) => i.id === "icecream"));
});
test("all-pairs shortest paths stay finite and symmetric", () => {
  for (const p of products) {
    assert.equal(
      shortest(store.entrance, p.node).distance,
      shortest(p.node, store.entrance).distance,
    );
    assert.ok(Number.isFinite(shortest(store.entrance, p.node).distance));
  }
  assert.equal(shortest(store.entrance, store.entrance).distance, 0);
});
test("empty list produces checkout-only path; unavailable products excluded", () => {
  assert.equal(route([]).order.length, 0);
  assert.equal(
    route([{ id: "salmon", qty: 1, status: "pending" }]).order.length,
    0,
  );
  assert.deepEqual(addItems([], [{ id: "salmon", qty: 1 }]), []);
});
test("adding recipe merges quantities and rounds packages for servings", () => {
  const ingredients = recipeItems(recipes[1], 3);
  assert.deepEqual(ingredients, [
    { id: "pasta", qty: 2 },
    { id: "tomato", qty: 2 },
    { id: "oil", qty: 1 },
  ]);
  const items = addItems(
    [{ id: "pasta", qty: 1, status: "pending" }],
    ingredients,
  );
  assert.equal(items.find((i) => i.id === "pasta")?.qty, 3);
  assert.equal(items.length, 3);
});
test("prices discounts totals and savings remain consistent", () => {
  const items = [{ id: "pasta", qty: 3, status: "pending" as const }];
  assert.equal(price(productById.pasta), 1.19);
  assert.equal(total(items), 3.57);
  assert.equal(saving(items), 0.9);
  assert.equal(total([]), 0);
});
test("diet and allergen filtering excludes incompatible recipes", () => {
  const vegan = {
    ...defaultProfile,
    diet: "Vegana" as const,
    allergies: ["glutine"],
  };
  assert.ok(compatibility(productById.yogurt, vegan).includes("Non vegano"));
  assert.ok(
    compatibility(productById.pasta, vegan).includes("Contiene glutine"),
  );
  assert.equal(recipeMatches(recipes[0], vegan), true);
  assert.equal(recipeMatches(recipes[1], vegan), false);
  assert.equal(recipeMatches(recipes[2], vegan), false);
});
test("checkout is idempotent, records only collected products and updates pantry", () => {
  const s = initialState();
  s.tripId = "test-trip";
  s.items = s.items.map((i, k) => ({
    ...i,
    status: k === 0 ? "skipped" : "collected",
  }));
  const result = finishTrip(s);
  assert.equal(result.purchases.length, s.purchases.length + 1);
  assert.equal(result.purchases.at(-1)?.items.length, s.items.length - 1);
  assert.equal(result.pantry.length, s.pantry.length + s.items.length - 1);
  assert.equal(result.items.length, 0);
  assert.equal(result.tripId, null);
  assert.equal(finishTrip(result), result);
  assert.equal(
    finishTrip({ ...s, purchases: result.purchases }).purchases.length,
    result.purchases.length,
  );
});
test("checkout cannot finish pending or entirely skipped baskets", () => {
  const s = initialState();
  s.tripId = "test";
  assert.equal(finishTrip(s), s);
  const skipped = {
    ...s,
    items: s.items.map((i) => ({ ...i, status: "skipped" as const })),
  };
  assert.equal(finishTrip(skipped), skipped);
});
test("adding more collected products restores a remaining collection stop", () => {
  const items: import("./core").Item[] = [
    { id: "pasta", qty: 1, status: "collected" },
  ];
  assert.equal(addItems(items, [{ id: "pasta", qty: 1 }])[0].status, "pending");
  const changed = changeQuantity(items, "pasta", 1);
  assert.equal(changed[0].qty, 2);
  assert.equal(route(changed).order.length, 1);
  assert.equal(changeQuantity(items, "pasta", -1).length, 0);
});
