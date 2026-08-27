# 🚀 3D Space Shooter

A roguelite 3D space shooter built with React Three Fiber, Vite, and Zustand.

## ✨ Features

- **5 enemy types** with unique AI: Drone, Kamikaze, Sniper, Tank, Swarmer
- **Boss fights** every 5 waves with 3 attack phases
- **Roguelite upgrades** between waves (8 unlockable perks)
- **Auto-fire + charge shot** combat (tap SPACE for aimed shot, hold for 5-way spread)
- **Heat system** that forces weapon cooldown when overheated
- **4 distinct biomes** (Asteroid Field → Nebula → Enemy Fleet → Planet Orbit)
- **Bloom + Vignette + Chromatic Aberration** post-processing
- **Procedural audio** via Web Audio API
- **Player trail, bullet trails, damage numbers, particle explosions**
- **Achievements, high scores, settings** — all saved to localStorage
- **Auto-pause** when tab is hidden

## 🎮 Controls

| Action | Key |
|---|---|
| Move | WASD or Arrow Keys |
| Shoot (auto) | Continuous |
| Charge Spread | Hold SPACE |
| Quick Shot | Tap SPACE |
| Pause | ESC or 🔊 button |

## 🛠️ Development

```bash
npm install     # Install dependencies
npm run dev     # Start dev server (Vite)
npm run build   # Production build
npm run preview # Preview production build
```

## 📦 Tech Stack

- **React 18** + **Vite** for fast dev / build
- **@react-three/fiber** + **@react-three/drei** for 3D rendering
- **@react-three/postprocessing** for Bloom / Vignette
- **Three.js 0.160** for low-level 3D
- **Zustand** for state management

## 🏗️ Architecture

```
src/
├── App.jsx                    # Main app + Scene composition
├── main.jsx                   # React entry point
├── store.js                   # Zustand game state
├── index.html
├── components/
│   ├── PlayerShip.jsx         # Player model + movement + charge shot
│   ├── ChargedShot.jsx        # Visual charge meter around player
│   ├── GameEntities.jsx       # Enemies, asteroids, bullets (orchestrator)
│   ├── EnemyTypes.js          # Enemy type catalog (5 types)
│   ├── EnemyProjectiles.jsx   # Enemy-fired bullets (sniper, boss)
│   ├── Boss.jsx               # Multi-phase boss entity
│   ├── PowerUps.jsx           # Health/speed/multishot/slow-mo/blackhole
│   ├── SpaceEnvironment.jsx   # 4 biome environments
│   ├── ParticleSystem.jsx     # Explosion particles
│   ├── PlayerTrail.jsx        # Engine particle trail
│   ├── DamageNumbers.jsx      # 3D-billboarded damage text
│   ├── NearMissDetector.jsx   # "DODGE!" bonus detection
│   ├── PostFX.jsx             # Bloom + Vignette
│   ├── GameUI.jsx             # HUD, menus, upgrade screen
│   ├── PauseMenu.jsx          # Pause / settings modal
│   ├── UpgradeScreen.jsx      # Roguelite upgrade picker
│   ├── IntroScreen.jsx        # "WAVE 3 — ASTEROID FIELD" card
│   └── SoundSystem.jsx        # Web Audio API SFX + music
├── hooks/
│   ├── useKeyboard.js         # Keyboard state hook
│   └── useVisibility.js       # Tab visibility hook
└── utils/
    └── pool.js                # Object pool
```

## 🚀 Deployment

Configured for Vercel via `vercel.json` (SPA routing). Just `vercel --prod`.

## 📜 License

MIT
