# Casino Math and Interaction Audit

Audit scope: source inspection of src/game/config.ts, src/game/casino.ts, src/game/slots.ts, src/lib/game.functions.ts, src/game/casino.test.ts, and casino React screens on the branch.

## Verified architecture

- Casino game actions are resolved in the game domain; the server uses HMAC-SHA256 over `casino:<uid>:<round>` and passes a 128-bit hex seed into the game engine.
- The transaction uses the existing Firestore player state and a version check/idempotency key. Keep this action flow intact during UI work.
- Multi-action Mines/Chicken/Hi-Lo rounds reuse the same `casino.round` until settlement increments the round. The same seed is therefore regenerated for actions within the active round.
- Current lobby has seven originals and six slots. Roulette/Blackjack actions are legacy compatibility and not current lobby routes.

## Math / UX review items

### Plinko
The lobby shows a single 98.5% RTP / 1.5% edge, while config comments and tests describe a range around 98.5–99.0% across nine risk/row tables. The tests only prove expected return is between 98.0% and 99.2%, not that it is the advertised fixed 98.5%. Calculate exact EV for every table and expose either a per-selection value or a single rigorously calibrated figure.

### Keno
The lobby shows 97.0% RTP for every risk mode, while the test bounds each paytable between 96.5% and 97.6%. That tolerance may be fine but it is not an exact proof of 97.0%. Compute exact hypergeometric EV for all 30 combinations (3 risk profiles × 1–10 spots) and use the actual configured payout expectation in UI copy.

### Dice
Roll is discrete hundredths (10,000 outcomes) from 0.00 to 99.99. `diceWinChance` is computed from target percentage and uses strict/closed interval comparisons (`roll < target` for under, `roll >= target` for over). For targets constrained to integer percentage steps in UI, this matches 100x target outcome counts. If decimal target input is later enabled, win probability needs exact discrete count, not merely continuous target percent.

### Hi-Lo
The deck is shuffled once per active round, then cards are consumed without replacement. `hiloOdds(rank)` returns idealized rank counts for a fresh uniformly distributed rank set (12/13 etc.) and does not inspect the remaining deck composition. After each draw/skip the next-card probability conditional on the already revealed cards can differ. Since the multiplier uses these probabilities, this needs a formal decision: either compute conditional remaining-deck odds server-side and display them, or explicitly adopt a with-replacement model. Do not merely relabel the interface while leaving probability math inconsistent.

### Mines
Server seed is stable for the same player/round; mine positions are regenerated from the same deterministic RNG stream on each action until settlement. The visual should show only selected safe tiles during the active round and expose full mine layout only on a terminal loss/result. Ensure the same server round remains locked and no UI state resets across route changes.

### Chicken
One lane outcome is derived for every confirmed step. Motion must advance only when the server action confirms the step; ambient cars are decorative and must not telegraph a hazard.

### Crash
Current command resolves crash point and target result immediately on server, then the browser animates a replay of the final result. UI copy should say 'Round replay' or equivalent; it must not imply a real-time cash-out window while a server round is already settled.

### Slots
Six machines share the reel component and deterministic slot engine. The client currently uses random transient symbols while reels are spinning but snaps to the exact server-returned grid and returned winLines. Preserve this result binding. Slot comments target roughly 96.2–96.7% RTP / 3.3–3.8% edge, but Monte Carlo tests only apply broad 92–100% bounds; verify each machine's true expected return with tighter statistical tests or a tractable exact calculation.

## Changes deliberately not made

- No payout formula, HMAC seed, active-round model, wallet, action, or settlement code was changed.
- No RTP/house-edge labels were changed because this audit identified values requiring calculation rather than safe copy edits.
- The design brief separates animations from outcome authority. The browser should present state, never create outcomes.

## Next verification work

1. Calculate exact Plinko expected return for every configured table from binomial path probabilities.
2. Calculate exact Keno expected return for every risk/spot paytable from hypergeometric probabilities.
3. Derive conditional Hi-Lo rank odds from remaining cards; test edge cases, skips, Ace/King boundaries and multiplier expectation.
4. Add golden-state tests for Mines multi-step field stability and client disclosure timing.
5. Run Bun test, lint and build in a clean checkout before merging the feature branch.