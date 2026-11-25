// Keyboard and pointer input. Discrete presses are queued and taken once by the loop, so
// a press between two frames is never lost and never counted twice. Pointer positions
// are converted to logical field coordinates with the renderer's converter.
import { INGREDIENTS } from './config.js';
import { binRect, inside, serveRect, trashRect } from './geometry.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const TRASH = new Set(['KeyT', 'Backspace']);
const DIGITS = new Map(INGREDIENTS.map((ing) => [`Digit${ing.key}`, ing.id]));

export function createInput(canvas, toLogical) {
  const queue = [];
  let flags = 0;

  function push(action) {
    queue.push(action);
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (DIGITS.has(event.code)) {
      push({ type: 'ingredient', id: DIGITS.get(event.code) });
      event.preventDefault();
    } else if (CONFIRM.has(event.code)) {
      flags |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (PAUSE.has(event.code)) {
      flags |= ACTION_PAUSE;
      event.preventDefault();
    } else if (TRASH.has(event.code)) {
      push({ type: 'trash' });
      event.preventDefault();
    }
  });

  canvas.addEventListener('pointerdown', (event) => {
    const pos = toLogical(event.clientX, event.clientY);
    if (!pos) return;
    // Ingredient bins first.
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(binRect(i), pos.x, pos.y)) {
        push({ type: 'ingredient', id: INGREDIENTS[i].id });
        return;
      }
    }
    if (inside(serveRect(), pos.x, pos.y)) {
      push({ type: 'serve' });
      return;
    }
    if (inside(trashRect(), pos.x, pos.y)) {
      push({ type: 'trash' });
      return;
    }
    // Anywhere else is a confirm (start, resume, restart) — but never a serve: a
    // misclick on empty counter must not throw the plate away.
    push({ type: 'confirm' });
  });

  return {
    /** Drain the queued actions and flags since the last call. */
    take() {
      const actions = queue.splice(0, queue.length);
      const taken = flags;
      flags = 0;
      return { actions, flags: taken };
    },
  };
}
