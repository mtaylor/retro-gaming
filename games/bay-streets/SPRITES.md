# Bay Streets — sprite requirements

Streets of Rage–style **side-view** beat ’em up. Characters face **right** in source art; the game mirrors sprites for left.

## Format (all assets)

| Rule | Detail |
|------|--------|
| Format | PNG, transparent background |
| Key colour | Pure black `#000000` (we strip it) |
| Style | 16-bit / SNES pixel art, consistent scale |
| View | **Side profile** (not top-down) |
| Facing | Draw facing **right** only |
| Canvas | ~64×64 px per frame (characters); enemies can be ~56×56 |
| Naming | `henry/walk-01.png` or sheet `henry-walk.png` (we can slice) |

---

## Character 1 — Henry (folder: `assets/henry/`)

| Animation | Frames | Notes |
|-----------|--------|--------|
| `idle` | 2–4 | Subtle bounce / breathing |
| `walk` | 6–8 | Full stride cycle, feet on ground |
| `punch` | 3–4 | Quick jab or hook, arm extended by last frame |
| `kick` | 3–4 | Front kick or roundhouse |
| `hurt` | 1–2 | Flinch, still on feet |
| `knockdown` | 2–3 | Fall optional for v2 |
| `getup` | 1–2 | Optional, pairs with knockdown |

**Total (minimum playable):** ~18–24 frames.

---

## Character 2 — Eleanor (folder: `assets/eleanor/`)

Same list and frame counts as Henry, matching height and pivot (feet on same baseline).

---

## Enemies (folder: `assets/enemies/`)

At least one grunt type to start (e.g. `thug/`):

| Animation | Frames |
|-----------|--------|
| `idle` | 2 |
| `walk` | 4–6 |
| `punch` | 2–3 |
| `hurt` | 1 |
| `knockdown` | 2 |

Optional later: `seagull-thug` (minion), `boss` (large, 80×80 px).

---

## Background (folder: `assets/stage/`)

Whitley Bay promenade / Spanish City vibe:

| Asset | Size (approx) | Notes |
|-------|----------------|--------|
| `sky.png` | 960×200 | Pixel sky, repeatable or wide |
| `buildings.png` | 1200×280 | Parallax layer — dome, fronts |
| `ground.png` | 960×120 | Promenade / pavement (seamless tile OK) |
| `foreground.png` | optional | Rails, bollards for depth |

**Minimum for v1:** one wide `backdrop.png` (~1200×360) we can scroll, or sky + ground + buildings as separate layers.

---

## UI (optional)

- `logo.png` — “Bay Streets” title
- Heart / life icon 16×16

---

## Current placeholders

Until side-view sheets exist, the game uses your existing **8-direction rotation** packs (`henry.zip`, `eleanor.zip`) — `east` / `west` for facing, other directions as stand-ins for attacks. Replace files in `assets/henry/` and `assets/eleanor/` using the names above when ready.

Zip batches per character (e.g. `henry-sprites.zip` with folders inside) are fine.
