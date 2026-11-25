// Everything on screen, and nothing else: the kitchen, the order board, the plate with
// its stack, the ingredient bins, the HUD and the four screens (title, play, paused,
// game over). The playfield is a fixed 1280x720 logical area scaled to the window.
import { FIELD, FONT, INGREDIENTS, ING_BY_ID, LAYOUT, PALETTE } from './config.js';
import { binRect, plateRect, serveRect, ticketRect, trashRect } from './geometry.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Draw one ingredient as a horizontal layer, `w` wide and `h` tall. */
function drawIngredient(ctx, id, x, y, w, h, dome) {
  const ing = ING_BY_ID[id];
  if (!ing) return;
  ctx.save();
  if (id === 'bun' && dome) {
    // A top bun: a golden dome with sesame dots.
    ctx.fillStyle = ing.top;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x, y, x + w / 2, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [fx, fy] of [[0.3, 0.35], [0.5, 0.22], [0.7, 0.35], [0.42, 0.45], [0.6, 0.5]]) {
      ctx.beginPath();
      ctx.ellipse(x + w * fx, y + h * fy, 2.5, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'bun') {
    // A bottom bun: a flat golden base.
    ctx.fillStyle = ing.bottom;
    roundRect(ctx, x, y + h * 0.25, w, h * 0.75, h * 0.3);
    ctx.fill();
    ctx.fillStyle = ing.top;
    roundRect(ctx, x, y + h * 0.25, w, h * 0.3, h * 0.3);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = ing.top;
    roundRect(ctx, x + 2, y + h * 0.12, w - 4, h * 0.76, h * 0.32);
    ctx.fill();
    ctx.fillStyle = ing.bottom;
    roundRect(ctx, x + 2, y + h * 0.55, w - 4, h * 0.33, h * 0.25);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.top;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.15);
    ctx.lineTo(x + w, y + h * 0.15);
    ctx.lineTo(x + w, y + h * 0.7);
    ctx.lineTo(x + w * 0.72, y + h * 0.7);
    ctx.lineTo(x + w * 0.66, y + h);
    ctx.lineTo(x + w * 0.58, y + h * 0.7);
    ctx.lineTo(x, y + h * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.top;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.55);
    const bumps = 6;
    for (let i = 0; i < bumps; i += 1) {
      const bx = x + (w / bumps) * i;
      ctx.quadraticCurveTo(bx + w / bumps / 2, y - h * 0.25, bx + w / bumps, y + h * 0.55);
    }
    ctx.lineTo(x + w, y + h * 0.85);
    ctx.lineTo(x, y + h * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.bottom;
    ctx.fillRect(x, y + h * 0.6, w, h * 0.25);
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.top;
    roundRect(ctx, x + 6, y + h * 0.15, w - 12, h * 0.7, h * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, x + 14, y + h * 0.25, w * 0.3, h * 0.22, h * 0.12);
    ctx.fill();
  } else if (id === 'onion') {
    ctx.fillStyle = ing.top;
    roundRect(ctx, x, y + h * 0.2, w, h * 0.6, h * 0.28);
    ctx.fill();
    ctx.strokeStyle = '#efe6f7';
    ctx.lineWidth = 2;
    for (const fx of [0.25, 0.5, 0.75]) {
      ctx.beginPath();
      ctx.arc(x + w * fx, y + h * 0.5, h * 0.26, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A small ingredient icon (a rounded chip with the layer drawn inside). */
function drawIcon(ctx, id, x, y, size) {
  ctx.fillStyle = '#fffdf5';
  roundRect(ctx, x, y, size, size, 6);
  ctx.fill();
  ctx.strokeStyle = '#e3d9c2';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawIngredient(ctx, id, x + 4, y + size * 0.22, size - 8, size * 0.56, id === 'bun');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scale = Math.min(w / FIELD.width, h / FIELD.height) * dpr;
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function drawWall() {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Tile lines on the wall.
    ctx.strokeStyle = PALETTE.wallTile;
    ctx.lineWidth = 2;
    for (let x = 0; x <= FIELD.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 250);
      ctx.stroke();
    }
    for (let y = 0; y <= 250; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
    // A sunny window and a shelf with jars, for kitchen warmth.
    ctx.fillStyle = '#bfe3f2';
    roundRect(ctx, 60, 30, 150, 110, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(170, 62, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(128, 30, 6, 110);
    ctx.fillRect(60, 80, 150, 6);
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, 1060, 44, 170, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#e8b4b8';
    roundRect(ctx, 1080, 18, 26, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#a8d8a8';
    roundRect(ctx, 1120, 18, 26, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    roundRect(ctx, 1160, 18, 26, 26, 6);
    ctx.fill();
  }

  function drawCounter() {
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, 250, FIELD.width, 290);
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, 250, FIELD.width, 10);
    ctx.fillStyle = PALETTE.counterEdge;
    ctx.fillRect(0, 536, FIELD.width, 8);
    // A grill on the left of the counter, with patties sizzling.
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, 40, 300, 220, 130, 12);
    ctx.fill();
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = 3;
    for (let i = 1; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 36, 306);
      ctx.lineTo(40 + i * 36, 424);
      ctx.stroke();
    }
    drawIngredient(ctx, 'patty', 66, 340, 70, 34, false);
    drawIngredient(ctx, 'patty', 150, 372, 70, 34, false);
    // Steam curls above the grill.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(90, 320);
    ctx.quadraticCurveTo(80, 300, 92, 284);
    ctx.moveTo(180, 330);
    ctx.quadraticCurveTo(192, 308, 180, 292);
    ctx.stroke();
  }

  function drawBoard(state) {
    const board = LAYOUT.board;
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, board.x, board.y, board.w, board.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.boardEdge;
    roundRect(ctx, board.x, board.y, board.w, 10, 6);
    ctx.fill();
    text(ctx, 'ORDER BOARD', board.x + 16, board.y + 30, 20, '#f2c94c', 800);
    for (let i = 0; i < 3; i += 1) {
      const rect = ticketRect(i);
      const order = state.orders[i];
      ctx.fillStyle = order && order.active ? PALETTE.ticket : 'rgba(255,253,245,0.16)';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      if (!order || !order.active) {
        text(ctx, '— open —', rect.x + rect.w / 2, rect.y + rect.h / 2 + 6, 16, '#8a7a66', 600, 'center');
        continue;
      }
      const frac = Math.max(0, order.patience / order.maxPatience);
      text(ctx, `#${order.id}  ${order.recipe.name}`, rect.x + 12, rect.y + 26, 18, PALETTE.text, 800);
      text(ctx, `$${order.value}`, rect.x + rect.w - 12, rect.y + 26, 18, '#b8860b', 800, 'right');
      // Ingredient icons for the recipe.
      order.items.forEach((id, idx) => {
        drawIcon(ctx, id, rect.x + 12 + idx * 34, rect.y + 38, 28);
      });
      // Patience bar.
      ctx.fillStyle = '#e8e0cf';
      roundRect(ctx, rect.x + 12, rect.y + 80, rect.w - 24, 12, 6);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? PALETTE.timer : frac > 0.25 ? '#f2a900' : PALETTE.timerLow;
      roundRect(ctx, rect.x + 12, rect.y + 80, (rect.w - 24) * frac, 12, 6);
      ctx.fill();
      text(ctx, `${Math.ceil(order.patience)}s`, rect.x + rect.w - 12, rect.y + 106, 13, PALETTE.muted, 700, 'right');
    }
  }

  function drawHud(state) {
    const hud = LAYOUT.hud;
    // Coins.
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(hud.x + 16, hud.y + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6d00';
    ctx.font = `800 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('$', hud.x + 16, hud.y + 26);
    text(ctx, `${state.coins}`, hud.x + 38, hud.y + 27, 24, PALETTE.text, 800);
    // Combo badge.
    if (state.combo >= 2) {
      ctx.fillStyle = '#ff8f00';
      roundRect(ctx, hud.x + 150, hud.y + 4, 110, 32, 16);
      ctx.fill();
      text(ctx, `COMBO x${Math.min(state.combo, 4)}`, hud.x + 205, hud.y + 27, 18, '#fff', 800, 'center');
    }
    // Shift timer.
    const frac = Math.max(0, state.shiftLeft / 120);
    text(ctx, `SHIFT ${formatTime(state.shiftLeft)}`, hud.x + 560, hud.y + 27, 20, PALETTE.text, 800, 'center');
    ctx.fillStyle = '#e8e0cf';
    roundRect(ctx, hud.x + 640, hud.y + 8, 220, 14, 7);
    ctx.fill();
    ctx.fillStyle = frac > 0.3 ? PALETTE.timer : PALETTE.timerLow;
    roundRect(ctx, hud.x + 640, hud.y + 8, 220 * frac, 14, 7);
    ctx.fill();
    // Hearts.
    for (let i = 0; i < 3; i += 1) {
      const cx = hud.x + hud.w - 24 - i * 36;
      const cy = hud.y + 20;
      ctx.fillStyle = i < state.hearts ? PALETTE.heart : PALETTE.heartEmpty;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8);
      ctx.bezierCurveTo(cx - 14, cy - 4, cx - 8, cy - 14, cx, cy - 6);
      ctx.bezierCurveTo(cx + 8, cy - 14, cx + 14, cy - 4, cx, cy + 8);
      ctx.fill();
    }
    text(ctx, 'orders served', hud.x + hud.w - 160, hud.y + 27, 15, PALETTE.muted, 600, 'right');
    text(ctx, `${state.served}`, hud.x + hud.w - 140, hud.y + 27, 18, PALETTE.text, 800);
  }

  function drawPlate(state) {
    const rect = plateRect();
    const pop = state.platePop > 0 ? 1 + state.platePop * 0.35 : 1;
    // The plate itself: a white ellipse with a rim.
    ctx.save();
    ctx.translate(LAYOUT.plate.cx, LAYOUT.plate.cy + 62);
    ctx.scale(pop, pop);
    ctx.fillStyle = PALETTE.plateEdge;
    ctx.beginPath();
    ctx.ellipse(0, 0, rect.w / 2, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(0, 0, rect.w / 2 - 10, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The stack, bottom to top. Its base sits on the plate's surface (the plate's
    // centre is cy+62, so the bottom layer ends just above it).
    const layerH = 26;
    const stackW = 300;
    const baseY = LAYOUT.plate.cy + 62 - 14;
    state.plate.forEach((id, idx) => {
      const isTop = idx === state.plate.length - 1;
      const y = baseY - (idx + 1) * layerH;
      drawIngredient(ctx, id, LAYOUT.plate.cx - stackW / 2, y, stackW, layerH, isTop);
    });
    if (state.plate.length === 0) {
      text(ctx, 'Plate is empty — pick ingredients below', LAYOUT.plate.cx, LAYOUT.plate.cy - 70, 17, '#8a6a45', 600, 'center');
    }
    // Floating "+N coins" after a serve.
    if (state.earnedTimer > 0 && state.lastEarned > 0) {
      const alpha = Math.min(1, state.earnedTimer);
      ctx.globalAlpha = alpha;
      text(ctx, `+${state.lastEarned}`, LAYOUT.plate.cx + 210, LAYOUT.plate.cy - 40 - (1.2 - state.earnedTimer) * 40, 28, '#2e7d32', 800, 'center');
      ctx.globalAlpha = 1;
    }
    // Serve and trash buttons.
    const serve = serveRect();
    const canServe = state.plate.length > 0;
    ctx.fillStyle = canServe ? PALETTE.serve : '#9aa58f';
    roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 12);
    ctx.fill();
    ctx.fillStyle = canServe ? PALETTE.serveEdge : '#7a8577';
    roundRect(ctx, serve.x, serve.y + serve.h - 8, serve.w, 8, 4);
    ctx.fill();
    text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + 28, 24, '#fff', 800, 'center');
    text(ctx, '(Space)', serve.x + serve.w / 2, serve.y + 50, 13, 'rgba(255,255,255,0.85)', 600, 'center');
    const trash = trashRect();
    ctx.fillStyle = state.plate.length > 0 ? PALETTE.trash : '#b09a8a';
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
    ctx.fill();
    text(ctx, 'TRASH  (T)', trash.x + trash.w / 2, trash.y + 29, 16, '#fff', 800, 'center');
  }

  function drawBins() {
    INGREDIENTS.forEach((ing, idx) => {
      const rect = binRect(idx);
      ctx.fillStyle = '#fffdf5';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.fill();
      ctx.strokeStyle = '#e3d9c2';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIngredient(ctx, ing.id, rect.x + 30, rect.y + 18, rect.w - 60, 52, ing.id === 'bun');
      text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 100, 19, PALETTE.text, 800, 'center');
      ctx.fillStyle = '#8a7a66';
      roundRect(ctx, rect.x + rect.w / 2 - 15, rect.y + 108, 30, 20, 6);
      ctx.fill();
      text(ctx, ing.key, rect.x + rect.w / 2, rect.y + 124, 14, '#fff', 800, 'center');
    });
  }

  function drawBanner(state) {
    if (state.banner <= 0 || !state.bannerText) return;
    const alpha = Math.min(1, state.banner);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = state.bannerGood ? '#2e7d32' : '#c62828';
    // Set the font before measuring, or the pill comes out narrower than the text.
    ctx.font = `700 20px ${FONT}`;
    const w = ctx.measureText(state.bannerText).width + 48;
    roundRect(ctx, FIELD.width / 2 - w / 2, 200, w, 44, 22);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, FIELD.width / 2, 229);
    ctx.globalAlpha = 1;
  }

  function drawField(state) {
    drawWall();
    drawCounter();
    drawBoard(state);
    drawHud(state);
    drawPlate(state);
    drawBins();
    drawBanner(state);
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 290, 150, 700, 420, 20);
    ctx.fill();
    ctx.strokeStyle = '#e3d9c2';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, title, FIELD.width / 2, 230, 52, accent, 900, 'center');
    lines.forEach((line, i) => {
      text(ctx, line.text, FIELD.width / 2, 290 + i * 36, line.size || 20, line.color || PALETTE.text, line.weight || 600, 'center');
    });
  }

  function draw(state, screen, best) {    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      drawOverlay('SIZZLE & SERVE', [
        { text: 'The lunch rush is on. Stack the right ingredients,', size: 21 },
        { text: 'serve before patience runs out, and don\'t let', size: 21 },
        { text: 'three orders walk out the door.', size: 21 },
        { text: 'Click ingredients or press 1–6  •  Space to serve  •  T to trash  •  P to pause', size: 17, color: PALETTE.muted },
        { text: best > 0 ? `Best shift: $${best}` : 'First shift — good luck, chef!', size: 19, color: '#b8860b' },
        { text: 'Click or press Space to start', size: 22, color: '#2e7d32', weight: 800 },
      ], '#c25e1e');
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', [
        { text: 'The kitchen waits. Press P or click to get back to it.', size: 20 },
      ], PALETTE.text);
    } else if (screen === SCREEN_OVER) {
      drawOverlay(state.overReason || 'Shift over!', [
        { text: `You earned $${state.coins}  •  ${state.served} orders served`, size: 24, weight: 800 },
        { text: `Best combo x${state.maxCombo}  •  ${state.failed} walk-outs`, size: 20 },
        { text: best > 0 ? `Best shift: $${best}` : '', size: 19, color: '#b8860b' },
        { text: 'Click or press Space to cook again', size: 22, color: '#2e7d32', weight: 800 },
      ], '#c25e1e');
    }
  }

  /** Convert a client (CSS pixel) pointer position to logical field coordinates. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    const x = (px - offsetX) / scale;
    const y = (py - offsetY) / scale;
    if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) return null;
    return { x, y };
  }

  return { draw, toLogical };
}
