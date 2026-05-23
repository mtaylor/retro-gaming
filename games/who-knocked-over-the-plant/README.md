# Who Knocked Over the Plant?

Family Cluedo — each player on their own phone or tablet. One host creates a game; everyone else joins with the 4-letter code.

## Why not GitHub Pages alone?

GitHub Pages only serves **static files**. Real-time multiplayer needs a **WebSocket server** (this project uses Node + Socket.io). The UI can live on Pages; the game server must run elsewhere (free options below).

---

## Free hosting (multiplayer on separate devices)

Step-by-step: **[DEPLOY.md](./DEPLOY.md)**

### Render (recommended)

Repo includes **`/render.yaml`** at the project root.

1. Push to GitHub.
2. [Render](https://render.com) → **New +** → **Blueprint** → connect repo.
3. Deploy **who-knocked-over-the-plant** (free plan).
4. Share the `.onrender.com` URL with every player (simplest).

**GitHub Pages + Render:** after deploy, add repo secret `WKOTP_RENDER_URL` = your Render URL. The Pages workflow injects it automatically; hub link at `page.html` then works.

**Quick test without secret:**  
`page.html?server=https://YOUR-APP.onrender.com`

### Fly.io

`fly.toml` included — from this folder: `fly launch` → `fly deploy`.

---

Free tiers may **sleep when idle** (~30s wake on first visit).

---

## Local / LAN play

```bash
cd games/who-knocked-over-the-plant
npm install
npm start
```

- **Host computer:** http://localhost:3456  
- **Other devices (same Wi‑Fi):** use the **Network** URL printed in the terminal  

Each player opens that URL on their own device.

---

## How to play

1. **Host** — name → **Create Game** → share code  
2. **Others** — name + code → **Join Game**  
3. **Host** → **Start Game** (2–6 players)  
4. Roll, move, suggest in rooms, accuse when sure  
5. **Host** → **End Game** when finished  

## Cast & cards

Dad, Mam, Eleanor, Henry, Buttons, Joanna — tennis ball, duster, football, frying pan, chair, toilet plunger — kitchen, living room, bedrooms, office, utility room.
