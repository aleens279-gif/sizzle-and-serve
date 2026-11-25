// The game's rules and state, with no drawing and no browser in it: the order board, the
// plate, the shift clock, coins, combo and hearts. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createWorld returns (orders are
// pooled and reused).
import { FIELD, HEARTS, INGREDIENTS, ORDER, PLATE_MAX, RECIPES, SERVE, SHIFT_SECONDS, COMBO_MAX } from './config.js';

export const EVENT_SPAWN = 1;
export const EVENT_SERVE_OK = 2;
export const EVENT_SERVE_BAD = 4;
export const EVENT_FAIL = 8;
export const EVENT_OVER = 16;

/** True when two multisets of ingredient ids hold the same items. */
function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const id of a) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const id of b) {
    const n = counts.get(id) ?? 0;
    if (n === 0) return false;
    counts.set(id, n - 1);
  }
  return true;
}

export function createWorld(random) {
  const orders = [];
  for (let index = 0; index < ORDER.maxActive; index += 1) {
    orders.push({ active: false, id: 0, recipe: null, items: [], patience: 0, maxPatience: 1, value: 0, flash: 0 });
  }
  const plate = [];
  const state = {
    orders,
    plate,
    coins: 0,
    served: 0,
    failed: 0,
    hearts: HEARTS,
    combo: 0,
    maxCombo: 0,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnTimer: 2.5,
    over: false,
    overReason: '',
    nextOrderId: 1,
    /** Seconds left on the little "just served / just failed" banner. */
    banner: 0,
    bannerText: '',
    bannerGood: true,
    /** Seconds the plate has been wiggling since the last add. */
    platePop: 0,
    /** Coins earned by the last serve, for the floating "+N" text. */
    lastEarned: 0,
    earnedTimer: 0,
  };

  function reset() {
    for (const order of orders) order.active = false;
    plate.length = 0;
    state.coins = 0;
    state.served = 0;
    state.failed = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.maxCombo = 0;
    state.shiftLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.spawnTimer = 2.5;
    state.over = false;
    state.overReason = '';
    state.nextOrderId = 1;
    state.banner = 0;
    state.bannerText = '';
    state.platePop = 0;
    state.lastEarned = 0;
    state.earnedTimer = 0;
  }

  function freeOrder() {
    for (const order of orders) if (!order.active) return order;
    return null;
  }

  function activeCount() {
    let n = 0;
    for (const order of orders) if (order.active) n += 1;
    return n;
  }

  function spawnOrder() {
    const slot = freeOrder();
    if (slot === null) return false;
    const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
    slot.active = true;
    slot.id = state.nextOrderId;
    state.nextOrderId += 1;
    slot.recipe = recipe;
    slot.items = recipe.items;
    slot.maxPatience = ORDER.patience + random() * ORDER.patienceJitter;
    slot.patience = slot.maxPatience;
    slot.value = recipe.value;
    slot.flash = 0;
    return true;
  }

  /** Add one ingredient to the plate. False when the plate is full or the shift is over. */
  function addIngredient(id) {
    if (state.over || plate.length >= PLATE_MAX) return false;
    plate.push(id);
    state.platePop = 0.18;
    return true;
  }

  /** Empty the plate without serving. */
  function trash() {
    if (state.over || plate.length === 0) return false;
    plate.length = 0;
    state.combo = 0;
    state.banner = 1.2;
    state.bannerText = 'Trashed. Combo lost.';
    state.bannerGood = false;
    return true;
  }

  /**
   * Serve the plate. When it matches an active order exactly, that order is completed:
   * coins = recipe value + a patience tip, times the combo multiplier. Otherwise the
   * plate is trashed and the combo resets. Returns the earned coins, or 0 on a miss.
   */
  function serve() {
    if (state.over || plate.length === 0) return 0;
    let match = null;
    for (const order of orders) {
      if (order.active && sameMultiset(plate, order.items)) {
        match = order;
        break;
      }
    }
    if (match === null) {
      plate.length = 0;
      state.combo = 0;
      state.banner = 1.4;
      state.bannerText = 'No order matches that dish!';
      state.bannerGood = false;
      return 0;
    }
    const patienceFrac = Math.max(0, match.patience / match.maxPatience);
    const tip = Math.round(SERVE.tipMax * patienceFrac);
    const mult = Math.min(COMBO_MAX, state.combo + 1);
    const earned = (match.value + tip) * mult;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    state.lastEarned = earned;
    state.earnedTimer = 1.2;
    state.banner = 1.4;
    state.bannerText = `Served ${match.recipe.name}! +${earned} coins${mult > 1 ? ` (x${mult} combo)` : ''}`;
    state.bannerGood = true;
    match.active = false;
    plate.length = 0;
    return earned;
  }

  /**
   * One fixed step. Advances the shift clock, order patience and spawning; a patience
   * of zero fails the order and costs a heart, and three failed orders or an empty clock
   * ends the shift. The title screen uses stepBackdrop instead, so nothing here can
   * fail while the player is reading the menu.
   */
  function step(dt) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (state.platePop > 0) state.platePop = Math.max(0, state.platePop - dt);
    if (state.banner > 0) state.banner = Math.max(0, state.banner - dt);
    if (state.earnedTimer > 0) state.earnedTimer = Math.max(0, state.earnedTimer - dt);

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (activeCount() < ORDER.maxActive && spawnOrder()) events |= EVENT_SPAWN;
      state.spawnTimer += ORDER.spawnInterval;
    }

    for (const order of orders) {
      if (!order.active) continue;
      if (order.flash > 0) order.flash = Math.max(0, order.flash - dt);
      order.patience -= dt;
      if (order.patience <= 0) {
        order.active = false;
        state.failed += 1;
        state.combo = 0;
        state.banner = 1.6;
        state.bannerText = `Order #${order.id} walked out! -1 heart`;
        state.bannerGood = false;
        events |= EVENT_FAIL;
        state.hearts -= 1;
        if (state.hearts <= 0) {
          state.over = true;
          state.overReason = 'Too many walk-outs!';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    state.shiftLeft -= dt;
    if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      state.over = true;
      state.overReason = 'Shift complete!';
      events |= EVENT_OVER;
    }
    return events;
  }

  /** The title screen's backdrop: orders drift in and patience ticks, but nothing fails. */
  function stepBackdrop(dt) {
    state.elapsed += dt;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (activeCount() < ORDER.maxActive) spawnOrder();
      state.spawnTimer += ORDER.spawnInterval;
    }
    for (const order of orders) {
      if (!order.active) continue;
      order.patience -= dt * 0.4;
      if (order.patience <= 0) order.patience = order.maxPatience;
    }
  }

  reset();
  return { state, reset, step, stepBackdrop, addIngredient, serve, trash, activeCount };
}
