# Capital Fortune — Unique Live Casino Interfaces

Status: implementation specification grounded in the current repository source.
Target branch: feat/unique-casino-live-interfaces

## Product requirement

Every playable casino category must have its own live graphical experience. Do not ship a single generic play screen recolored for different games. Share wallet, bet-entry primitives, typography, accessibility helpers, and outcome banner where suitable, but preserve each game's own stage, control grammar, visual metaphor, animation choreography, and result treatment.

All visuals must be driven by actual game state and server-returned result details. The client may animate the presentation of a result already resolved by the game action path; it must never decide, alter, predict, or fabricate an outcome. Keep payout calculation and settlement in src/game/casino.ts and slot rules in src/game/slots.ts. Keep Firebase/Firestore action handling and auth unchanged unless separately designed and tested.

## Actual game catalogue

Current source audit found seven original games and six slot machines. Current lobby lists Dice, Plinko, Keno, Crash, Mines, Chicken, Hi-Lo and:
- Diamond 777 Classic
- Olympus Thunder
- Pharaoh's Vault
- Neon CyberSpin
- Emerald Fortune
- Sugar Bonanza

Legacy Roulette/Blackjack action types exist in the domain model/tests but do not appear as playable choices in the current CasinoLobby. Do not silently treat legacy action support as proof they are currently navigable UI categories. Their product status should be decided separately.

## Shared shell (only shared layer)

- Responsive wallet header with chip balance, denomination breakdown, wallet action, audio toggle.
- Common bet amount input, validation, disabled/pending states, and game-result banner.
- A game-specific stage occupying visual priority; control dock adapts to each game's action model.
- Keep stake validation, action dispatch, pending state, and persisted result binding in existing action flow.
- Consistent tokens: midnight blue (#071018/#0f212e), slate panels (#1a2c38), emerald action/success, gold premium accent, rose loss/hazard, plus distinctive per-game accents.
- Mobile: portrait-first stack; stage first, compact sticky/docked controls below; touch targets >=44px; never put the sole critical action off-screen.
- Desktop: controls may sit beside stage but stage remains primary.

## Per-game interface identities

### Dice — precision instrument
Stage: luminous 0–100 number runway with target divider, live roll marker, oversized numeric result and recent-roll chips.
Controls: over/under toggle, precision target slider/input, bet amount, displayed win chance and multiplier.
Motion: on server result, animate marker from previous roll to exact returned roll; transition target zone and readout to win/loss. Do not sample a new result in the browser.
Assets: vector number ticks, glowing rail, marker capsule, subtle glass panel. Reduced motion: instant marker placement and static target zone.

### Plinko — kinetic probability board
Stage: responsive peg pyramid canvas/SVG, ball, collision glows, bottom multiplier buckets, previous landing strip.
Controls: 8/12/16 rows, low/medium/high risk, bet amount, drop action.
Motion: use exact returned path array to traverse pegs and returned bucket/multiplier to highlight destination. Collision sounds are tied to visual peg contacts. Do not generate a second client-side path.
Assets: peg/ball vector shapes, bucket gradient atlas, board background texture, optional metallic frame. Reduced motion: short path interpolation or immediate path trace; preserve final bucket highlight.

### Keno — illuminated number terminal
Stage: 40-number grid with selected, drawn, hit, and miss states; sequential draw rail with ten numbered orbs; hit counter and final payout.
Controls: select 1–10 numbers, quick pick, clear, low/classic/high risk, bet amount, draw.
Motion: reveal only the ten values in the server-returned draw array in order; each orb lands in the corresponding grid cell and hit/miss state is derived from returned picks/draw. Do not randomize visual draws.
Assets: number tiles, draw orb sprites/vector, scanner line, result glow. Reduced motion: reveal all ten values together with a clear final-state summary.

### Crash — launch telemetry console
Stage: graph viewport, ascending rocket, multiplier display, faint grid, event rail/history.
Controls: bet, target auto-cashout, presets and turbo presentation speed.
Motion: after the action returns, stage a replay from 1.00x to the actual returned crashPoint or targetMult (depending on won). Clearly label this as round replay, not a live server race; current server action resolves the target before visual playback. Rocket explosion and end state must use the result payload. Never show a pre-result rising multiplier as if the player can still cash out.
Assets: vector rocket, exhaust particles, graph grid, crash burst, telemetry ticks. Reduced motion: direct result state with short fade.

### Mines — jeweled vault grid
Stage: tactile 5x5 vault tile board, sealed tiles, safe gem reveals, mine reveal on loss, cumulative safe-count and multiplier.
Controls: mine count selector before start; start round; reveal tiles; cash-out button while active.
Motion: tile depress, reveal shutter, gem emergence or mine burst, payout multiplier update. Final mine positions are only exposed from returned result after the round resolves.
Assets: tile bevel texture, gem sprites, mine emblem, vault frame, low-cost reveal particle. Reduced motion: instant tile face swap and color/state icon.

### Chicken — animated crossing lane
Stage: 15-lane road crossing, character marker, lane dividers, animated traffic hazards, progress track.
Controls: difficulty selector before start, bet, hop-next-lane, cash out after a safe step.
Motion: hop animation advances only after server action confirms survival; on a hit, show returned hitLane and loss state; do not animate a successful lane before response. Background traffic may loop decoratively but cannot signal outcome.
Assets: chicken character sprite, 4–6 vehicle silhouettes, asphalt markings, roadside props, lane-success decals. Reduced motion: translate marker directly to confirmed lane with reduced motion; static traffic.

### Hi-Lo — card-table prediction
Stage: oversized playing card with flip, previous-card trail, probability meter, streak/multiplier readout.
Controls: higher/lower, skip count, cash out, bet/start.
Motion: card reveal is a state transition driven by returned active card/history; correct/incorrect outcome uses new card and game state. Show odds and step multiplier corresponding to current rank.
Assets: card face atlas (or reusable suit/rank atlas), card back, suit glyphs, felt texture, gold edge, flip shadow. Reduced motion: crossfade card face without 3D flip.

## Six slot identities

All slots can share the same deterministic reel/grid rendering framework and result parsing. They must not become identical cabinets with a different background gradient. The reel result must be the exact server-returned grid. Staggered reel stops can be retained, but final symbols and winning paylines are never replaced by random client output once result arrives.

1. Diamond 777 Classic — ruby/red velvet and gold cabinet; 3x3 mechanical reel window; bell/7/diamond/cherry icon family; crisp mechanical stop motion.
2. Olympus Thunder — storm-temple cabinet, cyan lightning channels and marble/bronze details; 5x3 reels, lightning scatter emphasis; electric reveal accents on actual scatter symbols.
3. Pharaoh's Vault — sandstone/obsidian and lapis/gold trim; scarab wild emphasis; tomb-door reel frame and dust motes.
4. Neon CyberSpin — synthwave/cyan-magenta holographic casing; quantum core, plasma blade, visor, battery and 2x wild chip; scanline and hologram shimmer.
5. Emerald Fortune — emerald casino/luck visual, clover/horseshoe/harp motifs and gold-pot scatter; green glass reels and coin glints.
6. Sugar Bonanza — bright candy-pink/purple confectionery machine; 5x4 cascade/cluster stage; jelly-like symbol pop and cluster clear/fall motion. Cluster highlights use returned winLines.

Slot states: idle symbols, spinning, staggered reel lock, winning-cell highlight, non-winning final grid, bonus/scatter treatment, disabled/pending, result. Volatility and max-win are descriptive metadata, not guarantees.

## Animation system and state integrity

- Use a clear state machine per game: idle → submitting → presenting_result / active_round → cashout or terminal_result.
- Keep server action pending as the source of disabled controls.
- Animation may begin when the server result arrives. It must be replay/presentation, not a second simulated game.
- Cleanup requestAnimationFrame, timers, intervals and canvas contexts on unmount or a new result; guard stale async state updates.
- No unbounded particles or DOM node creation per frame. Prefer CSS transforms/opacity for UI motion; Canvas for dense peg/graph/traffic effects; SVG for crisp boards and controls.
- Audio/haptics trigger on confirmed transitions, with mute and reduced-motion settings honored.
- Respect prefers-reduced-motion; never encode win/loss only by color; label outcome with text/icon.
- Avoid rapid flashes, excessive screen shake, or visual-only urgency mechanics.
- Preserve wallet, stake, action, and settlement flow.

## Asset and texture-generation ingredients

Use one common UI token sheet and separate category atlases:
- casino-ui-core: panel grain, brushed metal, gold edge, felt, glass blur, neutral button states, disabled states, win/loss state glyphs.
- dice-atlas: rail/marker/ticks and readout glyphs.
- plinko-atlas: peg, ball, bucket face variants, board frame.
- keno-atlas: 40 number tile states, orb, draw rail, hit/miss effect.
- crash-atlas: rocket, exhaust, graph grid, crash burst and telemetry icon.
- mines-atlas: 25 tile-face states, gem, mine, vault frame.
- chicken-atlas: chicken sprite, 4–6 vehicle silhouettes, lane markings, safe/hit marker.
- hilo-atlas: card faces (or one reusable suit/rank atlas), card back, felt and flip sheen.
- slots: per-theme cabinet frame, symbol atlas, reel backing, special-symbol frames, theme-specific ambient elements and win highlights.

Recommended deliverables: SVG for interface icons and board glyphs; PNG/WebP with alpha for illustrated symbols; KTX2/Basis only if render pipeline supports it; small seamless WebP/PNG texture tiles for surface grain. Do not ship uncompressed 4K image backgrounds for small UI cards.

Suggested budgets:
- UI atlas: 2048x2048 maximum, with 2x export for high-density displays.
- Individual symbols: 128–256 px source; 512 px only for hero symbols.
- Background/environment: 1440x2560 portrait master plus cropped responsive variants; prefer CSS gradients and tiled textures for most screen backgrounds.
- Tiny effects: CSS/SVG over video. Use video only for hero ambience or short non-interactive transition accents, muted and looped, with static poster fallback.
- Target per-game first-load art under ~1.5 MB compressed; shared common atlas loaded once; lazy-load theme atlases on entry.
- Prefer WebP/AVIF for raster stills; SVG for simple vector art; short WebM/MP4 only for non-interactive atmospheric loops. Avoid GIF.
- Target 30–60 fps on capable devices, scale canvas by devicePixelRatio with a sensible cap (e.g. 2), and pause loops offscreen/backgrounded.

## Implementation map

Current components: CasinoLobby.tsx; DiceGame.tsx; PlinkoGame.tsx; KenoGame.tsx; CrashGame.tsx; MinesGame.tsx; ChickenGame.tsx; HiloGame.tsx; SlotsGame.tsx; casinoTextures.tsx; src/game/casino.ts; src/game/slots.ts.

Keep math changes in src/game/ and separate from this visual feature. The UI may expose in-code RTP/edge but must not label those figures independently certified or operator-verified.

## Known audit flags to investigate before production rollout

1. Lobby Plinko label says 98.5% RTP / 1.5% edge. Configuration has plinkoHouseEdge 0.015 while table/test comments describe approximately 98.5–99.0% RTP per risk/row. Verify exact expected return for all nine table combinations and expose correct per-configuration RTP or define one consistent target.
2. Dice roll is discrete at 0.01 increments (0.00–99.99), while displayed win chance uses a continuous-style formula and boundary uses strict/closed intervals. Verify discrete outcome count for every target so advertised chance and multiplier are mathematically consistent.
3. Hi-Lo odds and comparison rules need close inspection. UI suggests Higher/Same and Lower/Same except Aces/Kings, but deck draw is without replacement while hiloOdds calculates simple rank counts as if 13 ranks are equally available. Verify conditional probability with remaining rank composition and whether skip consumes a card as designed.
4. Chicken lane action advances random draws in a loop based on nextStep; verify intended one-hazard-per-step model and deterministic path. Visual transitions must only use confirmed state.
5. Crash animation is a replay after the server has already resolved target/cashout. Make this clear and avoid suggesting in-flight cashout where no such server round exists.
6. Keno reveal uses Math.random only for Auto Pick and is not part of draw; draw animation should display actual returned draw.
7. Mines client must only show hidden mine positions after terminal resolution; verify server state derives the same seeded field deterministically.
8. Legacy Roulette and Blackjack actions exist but are absent from current lobby; decide whether they are hidden compatibility or future categories, rather than adding screens without product approval.

## Acceptance checklist

- Each of seven original game interfaces is visually and interaction-distinct.
- Each of six slot themes has its own cabinet/theme and symbol family while using common reel mechanics.
- All result animations terminate on exact server payload; no client RNG creates the outcome.
- State changes do not break wallet or active-round lock.
- Tests cover game outcome math independently from presentation.
- Mobile touch targets and layouts are validated; reduced motion and mute are respected.
- Canvas/RAF/interval resources are cleaned up.
- Run test, lint and build through Bun scripts; report actual commands/results only.