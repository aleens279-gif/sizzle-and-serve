// Every tuning number, colour and layout value in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. "Sizzle & Serve": a burger-rush game. Orders arrive on the board,
// the cook stacks ingredients on the plate, serves the matching dish before the
// customer's patience runs out.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** A shift lasts this long; when the clock hits zero the shift is over. */
export const SHIFT_SECONDS = 120;

/** Failed orders allowed before the shift ends early. */
export const HEARTS = 3;

/** Seconds between order spawns, and the most orders on the board at once. */
export const ORDER = {
  spawnInterval: 7,
  maxActive: 3,
  patience: 24,
  patienceJitter: 5,
};

/** The most ingredients a plate can hold. */
export const PLATE_MAX = 6;

/** Coins for serving, before the patience tip and the combo multiplier. */
export const SERVE = { base: 12, tipMax: 10 };

/** Combo multiplier caps at this many in a row. */
export const COMBO_MAX = 4;

// Ingredients: id, name, key, colours for the drawing, and a short label.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', top: '#f2c078', bottom: '#d99a4e', edge: '#b57a33' },
  { id: 'patty', name: 'Patty', key: '2', top: '#7a4a21', bottom: '#5d3413', edge: '#4a280e' },
  { id: 'cheese', name: 'Cheese', key: '3', top: '#ffcf3f', bottom: '#f2a900', edge: '#d18a00' },
  { id: 'lettuce', name: 'Lettuce', key: '4', top: '#7ed957', bottom: '#4caf3c', edge: '#3a8f2c' },
  { id: 'tomato', name: 'Tomato', key: '5', top: '#ff5a4e', bottom: '#d63a2e', edge: '#a92a20' },
  { id: 'onion', name: 'Onion', key: '6', top: '#c9a7e8', bottom: '#9b6fc4', edge: '#7d54a3' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// The menu: every order is one of these. `items` is the exact multiset the plate must hold.
// Each dish starts with a bottom bun and finishes with a top bun, so a finished dish
// reads as a real burger with a golden dome on top.
export const RECIPES = [
  { name: 'Classic Burger', items: ['bun', 'patty', 'lettuce', 'tomato', 'bun'], value: 14 },
  { name: 'Cheese Burger', items: ['bun', 'patty', 'cheese', 'tomato', 'bun'], value: 16 },
  { name: 'Double Stack', items: ['bun', 'patty', 'patty', 'cheese', 'lettuce', 'bun'], value: 22 },
  { name: 'Garden Veggie', items: ['bun', 'lettuce', 'tomato', 'onion', 'cheese', 'bun'], value: 20 },
  { name: 'Onion Melt', items: ['bun', 'patty', 'cheese', 'onion', 'bun'], value: 18 },
];

// Layout rectangles (logical pixels). The order board is the top strip; the kitchen
// counter with the plate sits in the middle; the ingredient bins line the bottom.
export const LAYOUT = {
  board: { x: 24, y: 16, w: 1232, h: 128 },
  ticket: { w: 280, h: 112, gap: 16 },
  plate: { cx: 640, cy: 400, w: 380, h: 210 },
  serveBtn: { x: 1064, y: 300, w: 150, h: 64 },
  trashBtn: { x: 1064, y: 380, w: 150, h: 44 },
  bins: { y: 560, h: 132, gap: 14, w: 190 },
  hud: { x: 24, y: 152, w: 1232, h: 40 },
};

export const PALETTE = {
  wall: '#f7e8c9',
  wallTile: '#f2dcb4',
  board: '#3b2f2f',
  boardEdge: '#2a2121',
  counter: '#b4713a',
  counterEdge: '#8a5226',
  counterTop: '#d98d4e',
  plate: '#fdfdf6',
  plateEdge: '#cfc9b8',
  ticket: '#fffdf5',
  ticketEdge: '#e3d9c2',
  text: '#2b2118',
  muted: '#7a6a58',
  coin: '#f2c94c',
  heart: '#e5534b',
  heartEmpty: '#d8cbb8',
  timer: '#4caf3c',
  timerLow: '#e5534b',
  serve: '#43a047',
  serveEdge: '#2e7d32',
  trash: '#c62828',
  panel: '#fff8ea',
  overlay: 'rgba(43, 33, 24, 0.72)',
  title: '#fff3d6',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
