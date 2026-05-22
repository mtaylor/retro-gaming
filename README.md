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

| Game  | Path                    |
|-------|-------------------------|
| Snake | `games/snake/page.html` |

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
2. In the repo on GitHub: **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually under **Actions**).

After the workflow succeeds, the site is available at `https://mtaylor.github.io/retro-gaming/`.

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
