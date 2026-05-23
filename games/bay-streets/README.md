# Bay Streets

Streets of Rage–style side-scrolling beat ’em up set on the Whitley Bay prom.

## Play

```bash
cd retro-gaming && python3 -m http.server 8080
```

http://localhost:8080/games/bay-streets/page.html

## Controls

| Key | Action |
|-----|--------|
| WASD / arrows | Move (including up/down on the lane) |
| Z / J | Punch |
| X / K | Kick |
| Space | Restart after game over |

## Fighters

- **Henry** — character 1  
- **Eleanor** — character 2  

## Sprites you need

Full spec: **[SPRITES.md](./SPRITES.md)**

Minimum per character (~20 frames, **side view**, facing right):

- `idle`, `walk`, `punch`, `kick`, `hurt` (+ optional `knockdown` / `getup`)

Plus enemies (`assets/enemies/thug/…`) and stage layers (`assets/stage/`).

Current build uses placeholder rotations from `sprites/henry.zip` and `eleanor.zip`.
