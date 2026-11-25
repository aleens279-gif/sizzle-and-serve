// The rectangles every screen shares, so the renderer and the input agree on where a
// button or a bin is. All values are logical pixels in the 1280x720 field.
import { FIELD, INGREDIENTS, LAYOUT } from './config.js';

/** The rectangle of ingredient bin `index` (0-based, left to right). */
export function binRect(index) {
  const total = INGREDIENTS.length * LAYOUT.bins.w + (INGREDIENTS.length - 1) * LAYOUT.bins.gap;
  const x0 = (FIELD.width - total) / 2 + index * (LAYOUT.bins.w + LAYOUT.bins.gap);
  return { x: x0, y: LAYOUT.bins.y, w: LAYOUT.bins.w, h: LAYOUT.bins.h };
}

/** The rectangle of order ticket `index` (0-based, left to right) on the board. */
export function ticketRect(index) {
  const total = 3 * LAYOUT.ticket.w + 2 * LAYOUT.ticket.gap;
  const x0 = LAYOUT.board.x + (LAYOUT.board.w - total) / 2 + index * (LAYOUT.ticket.w + LAYOUT.ticket.gap);
  return { x: x0, y: LAYOUT.board.y + 8, w: LAYOUT.ticket.w, h: LAYOUT.ticket.h };
}

export function serveRect() {
  return { ...LAYOUT.serveBtn };
}

export function trashRect() {
  return { ...LAYOUT.trashBtn };
}

export function plateRect() {
  return { x: LAYOUT.plate.cx - LAYOUT.plate.w / 2, y: LAYOUT.plate.cy - LAYOUT.plate.h / 2, w: LAYOUT.plate.w, h: LAYOUT.plate.h };
}

export function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
