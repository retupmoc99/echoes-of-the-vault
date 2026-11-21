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

### Generating art automatically
With ComfyUI running locally (SDXL base and the LaxpeintXL LoRA installed), run:
```bash
COMFY_URL=http://127.0.0.1:8188 npm run art:gen -- [ids...] [--folder cards|backgrounds|enemies|relics|ui] [--seeds 101,303] [--force]
```
The script reads each item's prompt from the tables below (cards by default), plus the style and negative prompts. It writes one image per seed to `art-raw/_candidates/<folder>/<id>_<seed>.png`. With no IDs, it does every item in the folder and skips images that already exist. Copy the keeper to `art-raw/<folder>/<id>.png` and run `npm run art`. `art-raw/_candidates/SEEDS.txt` records which seed won for each image.

Comfy Desktop users: the desktop app may not expose a local API. You can run the install's server directly, from its `ComfyUI` folder: `.venv/Scripts/python.exe main.py --port 8190 --extra-model-paths-config <yaml pointing at your models folder>`.

**Current set (0.13.0):** the full set, 101 images, 3.3 MB (the Sleeper, its Eye and The Sleeper's Breath background added in 0.13).
- All 55 cards, picked from ~180 generated images on an RTX 5080 (~6 s each). Weakest, worth a reroll: *Second Hand* (a clock, not a blade), *Loop the Moment*, *Unmake the Hour* and *Mirror Sigil* (pale backgrounds), *Twin Shards* (pillars, not crossed blades).
- All 8 backgrounds: `npm run art:gen -- --folder backgrounds`. 768×1344 plus a built-in second pass (latent upscale ×1.5, denoise 0.45) to 1152×2016, ~16 s each.
- All 11 enemies, 18 relics and 6 node icons: `--folder enemies|relics|ui`. Cut out with ComfyUI's built-in Remove Background node and BiRefNet (`birefnet.safetensors`, 424 MB, from huggingface.co/Comfy-Org/BiRefNet, in the `background_removal` models folder). Over budget but kept for detail: *Vein Crawler* (166 KB), *Bone Abacus* (34 KB), *Gilded Gear* (26 KB).

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
### Shared style prompt (append after every item prompt)
```
dark science-fantasy relic art, ancient alien technology that looks like sorcery, near-black void background, lit only by its own glowing runes and cracks, volumetric haze, weathered obsidian and tarnished metal, high contrast, rim light, grim and solemn, cinematic, painterly digital art, visible brushwork
```
**Put the subject first.** With the style in front, SDXL ignores the subject and draws a glowing round seal every time. Words like "sacred geometry" and "sigils" make it worse, so they're gone.

### Tested setup (2026-11-21, SDXL base 1.0, RTX 5080, ~6 s per card)
- Prompt: *item prompt*, then the shared style prompt above.
- LoRA `LaxpeintXL-2.0` at **0.45** (model and clip). That's enough for painterly texture. At 0.7 it adds arches and light shafts that fight the near-black look. Without it, results look like stock product renders.
- 30 steps, DPM++ 2M Karras, CFG 6.
- Make 2 seeds per item and keep the better one. 101 and 303 gave the best first batch.
- Be literal about shape. "Ring" became a bangle held in hands; "a hovering circle of glyphs" worked.

### Shared negative prompt
```
text, letters, watermark, signature, logo, frame, border, ui, white background, grey background, pale background, desert, sand dunes, cartoon, anime, chibi, cute, bright background, daylight, sky, colorful, rainbow, pastel, lens flare overload, busy background, multiple subjects, cropped subject, blurry, lowres, jpeg artifacts, deformed, extra limbs, photo, modern objects, guns, sci-fi spaceship
```

### Workflow settings
- **Model:** an SDXL-class model with a painterly bent, for example a good SDXL base or fine-tune. Keep **one checkpoint for the whole set**; switching checkpoints breaks consistency faster than anything else.
- **Resolution** (generate at native SDXL buckets, then let the script resize):
  - cards 1152×864 (4:3)
  - enemies and relics 1024×1024
  - backgrounds 768×1344 (9:16), then a second pass: latent upscale ×1.5 and re-sample at denoise 0.45 (built-in nodes, no upscaler model needed)
  - node icons 1024×1024
- **Sampler:** DPM++ 2M Karras, 28–34 steps, CFG 5–6.5. Low CFG keeps the glow soft.
- **Seed strategy:**
  - **Don't** use one seed for a whole folder. In testing, it gave every card the same centred composition. Consistency comes from the shared style prompt and LoRA; vary the seed per item.
  - When an image is close but not right, keep its seed and vary the prompt, or use img2img at denoise 0.35–0.5.
  - Record the seed of every keeper in a text file next to your masters, so you can regenerate at higher resolution later.
- **Consistency boosters:**
  - An IP-Adapter (style) fed with your 2–3 favourite finished pieces, weight 0.4–0.6.
  - Or train a small style LoRA on ~20 keepers once you have them.
- **Transparent sprites** (enemies, relics, UI): `npm run art:gen` does this automatically. It generates on black, cuts the subject out with BiRefNet, feathers the mask by ~1 px, and keeps coloured glow within ~30 px of the subject as soft falloff. Grey or white backdrops don't count as glow, so they drop away.
  - Don't write "isolated on a black background": SDXL reads "isolated" as a white studio backdrop. "Floating alone in total black darkness" works.
  - For abstract enemies (lattices, machines, locks), say "no body". Otherwise the creature wording turns them into hooded figures.
- **Check at real size:** look at every result at 64–96 px before keeping it. If the silhouette isn't readable that small, it fails on a phone.

### Per-item prompts
Write each as: *shared style prompt* + the line below. Hue hints are optional.

#### Cards (`art-raw/cards/<id>.png`, 4:3)
| ID | Prompt |
|---|---|
| shard-strike | a single jagged crystal shard hurled through the dark like a spear, trailing a long streak of ember-orange light, dynamic diagonal motion |
| ward-sigil | a hovering circle of cold cyan glyphs and concentric rune bands, a shield of light in empty darkness |
| shatter-lens | a cracked crystal lens exploding outward, white-hot light screaming from the fractures, ember shards |
| overcharge | an ancient relic core overloading, violent violet lightning bolts arcing out of its cracked metal housing, sparks |
| twin-shards | two jagged crystal blades crossed in an X in the dark, one dripping blood-red light, ember glow, black void behind |
| hollow-vow | a hand pressed to a glowing altar seal, thin blood lines feeding violet runes |
| fault-line | a long glowing crack splitting a stone floor and a figure's silhouette, orange light below |
| blood-price | a cracked obsidian blade lit from inside by red-orange veins, droplets suspended in air |
| release-the-fault | a figure splitting open with blinding light pouring from fractures, shockwave, ember and white |
| glyph-wall | stacked layers of cyan glyph-shields forming a wall of light, ancient script |
| mirror-sigil | a dark obsidian mirror-glyph floating in a black void, reflecting a cowering monster, cyan rim light, deep darkness all around |
| bulwark-slam | a slab of rune-carved stone shield crashing forward, cyan impact light, debris |
| bastion-rite | a lone armoured warden standing inside a column of cyan wards, unmoving, solemn |
| arc-conduit | a crystal conduit channelling violet electricity into a strike, branching arcs |
| coolant-litany | frost-blue mist pouring over a glowing violet relic, steam, hushed |
| cascade | a row of ancient relics igniting one after another in violet fire, chain reaction |
| serrate | a close-up of a long serrated glass blade, its saw teeth glowing ember-orange, thin red mist drifting off the edge, no creature |
| hemorrhage-glyph | a crimson rune hovering over a wound, light dripping like blood, gold accents |
| scar-tissue | cracked skin and stone fused together, cyan light sealing the fractures |
| crack-the-seal | a massive round stone seal door splitting down the middle, blinding gold and violet light bursting out of the crack, debris |
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
Add to the negative prompt: `white background, grey background, studio backdrop, floor, ground, shadow, pedestal, wall, paper, parchment, disc behind, robed figure, hooded cloak`.
Add to the style prompt: `a single subject, the whole subject in frame, centred, facing the viewer, floating alone in total black darkness, black void around it, nothing else in the frame`.
| ID | Hue | Prompt |
|---|---|---|
| hollow-sentinel | 200 cyan | a hollow armoured construct with a square glowing core, empty helm, guarding pose, cyan runes |
| bleeding-lattice | 350 red | an abstract floating hexagonal cage made of razor-thin red light beams, glowing crimson droplets falling from it, geometric, no body |
| mirror-wraith | 265 violet | a triangular mirror-faced wraith with a smeared reflection of a warden, violet glow |
| choir-shard | 170 teal | a singing pentagonal crystal shard with a mouth-like fissure, teal sound rings |
| rust-seraph | 25 orange | a rusted six-winged seraph of corroded metal, cracks glowing orange, burning halo |
| vein-crawler | 340 crimson | an eight-legged conduit crawler made of cables and glowing crimson veins |
| ash-hound | 15 ember | a lean hound of ash and cinders with ember eyes and a triangular skull plate |
| tithe-engine | 48 gold | a massive hexagonal brass machine-idol of turning gold gears and three glowing rings of light, a collection bowl at its base, mechanical, no body |
| warden-unmade | 210 blue | a fallen warden in broken armour, face a void, blue-white sigil eyes, sword lowered |
| lens-tyrant | 300 magenta | a colossal floating eye-lens cracked with magenta light, orbiting fragments |
| grieving-lock | 280 violet | an immense round vault-door lock mechanism of four concentric metal rings, a sorrowful weeping face of violet light at its centre, heavy chains, no body |
| the-sleeper | 320 magenta | a vast half-formed dreaming colossus curled in on itself, featureless face of smooth stone with many closed glowing eyes along its body, trailing threads of magenta light, no body detail below the waist, ancient and enormous |

#### Relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame`.
| ID | Prompt |
|---|---|
| cinder-core | a dead star caged in bone-white metal, orange embers inside |
| grieving-prism | a tall clear crystal prism glowing bright white from inside, weeping drops of white light down its faces |
| thorned-halo | a crown of glass thorns with a faint red glow |
| stilled-heart | a still mechanical heart of black metal with one cyan vein |
| bone-abacus | an abacus of carved bone beads on dark metal rods, faint violet glow |
| lodestone-heart | a heavy dark lodestone with gravity ripples around it |
| ash-rosary | a rosary of ash beads, each with a tiny ember inside |
| mirrorglass-ward | a hand mirror of dark glass catching a cyan light |
| fault-engine | a small engine of cracked gears with orange light leaking from the fractures |
| hungering-eye | a single glowing eye set in tarnished metal, hungry, magenta iris |
| grave-lantern | a lantern of black iron burning a pale green flame |
| sleepers-eye | a single closed stone eyelid set in a ring of dark iron, a thin line of magenta light leaking from beneath it |

#### Hour-Thief cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **pale jade and silver** (Temporal cards), with ember for strikes and cyan for wards. Add to the style prompt: `pale jade and silver glow`. (An earlier "clockwork, hourglass sand, frozen motion" turned every card into an hourglass in a desert.)

| ID | Prompt |
|---|---|
| second-hand | a long thin silver blade shaped like the second hand of a clock, slicing diagonally through the dark, jade motion trail, needle-sharp point, no clock face |
| stilled-moment | a figure inside a sphere of frozen falling sand, cyan stillness, suspended droplets |
| slow-fuse | a burning fuse of jade light coiling around an hourglass, sparks frozen mid-air |
| stolen-second | a gloved hand pulling a glowing second out of a clock face, jade light |
| patient-blade | a blade mid-swing with a ghostly second blade following moments behind, ember and jade |
| held-breath | a warden holding a shimmering shield of slowed time, ripples in the air, cyan |
| countdown | a cracked clock face with numerals falling away, each glowing jade |
| sundial-ward | an ancient sundial casting a shadow that becomes a shield of cyan light |
| accelerate | clock hands blurring into a spinning disc of jade light, rushing forward |
| hour-bomb | a sphere of compressed hourglass sand about to burst, ticking glyphs, jade and white |
| doomsday-clock | a colossal broken clock tower in the void, hands at the final hour, jade fire |
| flicker | a blade appearing in three places at once, afterimages, jade outlines |
| afterimage | a warden's translucent afterimages absorbing blows, cyan ghosts |
| repeating-edge | the same sword strike repeated in overlapping transparent layers, ember and jade |
| refrain | sheets of glowing script repeating in a spiral, a choir of faint echoes |
| chorus-of-moments | dozens of translucent copies of one figure singing, jade halos, overwhelming |
| undo | shattered glass flying backwards into a whole pane, reversed time, jade |
| loop-the-moment | a glowing ring of jade light hanging in a black void, a single step of light repeating around it endlessly like an ouroboros, deep darkness all around |
| fray-the-thread | a glowing thread of time unravelling into sparks, ember and jade |
| borrowed-time | a coin made of hourglass sand pressed into a palm, jade glow, dread |
| paradox-lance | a spear of impossible geometry, folding into itself, jade and white |
| stitch-the-wound | glowing jade stitches sewing a torn moment shut, silver needle |
| temporal-shear | a vast blade cutting reality into two offset halves, jade seam of light |
| unmake-the-hour | an hourglass folding inward and collapsing into a single point of jade light, glass shards spiralling inward, black void all around |
| age-the-flesh | a hand withering to bone where jade time-light touches it, red mist |

#### Hour-Thief relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame`.
| ID | Prompt |
|---|---|
| cracked-hourglass | a cracked hourglass with sand flowing both up and down, jade glow |
| stopped-clock | a pocket watch frozen at one moment, hands fused, faint cyan |
| gilded-gear | a single ornate gold gear tooth etched with tiny constellations |
| reversed-compass | a compass whose needle points backward, silver with jade glass |
| last-breath-locket | an open locket releasing a pale wisp of breath, silver, jade |
| pendulum-of-ash | a pendulum of black ash swinging, leaving glowing jade trails |
| thief-of-moments | a small sack spilling glowing seconds like coins, jade and gold |

#### Node icons (`art-raw/ui/node-<type>.png`, transparent)
Add to the style prompt: `a simple bold symmetrical glyph emblem, centred, floating in total black darkness, flat graphic icon, thick glowing lines`.
| ID | Prompt |
|---|---|
| node-fight | two crossed relic blades, glyph style, red glow, flat emblem |
| node-elite | a horned crown sigil, orange glow, flat emblem |
| node-event | an all-seeing eye glyph, cyan glow, flat emblem |
| node-cache | a sealed hexagonal reliquary box, gold glow, flat emblem |
| node-shrine | an arched shrine with a small flame, green-teal glow, flat emblem |
| node-boss | a great lock sigil, nested diamonds, violet glow, flat emblem |

Add to the negative prompt for icons: `scene, background detail, perspective, white background, grey background, paper, parchment, disc behind, frame`.

#### Backgrounds (`art-raw/backgrounds/<key>.png`, 9:16)
Add to the negative prompt: `person, figure, silhouette, character, monk, robed figure, moon, clouds`.
Add to the style prompt: `vast empty environment, calm open space in the middle, tall vertical composition, environment concept art, mid-tones`. The game darkens these and puts UI on top, so a busy centre fights the cards and enemies.

| Key | Prompt |
|---|---|
| outpost | a lonely outpost of salvaged relic-tech huddled in vast black ruins underground, a single cold blue lantern, a distant glowing vault gate, cold blue and teal light |
| vault | endless dark vault corridors of obsidian and rune-carved arches receding into the distance, faint violet light in the depths, violet glow |
| combat | a ruined circular arena deep inside the vault, a cracked glowing floor sigil in the foreground, darkness pressing in from all sides, ember-orange and crimson glow |
| shift-drowned-halls | flooded vault halls, black water reflecting cyan runes, drowned statues |
| shift-choir-awake | a vaulted chamber of singing crystal pillars, teal sound rings in the air |
| shift-fractured-sky | a vault ceiling cracked open, blinding white light lancing down through fractures |
| shift-restless-engines | colossal dormant machines stirring in the dark, gold seams of light |
| shift-hollow-bargain | a vast empty throne hall, a single offering table, violet candlelight |
| shift-sleepers-breath | a vast dark vault whose stone walls swell and sag like slow breathing flesh, faint magenta glow pulsing deep in the cracks |

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
