# Art Guide — Echoes of the Vault

The game never waits on art. Every card, enemy, relic, node type and background is drawn in code, and real images replace those drawings only when they exist. Make art in any order and drop it in whenever you like.

## The pipeline in 3 steps
1. Export your image into `art-raw/<folder>/`, **named after the content ID**: `art-raw/cards/shatter-lens.png`. Spaces, capitals and underscores are fine ("Shatter Lens.png" works too).
2. Run:
   ```bash
   npm run art
   ```
   This resizes each image to spec, converts it to WebP, squeezes it under its file-size budget, writes it to `public/assets/<folder>/<id>.webp`, and refreshes `src/data/assets.generated.ts`, the list of art that exists.
3. Restart `npm run dev`. The image now replaces the drawn version. Delete the `.webp` (and run `npm run art` again) to go back.

`art-raw/` is git-ignored. Keep your masters there (or anywhere) at full size.
You can also point a content entry at a specific file with its `image` field (path relative to `public/assets/`), e.g. `image: 'cards/shatter-lens-alt.webp'`.

## Specs
| Folder | Used for | Output size | Ratio | Transparency | Budget | Notes |
|---|---|---|---|---|---|---|
| `cards/` | Art window at the top of a card | 512 × 384 | 4:3 | No | 40 KB | Cropped to fill (cover). Keep the subject in the centre 70%: the bottom fades into the card. |
| `enemies/` | Replaces the enemy sigil | 768 × 768 | 1:1 | **Yes** | 90 KB | Fitted (contain). Subject fills ~85% of the frame, centred, facing the viewer. |
| `relics/` | Relic orb in the HUD, Cache and reward screens | 256 × 256 | 1:1 | **Yes** | 25 KB | Shown inside a 44px circle in the HUD, so keep a bold, readable silhouette. |
| `backgrounds/` | Screen backgrounds | 1080 × 1920 | 9:16 | No | 250 KB | Cropped to fill. The game darkens them, so paint mid-tones and keep the centre calm. |
| `ui/` | Map node icons (`node-fight`, `node-elite`, `node-event`, `node-cache`, `node-shrine`, `node-boss`) | 192 × 192 | 1:1 | **Yes** | 15 KB | Must read at 48px. A glyph, not a scene. |

**Source size:** make masters at least the output size; 2× is ideal (cards 1024×768, enemies 1536×1536). The script handles downscaling.

**Total budget:** a full set (30 cards, 11 enemies, 11 relics, 8 backgrounds, 6 node icons) comes to about **4.5 MB**. Art is *not* bundled into the offline install. Each image is cached the first time it's seen, so the game still opens instantly on a phone.

**Background keys:**
- `outpost`: the Outpost screen
- `vault`: the map and chamber screens
- `combat`: fights
- `shift-<vault-shift-id>` (e.g. `shift-drowned-halls`): optional. Replaces `vault` and `combat` during loops with that Shift.

## The look
Near-black space. Ancient, impossibly advanced technology that behaves like magic. Light comes **only** from the subject itself: runes, cracks, cores, eyes. Geometry over anatomy, ruin over polish, cold over warm (except where something burns).

**Colours:**
- Cards follow their type: Strike = ember orange, Ward = cold cyan, Overload = violet, Rite = tarnished gold, Curse = sick green.
- Enemies follow their sigil's hue (listed below).

## ComfyUI
### Shared style prompt (prepend to every prompt)
```
dark science-fantasy relic art, ancient alien technology that looks like sorcery, near-black background, single subject lit only by its own glowing runes and sigils, bioluminescent cracks, volumetric haze, sacred geometry, weathered obsidian and tarnished metal, minimal composition, high contrast, rim light, cinematic, grim and solemn, painterly digital art, sharp focus
```

### Shared negative prompt
```
text, letters, watermark, signature, logo, frame, border, ui, cartoon, anime, chibi, cute, bright background, daylight, sky, colorful, rainbow, pastel, lens flare overload, busy background, multiple subjects, cropped subject, blurry, lowres, jpeg artifacts, deformed, extra limbs, photo, modern objects, guns, sci-fi spaceship
```

### Workflow settings
- **Model:** an SDXL-class model with a painterly bent, for example a good SDXL base or fine-tune. Keep **one checkpoint for the whole set**; switching checkpoints breaks consistency faster than anything else.
- **Resolution** (generate at native SDXL buckets, then let the script resize):
  - cards 1152×864 (4:3)
  - enemies and relics 1024×1024
  - backgrounds 768×1344 (9:16), upscaled ×1.5 with a tiled upscaler
  - node icons 1024×1024
- **Sampler:** DPM++ 2M Karras, 28–34 steps, CFG 5–6.5. Low CFG keeps the glow soft.
- **Seed strategy:**
  - Pick one "house seed" per folder (e.g. cards 4141, enemies 6600) and change only the per-item prompt. Similar noise means similar lighting and composition across a set.
  - When an image is close but not right, keep its seed and vary the prompt, or use img2img at denoise 0.35–0.5.
  - Record the seed of every keeper in a text file next to your masters, so you can regenerate at higher resolution later.
- **Consistency boosters:**
  - An IP-Adapter (style) fed with your 2–3 favourite finished pieces, weight 0.4–0.6.
  - Or train a small style LoRA on ~20 keepers once you have them.
- **Transparent sprites** (enemies, relics, UI): generate on the near-black background, then remove it:
  - A background-removal node (e.g. a BiRefNet / RMBG-class model) gives clean alpha.
  - Then feather the mask edge by 1–2 px, so glows don't get a hard halo.
  - Keep some outer glow: let the mask include a soft falloff, rather than cutting at the subject's edge.
- **Check at real size:** look at every result at 64–96 px before keeping it. If the silhouette isn't readable that small, it fails on a phone.

### Per-item prompts
Write each as: *shared style prompt* + the line below. Hue hints are optional.

#### Cards (`art-raw/cards/<id>.png`, 4:3)
| ID | Prompt |
|---|---|
| shard-strike | a jagged crystal shard flung through darkness, trailing ember-orange light, motion streak |
| ward-sigil | a floating circular ward glyph of cold cyan light, concentric runes, protective barrier |
| shatter-lens | a cracked crystal lens exploding outward, white-hot light screaming from the fractures, ember shards |
| overcharge | an ancient relic core overloading, violet lightning arcing from cracked metal housing |
| twin-shards | two mirrored crystal blades crossing, one drawing blood-red light from the wielder, ember glow |
| hollow-vow | a hand pressed to a glowing altar seal, thin blood lines feeding violet runes |
| fault-line | a long glowing crack splitting a stone floor and a figure's silhouette, orange light below |
| blood-price | a cracked obsidian blade lit from inside by red-orange veins, droplets suspended in air |
| release-the-fault | a figure splitting open with blinding light pouring from fractures, shockwave, ember and white |
| glyph-wall | stacked layers of cyan glyph-shields forming a wall of light, ancient script |
| mirror-sigil | a dark mirror-glyph reflecting a cowering monster, cyan rim light |
| bulwark-slam | a slab of rune-carved stone shield crashing forward, cyan impact light, debris |
| bastion-rite | a lone armoured warden standing inside a column of cyan wards, unmoving, solemn |
| arc-conduit | a crystal conduit channelling violet electricity into a strike, branching arcs |
| coolant-litany | frost-blue mist pouring over a glowing violet relic, steam, hushed |
| cascade | a row of ancient relics igniting one after another in violet fire, chain reaction |
| serrate | a serrated glass edge with orange light along its teeth, thin red mist |
| hemorrhage-glyph | a crimson rune hovering over a wound, light dripping like blood, gold accents |
| scar-tissue | cracked skin and stone fused together, cyan light sealing the fractures |
| crack-the-seal | a great circular seal splitting down the middle, gold and violet light bursting through |
| sigil-lattice | a lattice of thin cyan light lines strung between floating runestones |
| rampart-breaker | a collapsing wall of light hurled forward as a weapon, cyan shards, rubble |
| spark-tithe | a relic drinking a thin stream of blood and sparking violet, small and greedy |
| resonant-feedback | concentric violet shockwaves echoing outward from a cluster of relics |
| unbind | chains of light snapping around a burning relic, violet and orange, release |
| open-veins | sharp air filled with thin red glass needles, hanging in darkness, gold glints |
| red-harvest | a scythe-shaped arc of red light reaping glowing wounds, gold rim |
| gnawing-static | a skull-shaped smear of green static noise, sickly, unsettling |
| hollow-echo | a translucent green ghost of a warden screaming silently, distorted |
| leaden-thought | a heavy dull green metal weight chained to a glowing mind-sigil |

#### Enemies (`art-raw/enemies/<id>.png`, 1:1, transparent)
| ID | Hue | Prompt |
|---|---|---|
| hollow-sentinel | 200 cyan | a hollow armoured construct with a square glowing core, empty helm, guarding pose, cyan runes |
| bleeding-lattice | 350 red | a floating hexagonal lattice of razor-thin red light, dripping glowing droplets |
| mirror-wraith | 265 violet | a triangular mirror-faced wraith with a smeared reflection of a warden, violet glow |
| choir-shard | 170 teal | a singing pentagonal crystal shard with a mouth-like fissure, teal sound rings |
| rust-seraph | 25 orange | a rusted six-winged seraph of corroded metal, cracks glowing orange, burning halo |
| vein-crawler | 340 crimson | an eight-legged conduit crawler made of cables and glowing crimson veins |
| ash-hound | 15 ember | a lean hound of ash and cinders with ember eyes and a triangular skull plate |
| tithe-engine | 48 gold | a massive hexagonal machine-idol with a collection bowl, gold gears, three rings of light |
| warden-unmade | 210 blue | a fallen warden in broken armour, face a void, blue-white sigil eyes, sword lowered |
| lens-tyrant | 300 magenta | a colossal floating eye-lens cracked with magenta light, orbiting fragments |
| grieving-lock | 280 violet | an immense circular vault lock with a weeping face of light, four concentric rings, chains |

#### Relics (`art-raw/relics/<id>.png`, 1:1, transparent)
| ID | Prompt |
|---|---|
| cinder-core | a dead star caged in bone-white metal, orange embers inside |
| grieving-prism | a tall prism weeping drops of white light |
| thorned-halo | a crown of glass thorns with a faint red glow |
| stilled-heart | a still mechanical heart of black metal with one cyan vein |
| bone-abacus | an abacus of carved bone beads on dark metal rods, faint violet glow |
| lodestone-heart | a heavy dark lodestone with gravity ripples around it |
| ash-rosary | a rosary of ash beads, each with a tiny ember inside |
| mirrorglass-ward | a hand mirror of dark glass catching a cyan light |
| fault-engine | a small engine of cracked gears with orange light leaking from the fractures |
| hungering-eye | a single glowing eye set in tarnished metal, hungry, magenta iris |
| grave-lantern | a lantern of black iron burning a pale green flame |

#### Node icons (`art-raw/ui/node-<type>.png`, transparent)
| ID | Prompt |
|---|---|
| node-fight | two crossed relic blades, glyph style, red glow, flat emblem |
| node-elite | a horned crown sigil, orange glow, flat emblem |
| node-event | an all-seeing eye glyph, cyan glow, flat emblem |
| node-cache | a sealed hexagonal reliquary box, gold glow, flat emblem |
| node-shrine | an arched shrine with a small flame, green-teal glow, flat emblem |
| node-boss | a great lock sigil, nested diamonds, violet glow, flat emblem |

Add to the negative prompt for icons: `scene, background detail, perspective`.

#### Backgrounds (`art-raw/backgrounds/<key>.png`, 9:16)
| Key | Prompt |
|---|---|
| outpost | a lonely outpost of salvaged relic-tech at the edge of vast black ruins, a single cold lantern, distant glowing vault gate |
| vault | endless dark vault corridors of obsidian and rune-carved arches, faint violet light in the depths |
| combat | a ruined circular arena inside the vault, cracked floor sigil, darkness pressing in from all sides |
| shift-drowned-halls | flooded vault halls, black water reflecting cyan runes, drowned statues |
| shift-choir-awake | a vaulted chamber of singing crystal pillars, teal sound rings in the air |
| shift-fractured-sky | a vault ceiling cracked open, blinding white light lancing down through fractures |
| shift-restless-engines | colossal dormant machines stirring in the dark, gold seams of light |
| shift-hollow-bargain | a vast empty throne hall, a single offering table, violet candlelight |

## Blender: where 3D beats 2D generation
The game itself stays 2D. Blender is for making images.

**Use Blender for:**
- **Relics.** These are objects, so modelling them once gives perfect consistency, crisp silhouettes and clean transparency. An emissive rune texture on a weathered metal or obsidian material reads beautifully at 44px. You can re-light the whole set in one go if you change the look.
- **Rotating artifact previews** (future: a relic inspector). Render a 24-frame turntable to a WebP sprite sheet or animated WebP. The game would play it as a 2D image, with no 3D engine.
- **Layered backgrounds.** Block out ruins with simple geometry, render 3 depth layers (far, mid, near) as separate transparent images, then paint over them or run img2img at low denoise in ComfyUI. Layers allow a subtle parallax later.
- **Enemy bases.** A rough 3D blockout gives ComfyUI a strong composition via ControlNet (depth or lineart), keeping 11 enemies at the same scale and angle.

**Render settings that match the game:**
- **Engine:** Eevee (fast, the bloom suits the look) or Cycles at 128–256 samples with denoise.
- **World:** pure black (strength 0). All light comes from emissive materials plus one faint cool rim light (blue-violet, low power) behind the object.
- **Materials:** dark base colour (value ≤ 0.08), roughness 0.4–0.7. Emission (strength 3–15) only in runes, cracks and cores.
- **Bloom / glare:** Eevee Bloom, or the compositor Glare node (Fog Glow, threshold 0.8, size 7–8).
- **Colour management:** AgX (or Filmic), look "Medium High Contrast", exposure about −0.5. Glows should roll off softly, not clip.
- **Camera:** 85–100mm, slightly below centre looking up (imposing). Orthographic for UI icons.
- **Output:** PNG RGBA, **Film → Transparent** on, 2× the spec size (relics 512×512, enemies 1536×1536). Then drop the file into `art-raw/` and run `npm run art`.
