import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  ShoppingBasket,
  ChefHat,
  MapPin,
  Leaf,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Minus,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock,
  Check,
  ScanLine,
  Navigation,
  SlidersHorizontal,
  X,
  Sparkles,
  Wallet,
  CheckCheck,
  RotateCcw,
  BarChart3,
  AlertCircle,
  Snowflake,
  Heart,
  Menu,
} from "lucide-react";
import {
  products,
  productById,
  recipes,
  stores,
  categoryLabels,
  defaultProfile,
  type Recipe,
  type Product,
  type Profile,
} from "./data";
import {
  store,
  readState,
  initialState,
  price,
  money,
  total,
  saving,
  compatibility,
  recipeMatches,
  addItems,
  changeQuantity,
  recipeItems,
  route,
  finishTrip,
  type State,
  type Item,
} from "./core";
import "./style.css";
type Page =
  "home" | "list" | "recipes" | "stores" | "trip" | "pantry" | "stats";
const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Per te", icon: Home },
  { id: "list", label: "La mia lista", icon: ShoppingBasket },
  { id: "recipes", label: "Ricette", icon: ChefHat },
  { id: "stores", label: "Negozi", icon: MapPin },
  { id: "pantry", label: "La mia dispensa", icon: Leaf },
];
function Logo() {
  return (
    <div className="logo">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
      <span>
        Grovia<span className="logo-dot">.</span>
      </span>
    </div>
  );
}
function App() {
  const [state, setState] = useState<State>(readState);
  const [page, setPage] = useState<Page>("home");
  const [welcome, setWelcome] = useState(!state.onboarded);
  const [onboarding, setOnboarding] = useState(-1);
  const [draft, setDraft] = useState<Profile>(state.profile);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tutti");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);
  const [scan, setScan] = useState(false);
  const [scanId, setScanId] = useState("yogurt");
  const [scanned, setScanned] = useState(false);
  const [toast, setToast] = useState("");
  const [reset, setReset] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Product | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("grovia-v1", JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const overlay =
    welcome ||
    onboarding >= 0 ||
    !!selectedRecipe ||
    scan ||
    reset ||
    receiptOpen ||
    !!selectedStop;
  useEffect(() => {
    if (!overlay) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input,select,[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedRecipe) setSelectedRecipe(null);
        else if (scan) setScan(false);
        else if (reset) setReset(false);
        else if (receiptOpen) setReceiptOpen(false);
        else if (selectedStop) setSelectedStop(null);
        else if (onboarding >= 0) {
          setOnboarding(-1);
          setWelcome(false);
        }
      }
      if (e.key === "Tab") {
        const list = focusable();
        if (!list.length) return;
        if (!dialog?.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? list.at(-1) : list[0])?.focus();
        } else if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [
    overlay,
    selectedRecipe,
    scan,
    reset,
    receiptOpen,
    onboarding,
    selectedStop,
  ]);
  const go = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (text: string) => setToast(text);
  const add = (id: string) => {
    if (!productById[id].available) return;
    setState((s) => ({ ...s, items: addItems(s.items, [{ id, qty: 1 }]) }));
    notify(`${productById[id].name} aggiunto alla lista`);
  };
  const updateQty = (id: string, delta: number) =>
    setState((s) => ({
      ...s,
      items: changeQuantity(s.items, id, delta),
    }));
  const activeItems = state.items.filter((i) => i.status !== "skipped");
  const basketTotal = total(activeItems);
  const recommended = recipes.filter((r) => recipeMatches(r, state.profile));
  const currentRoute = route(state.items, state.position);
  const next = currentRoute.order[0];
  const collected = state.items.filter((i) => i.status === "collected");
  const count = activeItems.reduce((n, i) => n + i.qty, 0);
  const realPurchases = state.purchases.filter(
    (p) => !p.id.startsWith("sample"),
  );
  const receipt = state.purchases.find((p) => p.id === state.lastReceipt);
  const pending = state.items.filter((i) => i.status === "pending");
  const startTrip = () => {
    if (
      !state.items.some(
        (i) => i.status === "pending" && productById[i.id].available,
      )
    ) {
      notify("Aggiungi prima un prodotto alla lista");
      go("list");
      return;
    }
    setState((s) => ({
      ...s,
      tripId: s.tripId || crypto.randomUUID(),
      position: s.tripId ? s.position : store.entrance,
    }));
    go("trip");
  };
  const collect = (id: string) => {
    setState((s) => ({
      ...s,
      position: productById[id].node,
      items: s.items.map((i) =>
        i.id === id ? { ...i, status: "collected" } : i,
      ),
    }));
    notify("Nel carrello! Percorso aggiornato.");
  };
  const skip = (id: string) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.id === id ? { ...i, status: "skipped" } : i,
      ),
    }));
    notify("Prodotto saltato. Percorso ricalcolato.");
  };
  const complete = () => {
    const done = finishTrip(state);
    if (done === state) {
      notify("Raccogli almeno un prodotto e completa le tappe");
      return;
    }
    setState(done);
    setReceiptOpen(true);
    go("stats");
  };
  const saveProfile = () => {
    setState((s) => ({
      ...s,
      profile: { ...draft, name: draft.name.trim() },
      onboarded: true,
    }));
    setOnboarding(-1);
    setWelcome(false);
    notify("Il tuo profilo è pronto. Facciamo la spesa!");
  };
  function recipeCard(r: Recipe, compact = false) {
    return (
      <button
        key={r.id}
        className={`recipe-card ${compact ? "compact" : ""}`}
        onClick={() => {
          setSelectedRecipe(r);
          setServings(2);
        }}
      >
        <div className="recipe-photo" style={{ backgroundColor: r.color }}>
          <img
            src={`${import.meta.env.BASE_URL}images/${r.image}.jpg`}
            alt={r.name}
          />
          <span className="time-badge">
            <Clock size={12} />
            {r.minutes} min
          </span>
          <span className="heart">
            <Heart size={16} />
          </span>
        </div>
        <div className="recipe-info">
          <span className="eyebrow green">
            {r.ingredients.every((i) => productById[i.id].vegan)
              ? "100% vegetale"
              : "Fatta per te"}
          </span>
          <h3>{r.name}</h3>
          <p>{r.subtitle}</p>
          <div className="recipe-bottom">
            <span>
              Da{" "}
              {money(
                total(
                  recipeItems(r, 2).map((i) => ({ ...i, status: "pending" })),
                ),
              )}{" "}
              / ricetta
            </span>
            <span className="round-arrow">
              <ArrowUpRight size={17} />
            </span>
          </div>
        </div>
      </button>
    );
  }
  function productRow(p: Product, item?: Item) {
    const warnings = compatibility(p, state.profile);
    return (
      <div
        className={`product-row ${item?.status === "skipped" ? "muted" : ""}`}
        key={p.id}
      >
        <span className={`food-icon ${p.category}`}>{p.emoji}</span>
        <div className="product-copy">
          <strong>{p.name}</strong>
          <small>
            {p.unit} · {categoryLabels[p.category]}
          </small>
          {warnings.length > 0 && (
            <small className="warning">{warnings.join(" · ")}</small>
          )}
          {!p.available && (
            <small className="warning">Non disponibile nel negozio demo</small>
          )}
          {item && item.status !== "pending" && (
            <small className="green">
              {item.status === "collected" ? "✓ Nel carrello" : "Saltato"}
            </small>
          )}
        </div>
        <div className="product-price">
          <strong>{money(price(p) * (item?.qty || 1))}</strong>
          {p.discount > 0 && (
            <small className="old-price">
              {money(p.price * (item?.qty || 1))}
            </small>
          )}
        </div>
        {item ? (
          <div className="quantity">
            <button
              aria-label={`Riduci ${p.name}`}
              onClick={() => updateQty(p.id, -1)}
            >
              <Minus size={13} />
            </button>
            <span>{item.qty}</span>
            <button
              aria-label={`Aumenta ${p.name}`}
              onClick={() => updateQty(p.id, 1)}
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <button
            className="add-button"
            aria-label={`Aggiungi ${p.name}`}
            disabled={!p.available}
            onClick={() => add(p.id)}
          >
            <Plus size={17} />
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "mobile-open" : ""}`}>
        <Logo />
        <div className="side-tag">LA SPESA, UN PASSO AVANTI</div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "list" && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note">
            <span className="side-leaf">
              <Leaf size={22} />
            </span>
            <strong>
              Piccoli gesti.
              <br />
              Un grande domani.
            </strong>
            <p>
              La tua spesa può fare
              <br />
              la differenza.
            </p>
          </div>
          <button
            className={`side-stat ${page === "stats" ? "active" : ""}`}
            onClick={() => go("stats")}
          >
            <BarChart3 size={19} />
            Le mie statistiche
          </button>
          <div className="side-divider" />
          <button
            className="profile-button"
            onClick={() => {
              setDraft(state.profile);
              setOnboarding(0);
            }}
          >
            <span className="avatar">{state.profile.name.charAt(0)}</span>
            <span>
              <strong>{state.profile.name}</strong>
              <small>Il mio Food Persona</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Il tuo spazio</span>
            <ChevronRight size={13} />
            <strong>
              {navItems.find((n) => n.id === page)?.label ||
                (page === "trip" ? "Spesa in corso" : "Statistiche")}
            </strong>
          </div>
          <button
            className="mobile-menu icon-button"
            aria-label="Apri menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={22} />
          </button>
          <div className="top-actions">
            <span className="demo-pill">
              <span />
              Demo interattiva
            </span>
            <button className="location-button" onClick={() => go("stores")}>
              <MapPin size={16} />
              <span>Lidl · Negozio demo</span>
              <ChevronRight size={14} />
            </button>
            <button
              className="avatar small-avatar"
              aria-label="Modifica profilo"
              onClick={() => {
                setDraft(state.profile);
                setOnboarding(0);
              }}
            >
              {state.profile.name.charAt(0)}
            </button>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="notice warning">
              Il browser non permette il salvataggio. La demo funziona, ma i
              progressi non saranno conservati.
            </div>
          )}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MENO PENSIERI, PIÙ COSE BUONE</div>
                  <h1>
                    Ciao, {state.profile.name} <span className="wave">✳</span>
                  </h1>
                  <p>La tua prossima spesa comincia da qui.</p>
                </div>
                <div className="date-chip">
                  <span className="green-dot" />
                  Una buona giornata per scegliere meglio
                </div>
              </div>
              <div className="home-top">
                <section className="hero">
                  <div className="hero-content">
                    <span className="hero-label">
                      <Sparkles size={13} />
                      IL BUONO DI FARE LA SPESA
                    </span>
                    <h2>
                      Più gusto.
                      <br />
                      Meno sprechi.
                      <br />
                      <span>Tutto in una lista.</span>
                    </h2>
                    <p>
                      Le tue idee, il percorso giusto.
                      <br />
                      Al resto pensiamo insieme.
                    </p>
                    <button className="primary" onClick={() => go("list")}>
                      Prepara la tua spesa <ArrowRight size={17} />
                    </button>
                    <div className="hero-foot">
                      <span>
                        <Check size={13} />
                        Su misura per te
                      </span>
                      <span>
                        <Check size={13} />
                        Freschi alla fine
                      </span>
                    </div>
                  </div>
                  <div className="hero-image">
                    <img
                      src={`${import.meta.env.BASE_URL}images/bowl.jpg`}
                      alt="Bowl di verdure fresche e ingredienti colorati"
                    />
                    <div className="floating-label">
                      <span className="mini-leaf">
                        <Leaf size={18} />
                      </span>
                      <div>
                        <strong>Buona per te.</strong>
                        <small>Meglio per il pianeta.</small>
                      </div>
                    </div>
                  </div>
                  <span className="hero-doodle">✳</span>
                </section>
                <section className="list-preview card">
                  <div className="section-top">
                    <span className="icon-tile orange">
                      <ShoppingBasket size={20} />
                    </span>
                    <span className="tiny-badge">{count} prodotti</span>
                  </div>
                  <h2>La tua prossima spesa</h2>
                  <p>Tutto pronto per partire?</p>
                  <div className="preview-items">
                    {activeItems.slice(0, 3).map((i) => (
                      <div key={i.id}>
                        <span className="little-dot" />
                        <span>{productById[i.id].name}</span>
                        <small>{i.qty} ×</small>
                      </div>
                    ))}
                    {activeItems.length > 3 && (
                      <button
                        className="text-button"
                        onClick={() => go("list")}
                      >
                        + altri {activeItems.length - 3} prodotti nella lista
                      </button>
                    )}
                    {!activeItems.length && (
                      <p>Una nuova lista, tante possibilità.</p>
                    )}
                  </div>
                  <div className="estimate">
                    <span>
                      Totale stimato<strong>{money(basketTotal)}</strong>
                    </span>
                    <span className="budget-small">
                      Budget {money(state.profile.budget)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${Math.min((basketTotal / state.profile.budget) * 100, 100)}%`,
                        background:
                          basketTotal > state.profile.budget
                            ? "#c54b36"
                            : undefined,
                      }}
                    />
                  </div>
                  <button
                    className="secondary full"
                    onClick={() => go(state.tripId ? "trip" : "list")}
                  >
                    {state.tripId ? "Riprendi la spesa" : "Vai alla lista"}
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="benefit-strip">
                <div>
                  <span className="icon-tile pale-green">
                    <Navigation size={20} />
                  </span>
                  <span>
                    <strong>Ogni passo conta</strong>
                    <small>Un percorso pensato per la tua lista</small>
                  </span>
                </div>
                <div>
                  <span className="icon-tile pale-orange">
                    <Wallet size={20} />
                  </span>
                  <span>
                    <strong>Il budget, sotto controllo</strong>
                    <small>
                      {money(saving(activeItems))} di offerte nella tua lista
                    </small>
                  </span>
                </div>
                <div>
                  <span className="icon-tile pale-green">
                    <Leaf size={20} />
                  </span>
                  <span>
                    <strong>Più valore, meno sprechi</strong>
                    <small>Dai una seconda idea alla tua dispensa</small>
                  </span>
                </div>
              </div>
              <div className="home-bottom">
                <section>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">ISPIRAZIONI QUOTIDIANE</span>
                      <h2>Oggi, cosa ti va?</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("recipes")}
                    >
                      Tutte le ricette <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="recipe-grid home-recipes">
                    {recommended.slice(0, 3).map((r) => recipeCard(r, true))}
                  </div>
                  {!recommended.length && (
                    <div className="empty">
                      Nessuna ricetta corrisponde alle preferenze attuali. Puoi
                      modificarle dal tuo profilo.
                    </div>
                  )}
                </section>
                <section className="challenge-card">
                  <div className="challenge-top">
                    <span className="eyebrow">LA SFIDA DELLA SETTIMANA</span>
                    <span className="challenge-icon">
                      <Leaf size={24} />
                    </span>
                  </div>
                  <h2>
                    Zero sprechi.
                    <br />
                    Cento possibilità.
                  </h2>
                  <p>
                    Completa 3 spese consapevoli e sblocca il tuo prossimo
                    traguardo.
                  </p>
                  <div className="challenge-progress">
                    <strong>
                      {Math.min(realPurchases.length, 3)} <span>/ 3 spese</span>
                    </strong>
                    <span>+150 punti</span>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${Math.min((realPurchases.length / 3) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="challenge-reward">
                    <Sparkles size={16} />
                    {realPurchases.length >= 3
                      ? "Traguardo sbloccato! 150 punti demo"
                      : "Un piccolo impegno, un bel risultato."}
                  </div>
                  <button className="text-button" onClick={() => go("pantry")}>
                    Parti dalla tua dispensa <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <div className="home-bottom lower">
                <section>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">SCELTE CHE CONVENGONO</span>
                      <h2>Buone occasioni, per te</h2>
                    </div>
                    <span className="subtle">Offerte dimostrative</span>
                  </div>
                  <div className="offer-grid">
                    {products
                      .filter(
                        (p) =>
                          p.discount &&
                          compatibility(p, state.profile).length === 0,
                      )
                      .slice(0, 3)
                      .map((p) => (
                        <div className="offer-card" key={p.id}>
                          <span className="discount">−20%</span>
                          <span className="offer-emoji">{p.emoji}</span>
                          <strong>{p.name}</strong>
                          <small>{p.unit}</small>
                          <div>
                            <strong>{money(price(p))}</strong>
                            <span className="old-price">{money(p.price)}</span>
                            <button
                              className="add-button"
                              onClick={() => add(p.id)}
                              aria-label={`Aggiungi ${p.name}`}
                            >
                              <Plus size={17} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
                <section className="pantry-preview card">
                  <span className="eyebrow green">
                    NON DIMENTICARTI DI LORO
                  </span>
                  <h2>
                    Prima che sia tardi <Leaf size={19} />
                  </h2>
                  {state.pantry.slice(0, 2).map((i, k) => (
                    <div className="pantry-small" key={k}>
                      <span className="food-icon">
                        {productById[i.id].emoji}
                      </span>
                      <div>
                        <strong>{productById[i.id].name}</strong>
                        <small>
                          Scadenza stimata · {daysLeft(i.expires)} giorni
                        </small>
                      </div>
                    </div>
                  ))}
                  <button className="text-button" onClick={() => go("pantry")}>
                    Apri la dispensa <ArrowRight size={15} />
                  </button>
                </section>
              </div>
            </>
          )}
          {page === "list" && (
            <>
              <PageHeading
                eyebrow="UN'IDEA DIVENTA UNA BUONA SPESA"
                title="La mia lista"
                description="Aggiungi ciò che ti serve. Troveremo il percorso giusto."
              />
              <div className="two-column">
                <section className="card padded">
                  <div className="section-heading">
                    <h2>
                      La prossima spesa{" "}
                      <span className="tiny-badge">{count} prodotti</span>
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => go("recipes")}
                    >
                      <ChefHat size={16} />
                      Aggiungi da ricette
                    </button>
                  </div>
                  {state.items.length ? (
                    state.items.map((i) => productRow(productById[i.id], i))
                  ) : (
                    <div className="empty">
                      <ShoppingBasket size={36} />
                      <h3>La tua lista è una pagina bianca</h3>
                      <p>
                        Cerca un prodotto o lasciati ispirare da una ricetta.
                      </p>
                    </div>
                  )}
                  <div className="list-tip">
                    <Snowflake size={18} />
                    <span>
                      Prima i pesanti, poi la dispensa. Freschi e surgelati alla
                      fine.
                    </span>
                  </div>
                </section>
                <aside className="card padded sticky-summary">
                  <span className="eyebrow">LA SPESA IN UN COLPO D'OCCHIO</span>
                  <h2>Facciamo i conti</h2>
                  <div className="summary-line">
                    <span>Prodotti</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="summary-line green">
                    <span>Risparmio offerte</span>
                    <strong>{money(saving(activeItems))}</strong>
                  </div>
                  <div className="summary-total">
                    <span>Totale stimato</span>
                    <strong>{money(basketTotal)}</strong>
                  </div>
                  <div className="summary-line">
                    <span>Il tuo budget</span>
                    <strong>{money(state.profile.budget)}</strong>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${Math.min(100, (basketTotal / state.profile.budget) * 100)}%`,
                      }}
                    />
                  </div>
                  <p
                    className={
                      basketTotal > state.profile.budget ? "warning" : "green"
                    }
                  >
                    {basketTotal > state.profile.budget
                      ? `Sei oltre il budget di ${money(basketTotal - state.profile.budget)}`
                      : `Hai ancora ${money(state.profile.budget - basketTotal)} nel budget`}
                  </p>
                  <button
                    className="primary full"
                    disabled={!activeItems.length}
                    onClick={() => go(state.tripId ? "trip" : "stores")}
                  >
                    {state.tripId
                      ? "Riprendi il percorso"
                      : "Scegli il negozio"}
                    <ArrowRight size={17} />
                  </button>
                  <small className="fine-print">
                    Prezzi e disponibilità dimostrativi.
                  </small>
                </aside>
              </div>
              <section className="card padded catalog">
                <div className="section-heading">
                  <h2>Cosa manca?</h2>
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Cerca prodotti"
                      placeholder="Cerca nella dispensa, tra i freschi…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                <div className="chips">
                  {[
                    "Tutti",
                    "Dispensa",
                    "Freschi",
                    "Surgelati",
                    "Bevande",
                    "Pesanti",
                  ].map((c) => (
                    <button
                      className={filter === c ? "selected" : ""}
                      key={c}
                      onClick={() => setFilter(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="catalog-grid">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()) &&
                        (filter === "Tutti" ||
                          categoryLabels[p.category] === filter),
                    )
                    .map((p) => productRow(p))}
                </div>
                {!products.some(
                  (p) =>
                    p.name.toLowerCase().includes(search.toLowerCase()) &&
                    (filter === "Tutti" ||
                      categoryLabels[p.category] === filter),
                ) && (
                  <div className="empty">
                    Nessun prodotto trovato. Prova un altro nome.
                  </div>
                )}
              </section>
            </>
          )}
          {page === "recipes" && (
            <>
              <PageHeading
                eyebrow="DAL PIATTO ALLA LISTA"
                title="Cosa bolle in pentola?"
                description="Ricette semplici, ingredienti buoni. Un po’ di ispirazione per ogni giorno."
              />
              <div className="recipe-toolbar">
                <span className="profile-chip">
                  <SlidersHorizontal size={16} />
                  {state.profile.diet} ·{" "}
                  {state.profile.allergies.length
                    ? `Senza ${state.profile.allergies.join(", ")}`
                    : "Nessuna intolleranza selezionata"}
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    setDraft(state.profile);
                    setOnboarding(0);
                  }}
                >
                  Modifica preferenze
                </button>
              </div>
              <div className="recipe-grid all-recipes">
                {recommended.map((r) => recipeCard(r))}
              </div>
              {!recommended.length && (
                <div className="card empty">
                  Nessuna ricetta del catalogo demo è compatibile con queste
                  preferenze.
                </div>
              )}
            </>
          )}
          {page === "stores" && (
            <>
              <PageHeading
                eyebrow="IL NEGOZIO GIUSTO PER LA TUA LISTA"
                title="Dove facciamo la spesa?"
                description="Confronta il tuo carrello e scegli da dove cominciare."
              />
              <div className="notice">
                <MapPin size={19} />
                Distanze, prezzi e disponibilità di esempio. Nessuna posizione
                reale viene rilevata.
              </div>
              <div className="store-grid">
                {stores.map((s) => {
                  const available = activeItems.filter(
                    (i) =>
                      productById[i.id].available && !s.missing.includes(i.id),
                  );
                  return (
                    <section className="card store-card" key={s.id}>
                      <div
                        className="store-brand"
                        style={{ background: s.color }}
                      >
                        <span>{s.name}</span>
                        <span className="store-distance">
                          <MapPin size={13} />
                          {s.distance}
                        </span>
                      </div>
                      <div className="padded">
                        <span
                          className={`tiny-badge ${s.id === "lidl" ? "green-badge" : ""}`}
                        >
                          {s.id === "lidl"
                            ? "Navigazione disponibile"
                            : "Solo confronto demo"}
                        </span>
                        <h2>{s.name} · Negozio demo</h2>
                        <p>{s.address}</p>
                        <div className="summary-line">
                          <span>Disponibili</span>
                          <strong>
                            {available.length} / {activeItems.length} articoli
                          </strong>
                        </div>
                        <div className="summary-total">
                          <span>
                            {available.length < activeItems.length
                              ? "Totale parziale"
                              : "La tua lista"}
                          </span>
                          <strong>{money(total(available) * s.factor)}</strong>
                        </div>
                        {available.length < activeItems.length && (
                          <small className="warning">
                            Mancano:{" "}
                            {activeItems
                              .filter((i) => !available.includes(i))
                              .map((i) => productById[i.id].name)
                              .join(", ")}
                          </small>
                        )}
                        <button
                          className={
                            s.id === "lidl" ? "primary full" : "secondary full"
                          }
                          disabled={s.id !== "lidl"}
                          onClick={startTrip}
                        >
                          {s.id === "lidl"
                            ? "Inizia la spesa"
                            : "Confronto dimostrativo"}
                          {s.id === "lidl" && <Navigation size={17} />}
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="route-explainer">
                <span className="icon-tile pale-green">
                  <Navigation size={24} />
                </span>
                <div>
                  <h2>La tua lista sa già dove andare.</h2>
                  <p>
                    La mappa usa il layout Lidl del progetto. Il percorso segue
                    i passaggi reali del grafo, con freschi e surgelati nelle
                    ultime tappe.
                  </p>
                </div>
              </div>
            </>
          )}
          {page === "trip" && (
            <>
              <PageHeading
                eyebrow="UN PASSO ALLA VOLTA"
                title="Segui il buono."
                description="Lidl · Percorso ottimizzato sulla tua lista"
              />
              <div className="trip-toolbar">
                <span className="profile-chip">
                  <Navigation size={15} />
                  {Math.round(currentRoute.distance)} m rimanenti
                </span>
                <span className="profile-chip">
                  <CheckCheck size={15} />
                  {collected.length} raccolti · {pending.length} da prendere
                </span>
                <button className="secondary" onClick={() => go("list")}>
                  <Plus size={16} />
                  Modifica lista
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    setScan(true);
                    setScanned(false);
                  }}
                >
                  <ScanLine size={17} />
                  Scanner demo
                </button>
              </div>
              <div className="trip-grid">
                <section className="card map-card">
                  <div className="section-heading">
                    <h2>La tua mappa</h2>
                    <span className="tiny-badge">Posizione simulata</span>
                  </div>
                  <StoreMap
                    path={currentRoute.path}
                    position={state.position}
                    items={currentRoute.order}
                    onSelect={(id) => setSelectedStop(productById[id])}
                  />
                  <div className="map-legend">
                    <span>
                      <i className="legend-line" />
                      Il tuo percorso
                    </span>
                    <span>
                      <i className="legend-dot" />
                      La prossima tappa
                    </span>
                    <span>
                      <Snowflake size={14} />
                      Freddo alla fine
                    </span>
                  </div>
                </section>
                <aside>
                  <div className="next-card">
                    <span className="eyebrow">
                      {next ? "LA PROSSIMA TAPPA" : "CI SIAMO QUASI"}
                    </span>
                    {next ? (
                      <>
                        <span className="next-emoji">
                          {productById[next.id].emoji}
                        </span>
                        <h2>{productById[next.id].name}</h2>
                        <p>
                          {productById[next.id].unit} · {next.qty}{" "}
                          {next.qty === 1 ? "confezione" : "confezioni"}
                        </p>
                        <div className="aisle-chip">
                          <MapPin size={15} />
                          Corsia{" "}
                          {store.nodes[productById[next.id].node].aisle ??
                            "perimetrale"}{" "}
                          · {categoryLabels[productById[next.id].category]}
                        </div>
                        {compatibility(productById[next.id], state.profile)
                          .length > 0 && (
                          <p className="warning">
                            {compatibility(
                              productById[next.id],
                              state.profile,
                            ).join(" · ")}
                          </p>
                        )}
                        <button
                          className="primary full"
                          onClick={() => collect(next.id)}
                        >
                          <Check size={18} />
                          Messo nel carrello
                        </button>
                        <button
                          className="text-button"
                          onClick={() => skip(next.id)}
                        >
                          Salta questo prodotto
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="next-emoji">🛒</span>
                        <h2>Andiamo alla cassa</h2>
                        <p>
                          Segui l’ultimo tratto sulla mappa per concludere la
                          tua spesa.
                        </p>
                        <button
                          className="primary full"
                          disabled={!collected.length || !state.tripId}
                          onClick={complete}
                        >
                          Concludi la spesa <Check size={17} />
                        </button>
                        {!collected.length && (
                          <button
                            className="text-button"
                            onClick={() => go("list")}
                          >
                            Aggiungi prodotti alla lista
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="card padded trip-total">
                    <span>Nel tuo carrello</span>
                    <strong>{money(total(collected))}</strong>
                    <small>Budget: {money(state.profile.budget)}</small>
                  </div>
                </aside>
              </div>
              <section className="card padded">
                <div className="section-heading">
                  <h2>Le tue tappe</h2>
                  <span className="subtle">
                    Ordine aggiornato automaticamente
                  </span>
                </div>
                <div className="stops">
                  {currentRoute.order.map((i, k) => (
                    <div key={i.id}>
                      <span className="stop-number">{k + 1}</span>
                      <span>
                        {productById[i.id].emoji} {productById[i.id].name}
                      </span>
                      <small>
                        {categoryLabels[productById[i.id].category]}
                      </small>
                    </div>
                  ))}
                  {!currentRoute.order.length && (
                    <p>Tutti gli articoli sono stati raccolti o saltati.</p>
                  )}
                </div>
                {state.items.some((i) => i.status === "skipped") && (
                  <div className="notice">
                    Prodotti saltati:{" "}
                    {state.items
                      .filter((i) => i.status === "skipped")
                      .map((i) => (
                        <button
                          className="text-button"
                          key={i.id}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              items: s.items.map((x) =>
                                x.id === i.id ? { ...x, status: "pending" } : x,
                              ),
                            }))
                          }
                        >
                          Ripristina {productById[i.id].name}
                        </button>
                      ))}
                  </div>
                )}
              </section>
            </>
          )}
          {page === "pantry" && (
            <>
              <PageHeading
                eyebrow="IL BUONO CHE HAI GIÀ"
                title="La tua dispensa"
                description="Prima di comprare qualcosa di nuovo, dai un’occhiata qui."
              />
              <div className="notice">
                <Leaf size={19} />
                Le scadenze sono stimate per la demo: controlla sempre
                l’etichetta del prodotto.
              </div>
              <div className="two-column">
                <section className="card padded">
                  <div className="section-heading">
                    <h2>Da consumare con amore</h2>
                    <span className="tiny-badge">
                      {state.pantry.length} prodotti
                    </span>
                  </div>
                  {[...state.pantry]
                    .sort((a, b) => a.expires.localeCompare(b.expires))
                    .map((i, k) => (
                      <div
                        className="product-row"
                        key={`${i.id}-${i.expires}-${k}`}
                      >
                        <span className="food-icon">
                          {productById[i.id].emoji}
                        </span>
                        <div className="product-copy">
                          <strong>{productById[i.id].name}</strong>
                          <small>
                            {i.qty} confezioni · scadenza stimata{" "}
                            {new Date(i.expires).toLocaleDateString("it-IT")}
                          </small>
                        </div>
                        <span
                          className={`expiry ${daysLeft(i.expires) <= 3 ? "soon" : ""}`}
                        >
                          {daysLeft(i.expires) < 0
                            ? "Da verificare"
                            : `${daysLeft(i.expires)} giorni`}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={`Segna consumato ${productById[i.id].name}`}
                          onClick={() => {
                            setState((s) => ({
                              ...s,
                              pantry: s.pantry.filter((x) => x !== i),
                            }));
                            notify("Prodotto segnato come consumato");
                          }}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ))}
                  {!state.pantry.length && (
                    <div className="empty">
                      La dispensa è vuota. I prossimi acquisti compariranno qui.
                    </div>
                  )}
                </section>
                <aside className="challenge-card">
                  <Leaf size={30} />
                  <h2>
                    Il prossimo piatto
                    <br />è già a casa.
                  </h2>
                  <p>
                    Le ricette qui sotto usano almeno un ingrediente della tua
                    dispensa.
                  </p>
                  <span className="tiny-badge">
                    Obiettivo: {state.profile.goal}
                  </span>
                </aside>
              </div>
              <div className="section-heading">
                <h2>Idee svuota-frigo</h2>
              </div>
              <div className="recipe-grid all-recipes">
                {recommended
                  .filter((r) =>
                    r.ingredients.some((i) =>
                      state.pantry.some((p) => p.id === i.id),
                    ),
                  )
                  .map((r) => recipeCard(r))}
              </div>
              {!recommended.some((r) =>
                r.ingredients.some((i) =>
                  state.pantry.some((p) => p.id === i.id),
                ),
              ) && (
                <div className="empty">
                  Nessuna ricetta compatibile con gli ingredienti rimasti.
                </div>
              )}
            </>
          )}
          {page === "stats" && (
            <>
              <PageHeading
                eyebrow="LE TUE SCELTE, VISTE DA VICINO"
                title="Ogni spesa racconta qualcosa."
                description="Spese e risparmi del periodo, con le tue nuove spese demo."
              />
              <div className="stat-grid">
                <Stat
                  icon={Wallet}
                  label="Spesa nel periodo"
                  value={money(
                    state.purchases.reduce((n, p) => n + p.total, 0),
                  )}
                />
                <Stat
                  icon={Leaf}
                  label="Risparmio sulle offerte"
                  value={money(
                    state.purchases.reduce((n, p) => n + p.saved, 0),
                  )}
                />
                <Stat
                  icon={ShoppingBasket}
                  label="Spese completate nella demo"
                  value={String(realPurchases.length)}
                />
              </div>
              <div className="two-column">
                <section className="card padded">
                  <h2>Il tuo ritmo di spesa</h2>
                  <p className="subtle">
                    Le prime tre spese sono dati di esempio.
                  </p>
                  <div className="chart">
                    {state.purchases.slice(-7).map((p) => (
                      <div key={p.id} className="chart-column">
                        <strong>{money(p.total)}</strong>
                        <div
                          style={{
                            height: `${Math.max(8, (p.total / Math.max(...state.purchases.slice(-7).map((x) => x.total))) * 150)}px`,
                          }}
                        />
                        <small>
                          {new Date(p.date).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                          })}
                        </small>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="card padded">
                  <h2>Equilibrio del carrello</h2>
                  <p className="subtle">
                    Categorie degli acquisti demo; non è una valutazione
                    nutrizionale.
                  </p>
                  {Object.entries(categoryLabels).map(([cat, label]) => {
                    const items = realPurchases.flatMap((p) => p.items);
                    const amount = items
                      .filter((i) => productById[i.id].category === cat)
                      .reduce((n, i) => n + i.qty, 0);
                    const all = items.reduce((n, i) => n + i.qty, 0);
                    return (
                      <div className="category-stat" key={cat}>
                        <div>
                          <span>{label}</span>
                          <strong>
                            {all ? Math.round((amount / all) * 100) : 0}%
                          </strong>
                        </div>
                        <div className="progress-track">
                          <span
                            style={{
                              width: `${all ? (amount / all) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
              <section className="card padded">
                <h2>Le ultime spese</h2>
                {[...state.purchases].reverse().map((p) => (
                  <div className="purchase-row" key={p.id}>
                    <span className="icon-tile pale-green">
                      <ShoppingBasket size={19} />
                    </span>
                    <div>
                      <strong>
                        Lidl ·{" "}
                        {p.id.startsWith("sample")
                          ? "Spesa di esempio"
                          : "La tua spesa demo"}
                      </strong>
                      <small>
                        {new Date(p.date).toLocaleDateString("it-IT")}
                      </small>
                    </div>
                    <strong>{money(p.total)}</strong>
                    {!p.id.startsWith("sample") && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setState((s) => ({ ...s, lastReceipt: p.id }));
                          setReceiptOpen(true);
                        }}
                      >
                        Dettagli
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
          <footer>
            <span>
              <Logo />
              <span>Una spesa più semplice. Una scelta più consapevole.</span>
            </span>
            <button className="text-button" onClick={() => setReset(true)}>
              <RotateCcw size={13} />
              Reimposta demo
            </button>
            <small>
              Demo locale · dati illustrativi · nessun acquisto reale
            </small>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => go(id)}
          >
            <Icon size={20} />
            <span>{label.replace("La mia ", "")}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {welcome && onboarding < 0 && (
        <div className="modal-backdrop welcome-backdrop">
          <section
            className="welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Benvenuto in Grovia"
          >
            <div className="welcome-picture">
              <img
                src={`${import.meta.env.BASE_URL}images/bowl.jpg`}
                alt="Ingredienti freschi per una bowl"
              />
              <span>
                Più gusto.
                <br />
                Meno pensieri.
              </span>
            </div>
            <div className="welcome-content">
              <Logo />
              <span className="eyebrow">BENVENUTO NELLA TUA NUOVA SPESA</span>
              <h1>
                Il buono comincia
                <br />
                da te.
              </h1>
              <p>
                Ricette che ti somigliano, una lista intelligente e il percorso
                giusto tra le corsie.
              </p>
              <button
                className="primary full"
                onClick={() => {
                  setDraft({ ...defaultProfile, allergies: [] });
                  setOnboarding(0);
                }}
              >
                Crea il tuo Food Persona <ArrowRight size={17} />
              </button>
              <button
                className="secondary full"
                onClick={() => {
                  setWelcome(false);
                  setState((s) => ({ ...s, onboarded: true }));
                }}
              >
                Prova la demo <Sparkles size={16} />
              </button>
              <small>Gratuita. Locale. Nessun account necessario.</small>
            </div>
          </section>
        </div>
      )}
      {onboarding >= 0 && (
        <Modal
          title="Il tuo Food Persona"
          close={() => {
            setOnboarding(-1);
            setWelcome(false);
          }}
        >
          <div
            className="onboarding"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current !== null) {
                const delta = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(delta) > 70)
                  setOnboarding((s) =>
                    Math.max(0, Math.min(3, s + (delta < 0 ? 1 : -1))),
                  );
                touchX.current = null;
              }
            }}
          >
            <div className="step-dots">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i <= onboarding ? "active" : ""} />
              ))}
            </div>
            <span className="eyebrow">PASSO {onboarding + 1} DI 4</span>
            {onboarding === 0 ? (
              <>
                <span className="onboard-emoji">🥑</span>
                <h2>Che gusto ha la tua giornata?</h2>
                <label className="field-label">
                  Come ti chiami?
                  <input
                    maxLength={30}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </label>
                <div className="choice-list">
                  {["Tutto", "Vegetariana", "Vegana"].map((d) => (
                    <button
                      className={draft.diet === d ? "selected" : ""}
                      key={d}
                      onClick={() =>
                        setDraft({ ...draft, diet: d as Profile["diet"] })
                      }
                    >
                      {d}
                      <span>
                        {draft.diet === d ? (
                          <Check size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : onboarding === 1 ? (
              <>
                <span className="onboard-emoji">🌾</span>
                <h2>C’è qualcosa da evitare?</h2>
                <p>Le informazioni si basano solo sul catalogo dimostrativo.</p>
                <div className="chips large">
                  {[
                    "glutine",
                    "latte",
                    "uova",
                    "frutta a guscio",
                    "soia",
                    "pesce",
                  ].map((a) => (
                    <button
                      aria-pressed={draft.allergies.includes(a)}
                      className={draft.allergies.includes(a) ? "selected" : ""}
                      key={a}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          allergies: draft.allergies.includes(a)
                            ? draft.allergies.filter((x) => x !== a)
                            : [...draft.allergies, a],
                        })
                      }
                    >
                      {a}
                      {draft.allergies.includes(a) && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            ) : onboarding === 2 ? (
              <>
                <span className="onboard-emoji">🧺</span>
                <h2>Un budget, tante possibilità.</h2>
                <p>Quanto vuoi spendere per la prossima spesa?</p>
                <div className="budget-value">{money(draft.budget)}</div>
                <input
                  aria-label="Budget della spesa"
                  type="range"
                  min={15}
                  max={150}
                  step={5}
                  value={draft.budget}
                  onChange={(e) =>
                    setDraft({ ...draft, budget: Number(e.target.value) })
                  }
                />
                <div className="range-labels">
                  <span>15 €</span>
                  <span>150 €</span>
                </div>
              </>
            ) : (
              <>
                <span className="onboard-emoji">🌱</span>
                <h2>Cosa conta di più per te?</h2>
                <div className="choice-list">
                  {["Meno sprechi", "Più risparmio", "Più equilibrio"].map(
                    (g) => (
                      <button
                        className={draft.goal === g ? "selected" : ""}
                        key={g}
                        onClick={() => setDraft({ ...draft, goal: g })}
                      >
                        {g}
                        {draft.goal === g && <Check size={18} />}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
            <div className="onboarding-controls">
              <button
                className="secondary"
                disabled={onboarding === 0}
                onClick={() => setOnboarding(onboarding - 1)}
              >
                <ChevronLeft size={16} />
                Indietro
              </button>
              <button
                className="primary"
                disabled={!draft.name.trim()}
                onClick={() =>
                  onboarding === 3
                    ? saveProfile()
                    : setOnboarding(onboarding + 1)
                }
              >
                {onboarding === 3 ? "Ci siamo!" : "Continua"}
                <ArrowRight size={16} />
              </button>
            </div>
            <small>Scorri lateralmente oppure usa i pulsanti.</small>
          </div>
        </Modal>
      )}
      {selectedRecipe && (
        <Modal
          title="Un’idea buona, pronta in lista"
          close={() => setSelectedRecipe(null)}
        >
          <img
            className="modal-food"
            src={`${import.meta.env.BASE_URL}images/${selectedRecipe.image}.jpg`}
            alt={selectedRecipe.name}
          />
          <span className="eyebrow green">
            {selectedRecipe.minutes} MINUTI · FATTA PER TE
          </span>
          <h2>{selectedRecipe.name}</h2>
          <p>{selectedRecipe.subtitle}</p>
          <div className="section-heading">
            <strong>Quante persone?</strong>
            <div className="quantity">
              <button
                aria-label="Meno porzioni"
                disabled={servings === 1}
                onClick={() => setServings(servings - 1)}
              >
                <Minus size={14} />
              </button>
              <span>{servings}</span>
              <button
                aria-label="Più porzioni"
                disabled={servings === 8}
                onClick={() => setServings(servings + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          {recipeItems(selectedRecipe, servings).map((i) => (
            <div className="ingredient" key={i.id}>
              <span>
                {productById[i.id].emoji} {productById[i.id].name}
              </span>
              <span>
                {i.qty} × {productById[i.id].unit}
              </span>
            </div>
          ))}
          <p className="fine-print">
            Quantità arrotondate a confezioni intere. Gli ingredienti già in
            lista vengono sommati.
          </p>
          <button
            className="primary full"
            onClick={() => {
              setState((s) => ({
                ...s,
                items: addItems(s.items, recipeItems(selectedRecipe, servings)),
              }));
              setSelectedRecipe(null);
              notify("Ingredienti aggiunti alla tua lista");
            }}
          >
            <Plus size={17} />
            Aggiungi ingredienti alla lista
          </button>
        </Modal>
      )}
      {scan && (
        <Modal title="Smart cart · scanner demo" close={() => setScan(false)}>
          <div className="scan-frame">
            <ScanLine size={72} />
            <span>Scansione simulata</span>
          </div>
          <label className="field-label">
            Scegli un prodotto di esempio
            <select
              value={scanId}
              onChange={(e) => {
                setScanId(e.target.value);
                setScanned(false);
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {!scanned ? (
            <button className="primary full" onClick={() => setScanned(true)}>
              Simula scansione <ScanLine size={17} />
            </button>
          ) : (
            <>
              <h2>
                {productById[scanId].emoji} {productById[scanId].name}
              </h2>
              <p>Ingredienti: {productById[scanId].ingredients}</p>
              <div
                className={`notice ${compatibility(productById[scanId], state.profile).length ? "warning" : "green"}`}
              >
                <AlertCircle size={18} />
                {compatibility(productById[scanId], state.profile).join(
                  " · ",
                ) || "Compatibile con le preferenze del profilo demo"}
              </div>
              <p className="fine-print">
                Dati di esempio. Controlla sempre ingredienti e allergeni
                sull’etichetta reale.
              </p>
              {!productById[scanId].available ? (
                <p className="warning">Non disponibile nel negozio demo.</p>
              ) : (
                <button
                  className="primary full"
                  onClick={() => {
                    const id = scanId;
                    setState((s) => {
                      const exists = s.items.find((i) => i.id === id);
                      return {
                        ...s,
                        position: productById[id].node,
                        items: exists
                          ? s.items.map((i) =>
                              i.id === id ? { ...i, status: "collected" } : i,
                            )
                          : [...s.items, { id, qty: 1, status: "collected" }],
                      };
                    });
                    setScan(false);
                    notify("Prodotto inserito nel carrello demo");
                  }}
                >
                  Conferma e metti nel carrello <Check size={17} />
                </button>
              )}
            </>
          )}
        </Modal>
      )}
      {selectedStop && (
        <Modal title="La tua tappa" close={() => setSelectedStop(null)}>
          <span className="next-emoji">{selectedStop.emoji}</span>
          <h2>{selectedStop.name}</h2>
          <p>
            {selectedStop.unit} · {categoryLabels[selectedStop.category]} ·
            Corsia {store.nodes[selectedStop.node].aisle ?? "perimetrale"}
          </p>
          <p>Ingredienti di esempio: {selectedStop.ingredients}</p>
          {compatibility(selectedStop, state.profile).length > 0 && (
            <div className="notice warning">
              {compatibility(selectedStop, state.profile).join(" · ")}
            </div>
          )}
          <p className="fine-print">
            Puoi raccogliere anche fuori ordine: il percorso restante si
            aggiornerà dalla posizione del prodotto.
          </p>
          <button
            className="primary full"
            onClick={() => {
              collect(selectedStop.id);
              setSelectedStop(null);
            }}
          >
            <Check size={17} />
            Raccogli prodotto
          </button>
        </Modal>
      )}
      {reset && (
        <Modal title="Una nuova partenza?" close={() => setReset(false)}>
          <p>
            Le liste, le preferenze e le spese demo salvate su questo browser
            verranno ripristinate ai dati iniziali.
          </p>
          <button
            className="primary full"
            onClick={() => {
              setState(initialState());
              setPage("home");
              setWelcome(true);
              setReset(false);
              notify("Demo ripristinata");
            }}
          >
            <RotateCcw size={17} />
            Reimposta la demo
          </button>
          <button className="secondary full" onClick={() => setReset(false)}>
            Torna alla mia spesa
          </button>
        </Modal>
      )}
      {receiptOpen && receipt && (
        <Modal
          title="La tua spesa, fatta bene."
          close={() => setReceiptOpen(false)}
        >
          <div className="receipt-success">
            <CheckCheck size={36} />
          </div>
          <h2>Il buono torna a casa.</h2>
          <p>
            Lidl · {new Date(receipt.date).toLocaleDateString("it-IT")} ·
            Ricevuta dimostrativa
          </p>
          {receipt.items.map((i) => (
            <div className="ingredient" key={i.id}>
              <span>
                {i.qty} × {productById[i.id].name}
              </span>
              <strong>{money(price(productById[i.id]) * i.qty)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Totale</span>
            <strong>{money(receipt.total)}</strong>
          </div>
          <p className="green">
            Hai risparmiato {money(receipt.saved)} con le offerte demo.
          </p>
          <div className="notice">
            <Leaf size={19} />I prodotti sono già nella tua dispensa, con una
            scadenza stimata.
          </div>
          <button
            className="primary full"
            onClick={() => {
              setReceiptOpen(false);
              go("pantry");
            }}
          >
            Guarda la dispensa <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </div>
  );
}
function daysLeft(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <section className="card stat-card">
      <span className="icon-tile pale-green">
        <Icon size={21} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
    </section>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-top">
          <strong>{title}</strong>
          <button
            className="icon-button"
            aria-label="Chiudi finestra"
            onClick={close}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function StoreMap({
  path,
  position,
  items,
  onSelect,
}: {
  path: string[];
  position: string;
  items: Item[];
  onSelect: (id: string) => void;
}) {
  const nodes = Object.values(store.nodes);
  const maxX = Math.max(...nodes.map((n) => n.x)),
    maxY = Math.max(...nodes.map((n) => n.y));
  const point = (id: string) => ({
    x: 48 + (store.nodes[id].x / maxX) * 600,
    y: 55 + ((maxY - store.nodes[id].y) / maxY) * 430,
  });
  const pos = point(position);
  return (
    <svg
      className="store-map"
      viewBox="0 0 700 540"
      role="group"
      aria-label={`Mappa Lidl, ${items.length} tappe rimanenti, percorso evidenziato in arancione`}
    >
      <rect
        x="18"
        y="20"
        width="664"
        height="493"
        rx="22"
        fill="#f7f7ef"
        stroke="#e3e7de"
      />
      <text
        x="350"
        y="43"
        textAnchor="middle"
        fill="#778573"
        fontSize="11"
        letterSpacing="2"
      >
        FRESCHI · BANCO FRIGO
      </text>
      {Array.from({ length: 9 }, (_, i) => {
        const left = (i * maxX) / 9,
          right = ((i + 1) * maxX) / 9;
        // Split shelves wherever the original graph has a cross-aisle.
        const gaps = [
          ...new Set([
            55,
            485,
            ...store.edges
              .filter(([a, b]) => {
                const p = store.nodes[a],
                  q = store.nodes[b];
                return (
                  p.y === q.y &&
                  Math.min(p.x, q.x) <= left &&
                  Math.max(p.x, q.x) >= right
                );
              })
              .map(([a]) => point(a).y),
          ]),
        ].sort((a, b) => a - b);
        return (
          <g key={i}>
            {gaps.slice(0, -1).map((y, k) => (
              <rect
                key={y}
                x={62 + (i * 600) / 9}
                y={y + 15}
                width={38}
                height={Math.max(0, gaps[k + 1] - y - 30)}
                rx={7}
                fill={i === 6 ? "#e4eff2" : "#e7e9df"}
              />
            ))}
            <text
              x={79 + i * 66.7}
              y={135}
              textAnchor="middle"
              fill="#89937e"
              fontSize="13"
            >
              {i}
            </text>
          </g>
        );
      })}
      {store.edges.map(([a, b], i) => {
        const p = point(a),
          q = point(b);
        return (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="#dfe4d9"
            strokeWidth="2"
          />
        );
      })}
      <polyline
        points={path
          .map((id) => {
            const p = point(id);
            return `${p.x},${p.y}`;
          })
          .join(" ")}
        fill="none"
        stroke="#ffddd0"
        strokeWidth="12"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={path
          .map((id) => {
            const p = point(id);
            return `${p.x},${p.y}`;
          })
          .join(" ")}
        fill="none"
        stroke="#f36b3e"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {items.map((i, k) => {
        const p = point(productById[i.id].node);
        return (
          <g
            key={i.id}
            role="button"
            tabIndex={0}
            aria-label={`Tappa ${k + 1}: ${productById[i.id].name}`}
            onClick={() => onSelect(i.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(i.id);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <title>
              {k + 1}. {productById[i.id].name}
            </title>
            <circle
              cx={p.x}
              cy={p.y}
              r={k === 0 ? 14 : 11}
              fill={k === 0 ? "#f36b3e" : "#fff"}
              stroke="#f36b3e"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={k === 0 ? "white" : "#b64b27"}
            >
              {k + 1}
            </text>
          </g>
        );
      })}
      <circle cx={pos.x} cy={pos.y} r="19" fill="#2b7259" opacity=".16" />
      <circle
        cx={pos.x}
        cy={pos.y}
        r="10"
        fill="#2b7259"
        stroke="white"
        strokeWidth="3"
      />
      <text
        x="650"
        y="510"
        textAnchor="end"
        fill="#2b7259"
        fontSize="11"
        fontWeight="700"
      >
        INGRESSO ↑
      </text>
      <text x="50" y="510" fill="#788170" fontSize="11" fontWeight="700">
        CASSE ↓
      </text>
    </svg>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
