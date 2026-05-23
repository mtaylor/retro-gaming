# Deploy Who Knocked Over the Plant (free multiplayer)

## Option A — Render (recommended)

1. Push this repo to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect **retro-gaming** → Render reads `/render.yaml` at repo root.
4. Approve the **who-knocked-over-the-plant** service (free plan).
5. When live, copy the URL (e.g. `https://who-knocked-over-the-plant-xxxx.onrender.com`).

### Wire GitHub Pages (optional)

1. Repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Name: `WKOTP_RENDER_URL`  
   Value: your Render URL (no trailing slash)
3. Push to `main` — the Pages workflow injects it into `deploy-config.js` automatically.

Players can also open the **Render URL directly** (simplest — no secret needed).

---

## Option B — Fly.io

```bash
cd games/who-knocked-over-the-plant
fly launch    # follow prompts, use existing fly.toml
fly deploy
fly certs add   # optional custom domain
```

Set `ALLOWED_ORIGINS` in `fly.toml` or `fly secrets set ALLOWED_ORIGINS=https://mtaylor.github.io`

---

## Option C — Local / LAN only

```bash
npm install
npm start
```

Share `http://<your-lan-ip>:3456` with each device.

---

## After deploy checklist

- [ ] Open `https://YOUR-SERVICE/health` → `{"ok":true,...}`
- [ ] Open `https://YOUR-SERVICE/` → create game on phone + laptop
- [ ] (Optional) Add `WKOTP_RENDER_URL` secret and test hub link on GitHub Pages
