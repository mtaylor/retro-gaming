# Whitley Bay Skatebow

SNES-inspired 3D endless runner on the **Whitley Bay** promenade.

## Setting

- **Full-screen photo backdrop** — real Spanish City, Whitley Bay (`assets/spanish-city.jpg`, CC BY-SA Geoff Holland / Geograph)
- Scrolling checkerboard promenade, beach huts, semi-transparent sea in the foreground

## You

- Skater with a **red chip packet** (fish & chips)
- **Click** to **throw stones** at seagulls

## Seagulls

- Fly in **curved paths** (not straight lines)
- **Grow larger** as they approach (perspective)
- Wing-flap animation
- **Swoopers** dive in loops and **steal chips** from your packet

## Obstacles (dodge)

Cars, vans, children, dog poo, ice cream carts, cyclists, beach balls, puddles.

## Run locally

Serve the **repo root** (`retro-gaming/`), not only this folder:

```bash
cd /path/to/retro-gaming
python3 -m http.server 8080
```

Open [http://localhost:8080/games/skatebow/page.html](http://localhost:8080/games/skatebow/page.html)

You can also serve `games/skatebow/` directly; the game no longer depends on `../../js/core/config.js`.

## Tech

Three.js, nearest-neighbour pixel textures at 3× art resolution, retina-aware canvas (`devicePixelRatio` capped at 2), light scanline overlay.

## Deploy

Ensure `games/skatebow/` (including `assets/`) is committed and pushed — untracked files are not published to GitHub Pages.
