// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world for a fixed amount of time, steered by a simple autopilot
// (pick the oldest order, add its missing ingredients one at a time, serve when the
// plate matches), so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 60;
const END_LIMIT_SECONDS = 240;
/** Seconds between the autopilot's actions. */
const ACTION_EVERY = 0.35;

/** The oldest active order, or null. */
function oldestOrder(state) {
  let best = null;
  for (const order of state.orders) {
    if (order.active && (best === null || order.id < best.id)) best = order;
  }
  return best;
}

/** The first ingredient of `order` the plate does not yet cover (duplicates counted). */
function missingIngredient(order, plate) {
  const remaining = [...order.items];
  for (const id of plate) {
    const idx = remaining.indexOf(id);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining.length > 0 ? remaining[0] : null;
}

/**
 * One autopilot decision: 'serve' when the plate matches the target order, the next
 * missing ingredient id when it does not, or null when there is nothing to do.
 */
function autopilot(state) {
  const order = oldestOrder(state);
  if (!order) return null;
  const missing = missingIngredient(order, state.plate);
  if (missing === null) return 'serve';
  return missing;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const { state } = world;
  world.reset();
  if (name !== 'play' && name !== 'end') {
    // Title: let the backdrop kitchen fill up for a few seconds, then show the menu.
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.stepBackdrop(STEP);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  let actionTimer = 0;
  let served = 0;
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP);
    if (events & EVENT_OVER) break;
    // The end scene plays well for a while, then the cook walks away and orders fail.
    if (name === 'end' && state.served >= 2) {
      actionTimer = 0;
      continue;
    }
    actionTimer += STEP;
    if (actionTimer < ACTION_EVERY) continue;
    actionTimer = 0;
    const decision = autopilot(state);
    if (decision === null) continue;
    if (decision === 'serve') {
      const before = state.served;
      world.serve();
      if (state.served > before) served += 1;
      continue;
    }
    world.addIngredient(decision);
    // The play scene stops the moment the second order is half built, so the frame
    // shows a dish mid-assembly on the plate, the game still in progress.
    if (name === 'play' && served >= 1 && state.plate.length >= 2) break;
  }
  const over = state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: state.coins };
}
