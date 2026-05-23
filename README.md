# Retro Gaming

A collection of retro arcade games built with HTML canvas and vanilla JavaScript, published on GitHub Pages.

**Live site:** [https://mtaylor.github.io/retro-gaming/](https://mtaylor.github.io/retro-gaming/)

## Run locally

ES modules require a static server (opening `index.html` directly from the filesystem will not work).

```bash
# From the repository root
npx --yes serve .
# or
python3 -m http.server 8000
```

Then open [http://localhost:3000](http://localhost:3000) (serve) or [http://localhost:8000](http://localhost:8000) (Python).

## Games

| Game               | Path                           |
|--------------------|--------------------------------|
| Snake              | `games/snake/page.html`        |
| Cambio Office Maze | `games/office-maze/page.html`  |
| Whitley Bay Skatebow | `games/skatebow/page.html`   |
| Who Knocked Over the Plant? | `games/who-knocked-over-the-plant/page.html` |

### Who Knocked Over the Plant?

Family Cluedo with a board — multiplayer via Socket.io. Each player uses their own device; the host creates the game and shares a join code.

**Online (free):** deploy the Node server to [Render](https://render.com) (see `games/who-knocked-over-the-plant/README.md`). Share the Render URL with players, or wire GitHub Pages via `public/js/deploy-config.js`.

**Local / LAN:**

```bash
cd games/who-knocked-over-the-plant
npm install   # first time only
npm start
```

Open http://localhost:3456 on each device (use the network URL from the terminal for phones/tablets on the same Wi‑Fi).

### Cambio Office Maze

A top-down office maze set in Cambio’s Stockholm workspace (Sveavägen 44). Visual style follows Cambio’s bright, modern Scandinavian offices and brand red (`#BA0020`). The official Cambio logo is bundled from [cambio.se](https://www.cambio.se/) theme assets for in-game branding.

Verify the level is solvable:

```bash
node games/office-maze/validate-level.mjs
```

### Whitley Bay Skatebow

SNES-style 3D runner on **Whitley Bay** — fixed pixel **Spanish City** & **St Mary's Lighthouse**. Skate with **A/D**, **throw stones** at circling **seagulls** (they grow as they close in), and guard your **chip packet** from swooping thieves. Requires WebGL and Three.js from CDN.

## Adding a new game

1. Create `games/<name>/page.html` and `games/<name>/game.js`.
2. Import shared helpers from `js/core/` (`Game`, `Input`, `asset`, etc.).
3. Add a card to `index.html` in the game grid with a link to your `page.html`.
4. Use `asset()` from `js/core/config.js` for links and stylesheets so paths work on GitHub Pages.

No workflow changes are needed — push to `main` and the site redeploys.

## Deploy to GitHub Pages

This repo uses [GitHub Actions](.github/workflows/deploy-pages.yml) to deploy static files on every push to `main`.

### One-time setup

1. Push this repository to `github.com/mtaylor/retro-gaming`.
2. Enable Pages for **GitHub Actions** (required once per repo):
   - Open [Settings → Pages](https://github.com/mtaylor/retro-gaming/settings/pages).
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.
   - If you do not see that option, you need **admin** access on the repo (or ask the owner).
3. Push to `main` (or re-run **Deploy GitHub Pages** under **Actions**).

After the workflow succeeds, the site is available at `https://mtaylor.github.io/retro-gaming/`.

### Who Knocked Over the Plant — Pages + Render

1. Deploy the Node server via [Render Blueprint](render.yaml) (see `games/who-knocked-over-the-plant/DEPLOY.md`).
2. Add repository secret **`WKOTP_RENDER_URL`** = your Render service URL (no trailing slash).
3. Re-run **Deploy GitHub Pages** (or push to `main`). The workflow injects that URL into `deploy-config.js` so the hub `page.html` connects over Socket.io.

Until the secret is set, players can use `page.html?server=https://YOUR-APP.onrender.com` or open the Render URL directly.

### Troubleshooting `configure-pages`: Not Found

Pages was already working with the original workflow; this usually means the deploy job was changed (split jobs, API bootstrap, or action major versions). The workflow in this repo is back to the simple **single-job** layout. If it still fails:

1. [Settings → Pages](https://github.com/mtaylor/retro-gaming/settings/pages) → **Source: GitHub Actions**
2. Re-run **Deploy GitHub Pages**

### Push from a fresh clone

```bash
git init
git remote add origin git@github.com:mtaylor/retro-gaming.git
git add .
git commit -m "Scaffold retro gaming site with Snake and GitHub Pages deploy"
git branch -M main
git push -u origin main
```

## Project structure

```
├── index.html              # Game hub
├── css/site.css
├── js/core/                # Shared game loop, input, base path
├── games/<name>/           # One folder per game
└── .github/workflows/      # Pages deployment
```
