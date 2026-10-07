import rawStore from "./store.json";
import {
  products,
  productById,
  defaultProfile,
  type Product,
  type Profile,
  type Recipe,
} from "./data";
export const store = rawStore as unknown as {
  name: string;
  entrance: string;
  checkouts: string[];
  nodes: Record<
    string,
    { x: number; y: number; aisle: number | string | null; stocks: string[] }
  >;
  edges: ([string, string] | [string, string, number])[];
};
export interface Item {
  id: string;
  qty: number;
  status: "pending" | "collected" | "skipped";
}
export interface Purchase {
  id: string;
  date: string;
  items: Item[];
  total: number;
  saved: number;
}
export interface PantryItem {
  id: string;
  qty: number;
  expires: string;
}
export interface State {
  version: 1;
  profile: Profile;
  onboarded: boolean;
  items: Item[];
  position: string;
  tripId: string | null;
  purchases: Purchase[];
  pantry: PantryItem[];
  lastReceipt: string | null;
}
export const money = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    value,
  );
export const price = (p: Product) =>
  Math.round(p.price * (1 - p.discount) * 100) / 100;
export const total = (items: Item[]) =>
  Math.round(
    items.reduce((sum, i) => sum + price(productById[i.id]) * i.qty, 0) * 100,
  ) / 100;
export const saving = (items: Item[]) =>
  Math.round(
    items.reduce(
      (sum, i) =>
        sum + (productById[i.id].price - price(productById[i.id])) * i.qty,
      0,
    ) * 100,
  ) / 100;
export const compatibility = (p: Product, profile: Profile) => [
  ...(profile.diet === "Vegana" && !p.vegan
    ? ["Non vegano"]
    : profile.diet === "Vegetariana" && !p.vegetarian
      ? ["Non vegetariano"]
      : []),
  ...p.allergens
    .filter((a) => profile.allergies.includes(a))
    .map((a) => `Contiene ${a}`),
];
export const recipeMatches = (r: Recipe, p: Profile) =>
  r.ingredients.every((i) => compatibility(productById[i.id], p).length === 0);
export function addItems(
  items: Item[],
  additions: { id: string; qty: number }[],
): Item[] {
  const next = items.map((i) => ({ ...i }));
  for (const a of additions) {
    if (!productById[a.id] || !productById[a.id].available || a.qty <= 0)
      continue;
    const found = next.find((i) => i.id === a.id);
    if (found) {
      found.qty += a.qty;
      // Added packages need another collection stop, even if this product was collected.
      found.status = "pending";
    } else next.push({ ...a, status: "pending" });
  }
  return next;
}
export function changeQuantity(
  items: Item[],
  id: string,
  delta: number,
): Item[] {
  return items
    .map((i) =>
      i.id === id
        ? {
            ...i,
            qty: i.qty + delta,
            status: delta > 0 ? ("pending" as const) : i.status,
          }
        : i,
    )
    .filter((i) => i.qty > 0);
}
export const recipeItems = (r: Recipe, servings: number) =>
  r.ingredients.map((i) => ({
    id: i.id,
    qty: Math.ceil((i.qty * servings) / 2),
  }));
export function initialState(): State {
  const now = Date.now();
  return {
    version: 1,
    profile: { ...defaultProfile, allergies: [] },
    onboarded: false,
    items: [
      "pasta",
      "tomatoes",
      "chickpeas",
      "spinach",
      "yogurt",
      "water",
      "peas",
      "banana",
    ].map((id) => ({ id, qty: 1, status: "pending" })),
    position: store.entrance,
    tripId: null,
    purchases: [
      {
        id: "sample-1",
        date: new Date(now - 21 * 86400000).toISOString(),
        items: [],
        total: 38.5,
        saved: 4.2,
      },
      {
        id: "sample-2",
        date: new Date(now - 14 * 86400000).toISOString(),
        items: [],
        total: 42.8,
        saved: 3.6,
      },
      {
        id: "sample-3",
        date: new Date(now - 7 * 86400000).toISOString(),
        items: [],
        total: 31.2,
        saved: 5.1,
      },
    ],
    pantry: [
      {
        id: "carrot",
        qty: 1,
        expires: new Date(now + 2 * 86400000).toISOString(),
      },
      {
        id: "yogurt",
        qty: 2,
        expires: new Date(now + 3 * 86400000).toISOString(),
      },
      {
        id: "zucchini",
        qty: 1,
        expires: new Date(now + 4 * 86400000).toISOString(),
      },
    ],
    lastReceipt: null,
  };
}
export function readState(): State {
  try {
    const s = JSON.parse(localStorage.getItem("grovia-v1") || "null");
    if (
      s?.version === 1 &&
      Array.isArray(s.items) &&
      s.items.every(
        (i: Item) =>
          productById[i.id] &&
          Number.isInteger(i.qty) &&
          i.qty > 0 &&
          ["pending", "collected", "skipped"].includes(i.status),
      ) &&
      store.nodes[s.position] &&
      Array.isArray(s.purchases) &&
      s.purchases.every(
        (p: Purchase) =>
          typeof p.id === "string" &&
          Number.isFinite(p.total) &&
          Number.isFinite(p.saved) &&
          Number.isFinite(Date.parse(p.date)) &&
          Array.isArray(p.items) &&
          p.items.every(
            (i) => productById[i.id] && Number.isInteger(i.qty) && i.qty > 0,
          ),
      ) &&
      Array.isArray(s.pantry) &&
      s.pantry.every(
        (p: PantryItem) =>
          productById[p.id] &&
          Number.isInteger(p.qty) &&
          p.qty > 0 &&
          Number.isFinite(Date.parse(p.expires)),
      ) &&
      s.profile &&
      typeof s.profile.name === "string" &&
      s.profile.name.trim().length > 0 &&
      ["Tutto", "Vegetariana", "Vegana"].includes(s.profile.diet) &&
      Number.isFinite(s.profile.budget) &&
      s.profile.budget > 0 &&
      typeof s.profile.goal === "string" &&
      typeof s.onboarded === "boolean" &&
      (s.tripId === null || typeof s.tripId === "string") &&
      (s.lastReceipt === null || typeof s.lastReceipt === "string") &&
      Array.isArray(s.profile.allergies)
    )
      return s;
  } catch {
    /* Start with the demo if storage is corrupt or disabled. */
  }
  return initialState();
}
const adjacency: Record<string, { node: string; distance: number }[]> =
  Object.fromEntries(Object.keys(store.nodes).map((n) => [n, []]));
for (const [a, b, w] of store.edges) {
  const pa = store.nodes[a],
    pb = store.nodes[b];
  const distance = w ?? Math.hypot(pa.x - pb.x, pa.y - pb.y);
  adjacency[a].push({ node: b, distance });
  adjacency[b].push({ node: a, distance });
}
const cache = new Map<string, { distance: number; path: string[] }>();
export function shortest(
  start: string,
  end: string,
): { distance: number; path: string[] } {
  const key = start + "|" + end;
  if (cache.has(key)) return cache.get(key)!;
  const distances: Record<string, number> = { [start]: 0 };
  const previous: Record<string, string> = {};
  const remaining = new Set(Object.keys(store.nodes));
  while (remaining.size) {
    let current = "";
    let best = Infinity;
    for (const n of remaining)
      if ((distances[n] ?? Infinity) < best) {
        current = n;
        best = distances[n];
      }
    if (!current) break;
    if (current === end) break;
    remaining.delete(current);
    for (const edge of adjacency[current]) {
      const d = best + edge.distance;
      if (d < (distances[edge.node] ?? Infinity)) {
        distances[edge.node] = d;
        previous[edge.node] = current;
      }
    }
  }
  if (distances[end] === undefined)
    throw new Error("Percorso non raggiungibile");
  const path = [end];
  while (path[0] !== start) path.unshift(previous[path[0]]);
  const result = { distance: distances[end], path };
  cache.set(key, result);
  return result;
}
const ranks = { heavy: 0, dry: 1, beverage: 1, fresh: 2, frozen: 3 };
export function route(items: Item[], start = store.entrance, optimized = true) {
  let current = start;
  const order: Item[] = [];
  let pending = items.filter(
    (i) => i.status === "pending" && productById[i.id].available,
  );
  while (pending.length) {
    let chosen = pending[0];
    if (optimized) {
      const rank = Math.min(
        ...pending.map((i) => ranks[productById[i.id].category]),
      );
      chosen = pending
        .filter((i) => ranks[productById[i.id].category] === rank)
        .sort(
          (a, b) =>
            shortest(current, productById[a.id].node).distance -
            shortest(current, productById[b.id].node).distance,
        )[0];
    }
    order.push(chosen);
    current = productById[chosen.id].node;
    pending = pending.filter((i) => i.id !== chosen.id);
  }
  const checkout = [...store.checkouts].sort(
    (a, b) => shortest(current, a).distance - shortest(current, b).distance,
  )[0];
  let distance = 0;
  const path = [start];
  current = start;
  for (const end of [...order.map((i) => productById[i.id].node), checkout]) {
    const leg = shortest(current, end);
    distance += leg.distance;
    path.push(...leg.path.slice(1));
    current = end;
  }
  return { order, path, distance, checkout };
}
export function finishTrip(s: State): State {
  if (
    !s.tripId ||
    s.purchases.some((p) => p.id === s.tripId) ||
    s.items.some((i) => i.status === "pending" && productById[i.id].available)
  )
    return s;
  const items = s.items.filter((i) => i.status === "collected");
  if (!items.length) return s;
  const receipt: Purchase = {
    id: s.tripId,
    date: new Date().toISOString(),
    items: items.map((i) => ({ ...i })),
    total: total(items),
    saved: saving(items),
  };
  return {
    ...s,
    tripId: null,
    lastReceipt: receipt.id,
    position: store.entrance,
    items: [],
    purchases: [...s.purchases, receipt],
    pantry: [
      ...s.pantry,
      ...items.map((i) => ({
        id: i.id,
        qty: i.qty,
        expires: new Date(
          Date.now() + productById[i.id].days * 86400000,
        ).toISOString(),
      })),
    ],
  };
}
export function validateCatalog() {
  return products.every(
    (p) =>
      !!store.nodes[p.node] && store.nodes[p.node].stocks.includes(p.category),
  );
}
