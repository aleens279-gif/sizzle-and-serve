# Sizzle & Serve — Best Cooking Game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/aleens279-gif/sizzle-and-serve/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/aleens279-gif/sizzle-and-serve/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Entry for make.fun's "Best Cooking Game" bounty: a complete, original burger-rush
cooking game that plays offline in a desktop browser from static files.

## The game

The lunch rush is on. Orders arrive on the board with a patience timer; stack the
right ingredients on the plate and serve before the customer walks out.

- **Orders**: up to 3 tickets on the board, each a recipe (Classic Burger, Cheese
  Burger, Double Stack, Garden Veggie, Onion Melt) with a patience bar and a coin value.
- **Cooking**: click the ingredient bins (or press 1–6) to stack Bun, Patty, Cheese,
  Lettuce, Tomato and Onion on the plate. Space serves the dish that matches an order;
  T trashes a wrong stack.
- **Scoring**: coins for every served dish, a patience tip for serving fast, and a
  combo multiplier for serving several in a row. Three walk-outs or an empty shift
  clock (2 minutes) ends the shift; the best shift is kept in the browser.
- **Controls**: mouse and keyboard. P pauses; Space serves; click anywhere to start.

## Running it

Serve `game/` with any static server (a `serve.ts` is included: `node serve.ts`,
then open http://localhost:8080). No build step, no network request, no library —
just `game/index.html` and its ES modules, all drawn on canvas with synthesized
WebAudio blips.

`main.ts` hands the game in: it copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the kit's `vendor/makefun-game.ts`.

Entered on [make.fun](https://make.fun/?ref=14mdadnq).
