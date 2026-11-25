// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_FAIL, EVENT_OVER, EVENT_SPAWN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toLogical);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve orders before their patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. You earned $${world.state.coins}. Best $${best}.`);
  }

  function handleInput() {
    const { actions, flags } = input.take();
    if (flags & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (flags & ACTION_CONFIRM) {
      sound.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_PLAY) {
        // Space / Enter / click serves the plate while playing.
        const earned = world.serve();
        if (earned > 0) sound.serve();
        else sound.bad();
      }
      return;
    }
    if (screen !== SCREEN_PLAY) {
      for (const action of actions) {
        if (action.type === 'confirm') {
          sound.unlock();
          if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
          else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
        }
      }
      return;
    }
    for (const action of actions) {
      if (action.type === 'ingredient') {
        sound.unlock();
        if (world.addIngredient(action.id)) sound.add();
      } else if (action.type === 'serve') {
        sound.unlock();
        const earned = world.serve();
        if (earned > 0) sound.serve();
        else sound.bad();
      } else if (action.type === 'trash') {
        sound.unlock();
        if (world.trash()) sound.bad();
      }
      // A pointer 'confirm' on empty counter is ignored while playing.
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.stepBackdrop(STEP);
      return;
    }
    const events = world.step(STEP);
    if (events & EVENT_SPAWN) sound.spawn();
    if (events & EVENT_FAIL) sound.fail();
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleInput();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders fail unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
