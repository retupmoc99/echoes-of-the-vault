# Echoes of the Vault

A dark science-fantasy roguelite deckbuilder with an idle layer. Phone-first, installable, plays offline.

## Commands
```bash
npm install         # once
npm run dev         # play on this PC at http://localhost:5173
npm run dev:phone   # also serve it to your phone over Wi-Fi
npm test            # engine tests
npm run build       # production build into dist/
npm run preview     # serve the production build (installable, offline-capable)
npm run art         # convert images in art-raw/ (see ART_GUIDE.md)
npm run icons       # re-render the app icons from public/icons/icon.svg
```

## Play on your phone (same Wi-Fi)
1. Run `npm run dev:phone`. Vite prints a **Network** address, for example `http://192.168.1.23:5173/`.
2. Open that address in your phone's browser.
3. If it doesn't load, Windows Firewall is probably blocking Node. Allow *Node.js* on **Private** networks when Windows asks, or add an inbound rule for TCP port 5173.

> **Installing and offline play need HTTPS.** Phones only allow service workers over HTTPS (or on `localhost`), so the Wi-Fi address above runs the game but can't install it or play it offline. To get the real app on your home screen, deploy it (free, below) and open the HTTPS link.

## Deploy for free
Either option gives you an HTTPS link you can add to your home screen. After that, the game opens offline. When you publish a new version, the game shows "A new version is ready" and you tap **Update** whenever you like (your save is untouched).

### Option A: Netlify Drop (no account setup, about 2 minutes)
1. Run `npm run build`.
2. Go to <https://app.netlify.com/drop> and drag the `dist` folder onto the page.
3. Open the link it gives you on your phone.

For automatic deploys later, connect the GitHub repo in Netlify; `netlify.toml` already has the settings.

### Option B: GitHub Pages (deploys on every push)
1. Create an empty GitHub repository and push this project to its `main` branch.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`: it installs, runs the tests, builds, and publishes. Your game will be at `https://<user>.github.io/<repo>/`.

The build uses relative paths, so it works both at a domain root (Netlify) and in a sub-folder (GitHub Pages).

### Add it to your home screen
- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* (or *Add to Home screen*).

## Where things live
- `src/engine/`: game rules (pure TypeScript, tested)
- `src/data/`: cards, relics, enemies, events, Shifts, idle content, balance numbers
- `src/ui/`: React screens, code-drawn visuals, effects
- `src/store/`: connects the engine to React; saves after every action
- `public/assets/`: optional art (see `ART_GUIDE.md`)
- `DESIGN.md`: current design and balance decisions
- `CHANGELOG.md`: what changed in each milestone
