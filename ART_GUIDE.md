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

**Current set (0.21.0):** the full set, 344 images, 8.81 MB (Rewrite in 0.16; floor 2 in 0.19; the Somnant in 0.20; the Sin-Eater, Mirrorborn, Shiftwright, Pilgrim and Tollkeeper, 119 cards and 45 relics, in 0.21). The Sleeper, its Eye and The Sleeper's Breath background came in 0.13; the Echo-Caller's 24 cards and 7 relics in 0.14.1. *Soul Lance* and *Severed Thread* were rerolled in 0.14.2.
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
| drowned-bellringer | 190 cyan | a drowned bell-ringer made of waterlogged rags and chains, a huge cracked bronze bell hanging where its head should be, dripping water, pale cyan glow |
| hollow-pilgrim | 35 amber | a hollow hunched pilgrim of empty robes and a walking staff, no face under the hood, a single small amber lantern glow inside the robes |
| rot-lantern | 80 sickly green | a floating rusted iron lantern pouring out thick sickly green smoke, a burning eye inside the glass instead of a flame |
| gnawing-dark | 270 violet | a shapeless mass of living darkness with rings of glowing violet teeth spiralling inward, no body, no eyes |
| stitched-chorister | 330 magenta | a small stitched-together choir doll with three sewn mouths singing, pale cloth body, thick black stitches, magenta glow |
| the-unwound | 160 jade | a humanoid figure made of a single long unravelling jade thread, coils of loose thread spiralling off its body, glowing jade |
| keeper-of-stairs | 15 orange | a towering armoured giant whose body is built from stacked stone stair steps, a huge iron key held like a club in one fist, glowing orange eyes and cracks, full figure |
| the-many-handed | 300 purple | a writhing cluster of dozens of pale grasping arms and hands bursting outward from a dark sphere in every direction, purple glow between the fingers |
| bottom-of-the-well | 205 deep blue | a colossal drowned face rising out of black water inside a round stone well shaft, its mouth an open whirlpool, deep blue glow |

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
| drowned-crown | a corroded iron crown dripping with dark water, small blue gems glowing inside the rust |
| waterclock | a small brass water clock with a glass bulb of glowing blue water dripping into a cup |
| well-rope | a coil of frayed old rope with a rusted hook, glowing faintly blue where hands have worn it |

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
| rewrite | a quill of jade light writing glowing script in the dark, older lines of the script unravelling and re-forming as new words, floating letters |
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

#### Echo-Caller cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **spectral pale blue and silver**: the dead, called back. Add to the style prompt: `spectral pale blue and silver glow, cold grave light`. Subjects are deliberately varied (objects, hands, crowds), so the set isn't 24 hooded ghosts.

| ID | Prompt |
|---|---|
| grave-strike | a heavy broken gravestone swung like a hammer through the dark, cold blue light trailing from its cracks |
| shroud | a tattered burial shroud billowing outward into the shape of a shield, faint cyan glow along its torn edges |
| call-the-fallen | an iron lantern held up in the dark, its pale blue flame drawing faint translucent faces up out of the blackness |
| whispered-name | a pale blue breath of mist leaving parted lips in the dark, curling into the shape of a reaching hand |
| gathering-dark | two translucent ghostly warriors rising side by side out of still black water, cold blue light |
| requiem | a choir of faint translucent figures singing in the dark, mouths open, blue-white light pouring from their throats |
| hymn-of-iron | a ghostly iron helmet and gauntlets floating in the dark, bound together by bands of cyan light like armour forming |
| stand-before-me | a translucent ghost warrior standing with arms spread in front of a kneeling figure, shielding it, cyan glow |
| kindred-blade | a single sword gripped by many translucent hands at once, all reaching out of the dark, ember-orange edge |
| rally-the-dead | translucent warriors lifting themselves from the floor of a dark battlefield, pale blue light in their eyes |
| choir-of-the-lost | countless glowing translucent faces pressed together in the dark like a wall of souls, mouths open in song, blue and silver light, no architecture |
| release | a ghostly figure bursting apart into hundreds of white-blue shards of light flying outward |
| grave-tithe | a translucent hand dropping a glowing coin of blue light into a dark stone offering bowl |
| soul-lance | a single straight spear of pure pale blue light flying through the dark, ghostly faces streaming along its shaft like a comet tail, no person holding it |
| mourning | a wall of dark stacked gravestones glowing faintly cyan, standing like a shield in the dark |
| last-rites | a single candle flame being snuffed between two ghostly fingers, a thin trail of blue smoke rising |
| final-chorus | a ring of translucent figures erupting outward together into a shockwave of white and blue light |
| borrowed-hand | a translucent ghostly hand guiding a living hand that grips a dagger, faint blue glow |
| remembered-ward | a faint translucent round shield made of blue mist hovering in total darkness, ghostly glowing edges, black void behind it |
| echoing-cut | a blade slash through the dark with a fainter translucent copy of the same slash following just behind it, ember and pale blue |
| what-they-knew | a translucent face leaning close out of the dark to whisper, cold blue light on its features |
| memory-of-victory | a ghostly warrior raising a sword in triumph atop a shattered vault lock, pale gold and blue light |
| shared-wound | two hands, one living and one translucent, joined palm to palm across a single glowing red wound |
| hollow-choir | a row of empty hooded robes floating in the dark with no one inside them, faint blue glow from within |

#### Echo-Caller relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, pale blue glow`.

| ID | Prompt |
|---|---|
| lantern-of-names | an iron lantern burning a cold blue flame, faint faces visible inside the flame |
| bell-of-the-drowned | a small corroded bronze bell dripping black water, cyan glow inside its mouth |
| ashen-locket | an open silver locket spilling a little grey ash, faint blue glow inside |
| choir-stone | a smooth dark stone carved with many tiny open mouths, faint blue light glowing inside them |
| mourners-veil | a folded black lace veil with a faint silver shimmer |
| grave-ledger | a thick black ledger book bound shut with chains, sickly green light leaking from its pages |
| severed-thread | a thick glowing silver cord snapped in two in the dark, two bold frayed ends close together with bright sparks between them, close-up, no ring, no frame |

#### Somnant cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **muted violet and moonlit silver**: sleep, dreams, lullabies. Add to the style prompt: `muted violet and silver moonlight, soft dreamy haze`. Subjects vary on purpose (moths, candles, cloth, closed eyes, music), so the set isn't 24 sleeping figures.

| ID | Prompt |
|---|---|
| dull-blade | a worn blunt sword with a rounded nicked edge resting on dark grey cloth, faint violet sheen on the steel |
| veil-of-sleep | a heavy grey veil of cloth floating in the dark like a held breath, its folds glowing faint silver |
| lullaby | three glowing violet musical notes drifting through a dark vault, soft rings of sound spreading from them |
| nightfall-cut | a single silver blade slicing through a deep violet night sky, a thin crescent moon behind it |
| heavy-eyelids | a pale stone face with both eyes firmly closed in deep sleep, long lashes resting on the cheeks, faint violet glow along the closed lids |
| yawn | a dark vaulted room where many small candles lean and dim at once, as if breathed on |
| whisper-down | a pale hand cupped near a sleeping ear in darkness, faint violet whisper lines curling from the fingers |
| dream-thief | a shadowy hand pulling a glowing violet thread of dream from the mouth of a sleeping stone head |
| sleepwalkers-ward | bare feet stepping softly across cold flagstones in the dark, a faint silver shield of mist around them |
| soft-step | a single bare footprint glowing violet on dark stone, moths gathering around it |
| pillow-of-ash | a soft pillow made of grey ash and embers resting on dark stone, a thin curl of smoke rising |
| counting-down | a row of tall candles in the dark, each one shorter than the last, the final one just a wisp of smoke |
| murmured-name | silver letters of a name dissolving into violet smoke above a dark altar |
| cradle-song | an old wooden cradle rocking alone in a vast dark vault, violet light spilling from inside it |
| dreamless-edge | two crossed silver daggers floating in pure black, their blades reflecting a sleeping face |
| deep-rest | a stone sarcophagus with its lid slightly open, soft violet light and moths drifting out |
| lucid-strike | a single wide-open glowing violet eye inside a dark storm of swirling sleep mist |
| slumber-ward | a tall wall of folded grey cloth and soft moonlight standing in darkness |
| undertow-hymn | a dark flooded chapel, violet light glowing from beneath the still water, faint singing ripples |
| nightmare | a monstrous shadow bursting out of a sleeping figure's dream bubble, violet and black |
| sleepers-kiss | pale stone lips pressed to a sleeping stone forehead, a soft violet glow at the touch |
| dreamwalk | a cloaked figure walking along a path made of floating dream bubbles through a black void |
| long-night | a huge pale moon low over endless dark vault rooftops, every window dark, stars fading |
| eternal-lullaby | a vast ancient music box open in the dark, its tiny dancer frozen mid-turn, violet light pouring out |

#### Somnant relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, soft violet glow`.

| ID | Prompt |
|---|---|
| sleepers-hum | a small two-pronged silver tuning fork, glowing violet ripples of sound spreading from its humming prongs |
| moth-lantern | a small brass lantern with pale glowing moths clustered on its glass |
| pillow-stone | a smooth rounded grey stone shaped like a small pillow, a faint silver sheen |
| cracked-music-box | a small cracked wooden music box, its lid half open, a tiny violet glow inside |
| dream-catcher | a woven ring of dark wire and hair with a single glowing violet bead at its centre |
| nightcap | a small dark glass bottle with a cork, violet liquid glowing inside |
| lethe-vial | a slender glass vial of pale silver water, swirling mist inside |
| the-last-lullaby | a single torn page of sheet music glowing violet at its edges, curling in on itself |
| drowned-hymnal | a small waterlogged hymn book, dripping, faint violet light between its swollen pages |

#### Sin-Eater cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **ash grey, bone white and sickly gold**. Add to the style prompt: `ash grey and sickly gold light, smoke and embers`.

| ID | Prompt |
|---|---|
| bitter-strike | a single black iron dagger lying on grey ash, thick gold tar dripping from its blade, no person |
| ash-shroud | a tattered grey burial shroud billowing in a wind of falling ash |
| swallow | a huge shadowy open mouth swallowing a coiling knot of black smoke |
| take-the-sin | a pale outstretched hand receiving a glowing black coal from another hand |
| bitter-feast | a long stone table set with cracked bowls of black smoke and gold ash |
| grave-hunger | a skeletal figure kneeling over an open grave, gold light rising from it |
| gnash | rows of jagged teeth snapping shut in the dark, sparks of gold between them |
| salt-the-wound | a hand pouring glittering grey salt onto a glowing red wound in stone |
| sackcloth | a rough sackcloth robe hanging on a hook, stitched with gold thread runes |
| hungry-eyes | a pair of glowing gold eyes staring hungrily out of total darkness |
| ash-mouth | a stone face breathing out a great cloud of ash and embers |
| communion-of-ash | a cup overflowing with grey ash held up in a dim chapel, gold light |
| gorge | a huge cracked iron cauldron overflowing with black smoke and glowing gold embers, no face |
| feast-of-crows | a flock of black crows over a ruined feast table, gold light in their eyes |
| bile | a cracked flask spilling sickly yellow green liquid onto black stone |
| sin-shield | a heavy shield made of fused black chains and grey ash, gold rivets glowing |
| heavy-heart | a heavy iron heart wrapped in chains sinking through darkness, gold glow inside |
| glutton | a hunched shadowy figure stuffing glowing black embers into its mouth |
| absolution | a pale figure bathed in a column of clean gold light, black smoke burning away |
| sin-bloated | a swollen glowing gold and black sack bursting at the seams, smoke leaking out, no face |
| maw-of-the-vault | an enormous stone mouth opening in a vault wall, swallowing curses |
| last-supper | a candlelit stone table set for many, every chair empty but one |
| eat-the-sky | a colossal shadow taking a bite out of a dark sky full of gold stars |

#### Sin-Eater relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, sickly gold glow`.

| ID | Prompt |
|---|---|
| black-salt | a small heap of black salt crystals glinting gold |
| iron-stomach | a small anatomical iron stomach bound with rivets |
| bone-fork | a two-tined fork carved from yellowed bone |
| tithe-bowl | a small cracked bronze bowl filled with black smoke |
| sin-ledger | a thick black book bound with chain, gold letters on the cover |
| gilded-tongue | a severed tongue covered in gold leaf |
| the-last-meal | a single small plate with a burnt black crust of bread |
| ash-crown | a crown made of grey ash and charred bone, gold sparks |
| drowned-chalice | a tarnished chalice dripping with dark water, gold rim |

#### Mirrorborn cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **silver and cold cyan**. Add to the style prompt: `silver and cold cyan light, glass reflections and shards`.

| ID | Prompt |
|---|---|
| glass-edge | a long blade made of a single shard of mirror glass, reflecting a cold cyan light |
| silvered-ward | a round shield of polished silver mirror reflecting a dark vault |
| reflection | a figure facing its own reflection in a tall cracked mirror, the reflection moving first |
| mimics-guard | a silver mirror held up catching a falling blade, sparks of cyan light |
| copycat | two identical masks side by side, one slightly cracked, silver and cyan |
| foreknowledge | a silver eye in a hand mirror seeing a blow coming, cyan glow |
| glass-shards | a burst of flying mirror shards glittering cyan in the dark |
| reflected-ward | two mirrored walls facing each other reflecting into infinity |
| silver-tongue | a silver tongue of liquid metal curling out of a mask mouth |
| hairline-crack | a perfect mirror with a single thin crack spreading across it |
| mimicry | a shadow on a wall copying the pose of a creature in front of it |
| second-glance | a mirror showing a figure looking over its shoulder, cyan light |
| two-faces | a single mask split down the middle into two different faces, silver |
| turn-it-back | a blade bouncing off a mirror back toward the one who swung it |
| pilfer | a thin silver hand plucking a glowing cyan orb out of a dark figure |
| hall-of-mirrors | an endless corridor of mirrors reflecting a single cyan light |
| shard-storm | a whirlwind of mirror shards spinning around a dark figure |
| inverse | an upside down reflection of a vault in a still silver pool |
| silvering | liquid silver flowing over a raised arm like armour |
| perfect-copy | a flawless silver statue identical to the creature beside it |
| shatter-the-glass | a great mirror exploding into a thousand pieces, cyan light bursting through |
| mirror-maze | a labyrinth of tall mirrors seen from above, cyan glow |
| face-of-the-foe | a silver mask shaped like a monster face held over a human face |
| thousand-faces | a wall covered in hundreds of different silver masks |

#### Mirrorborn relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, cold cyan glow`.

| ID | Prompt |
|---|---|
| cracked-mirror | a small round hand mirror with a long crack across the glass |
| silver-dust | a small pouch spilling glittering silver dust |
| hand-mirror | an ornate silver hand mirror with a sharp edge |
| two-sided-coin | a silver coin with a face on both sides |
| thiefs-glove | a thin black leather glove with silver fingertips |
| glass-heart | a heart made of clear glass glowing cyan inside |
| the-true-reflection | a small oval mirror reflecting a bright cyan eye |
| black-glass | a shard of black obsidian glass with a cyan glint |
| drowned-mirror | a small mirror dripping dark water, its glass clouded |

#### Shiftwright cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **stormy teal, deep blue and lightning white**. Add to the style prompt: `stormy teal and deep blue light, rain and lightning`.

| ID | Prompt |
|---|---|
| tide-strike | a wave of dark water crashing like a fist against black rocks |
| squall-ward | a wall of driving rain standing like a shield in the dark |
| turn-the-tide | a figure raising its arm as dark water rises around it |
| break-the-sky | a bolt of white lightning cracking a dark sky in two |
| undertow | dark water dragging a figure under by the ankles, teal glow |
| stormglass | a glass storm bottle with cloudy crystals forming inside |
| hymn-of-the-choir | a ring of hooded singers in a vault, golden sound rings rising |
| rising-water | black water rising up stone stairs, reflecting teal light |
| thunderclap | a shockwave of lightning bursting outward from a slammed staff |
| plainsong | a single candlelit singer in a vast dark nave, soft gold notes |
| squall-line | a line of storm clouds marching across a dark sea, rain in sheets |
| brine-ward | a shield crusted with white salt and dripping seawater |
| riptide | a spiralling current of dark water pulling into the depths |
| skyfall | pieces of a shattered sky falling like stones, lightning between them |
| chorus-of-storms | storm clouds shaped like singing faces, lightning in their mouths |
| barometer | an old brass barometer with its needle swinging wildly |
| deep-current | a deep underwater current glowing teal sweeping through ruins |
| lightning-rod | a tall iron rod on a spire catching a white lightning strike |
| canticle | an open hymn book glowing gold on a stone lectern in the rain |
| eye-of-the-storm | the calm round eye of a hurricane seen from within, stars above |
| the-long-weather | an endless grey storm over a drowned city, no end in sight |
| maelstrom | a vast whirlpool of water and lightning turning in the dark |
| weathermaker | a cloaked figure holding a small storm cloud in its hands |
| cataclysm | a gigantic lightning strike splitting the ground of a vault in two |

#### Shiftwright relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, teal glow`.

| ID | Prompt |
|---|---|
| weathervane | an iron weathervane shaped like a crow pointing downward |
| rain-chime | a small chime of glass droplets hanging from a ring |
| storm-jar | a glass jar with a tiny thundercloud trapped inside |
| tide-pool | a small stone bowl of dark seawater with a glowing anemone |
| choir-bell | a small golden handbell with engraved musical notes |
| broken-barometer | a cracked brass barometer with a bent needle |
| eye-of-the-vault | a round glass lens with a swirling storm inside |
| the-fourth-weather | a compass rose with a fourth unnamed point glowing |
| drowned-vane | a rusted weathervane dripping with dark water |

#### Pilgrim cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **dusty amber, road brown and candle gold**. Add to the style prompt: `dusty amber and candle gold light, long roads and distant lights`.

| ID | Prompt |
|---|---|
| road-strike | a heavy wooden walking staff swung against a dark shape on a dusty road |
| travel-cloak | a patched travelling cloak billowing on a windy road at dusk |
| long-stride | a single booted foot taking a huge step across a gap in the road |
| milestone | a weathered stone milestone carved with a number, a candle on top |
| trailblaze | a lantern bearer cutting a path through thorns, amber light ahead |
| wayshrine-ward | a tiny roadside shrine with a candle, sheltering a traveller |
| second-wind | a tired traveller standing up again on a long road, dawn light ahead |
| footsore | worn blistered boots resting on a stone, the road behind them |
| walking-stick | a carved walking stick planted in the dust of a crossroads |
| dust-of-the-road | a cloud of amber dust kicked up by passing feet |
| bedroll | a rolled blanket and a small campfire beside a dark road |
| map-fragment | a torn scrap of an old map with a glowing path drawn on it |
| pack-mule | a laden mule plodding along a mountain path under lanterns |
| long-road-home | an endless road winding toward a single distant warm light |
| forced-march | a line of weary pilgrims marching through the night by torchlight |
| pilgrims-rest | a traveller asleep under a stone arch, a candle burning low |
| milestone-ward | two stone milestones standing like shields on either side of a path |
| waystation | a small stone hut with a lit window on a long dark road |
| cairn | a tall cairn of balanced stones on a hill, amber sunset |
| carved-stone | a hand carving a mark into a road stone with a knife |
| pilgrims-end | a pilgrim arriving at a great glowing gate at the end of a road |
| thousand-steps | a vast stone staircase climbing into clouds, tiny figure halfway up |
| far-horizon | a lone figure looking at a glowing horizon from a hilltop |
| the-last-mile | a final stretch of road ending at a door of light, footprints leading to it |

#### Pilgrim relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, warm amber glow`.

| ID | Prompt |
|---|---|
| worn-compass | an old brass compass with a broken needle |
| hobnail-boots | a pair of heavy hobnail boots caked in dust |
| prayer-beads | a long string of worn wooden prayer beads |
| road-map | a folded leather map tied with string |
| tin-cup | a dented tin drinking cup hanging from a cord |
| pilgrims-badge | a small lead pilgrim badge shaped like a scallop shell |
| saints-sandal | a single worn leather sandal with a faint halo |
| the-long-way-round | a coiled length of road-worn rope shaped into a spiral |
| drowned-lantern | an old lantern dripping water, its flame still lit |

#### Tollkeeper cards (`art-raw/cards/<id>.png`, 4:3)
Shared accent: **tarnished gold, black iron and lamp light**. Add to the style prompt: `tarnished gold and warm lamp light, coins and black iron`.

| ID | Prompt |
|---|---|
| collectors-blade | a short black iron sword lying across a pile of gold coins, lamp light glinting on the blade, no person |
| iron-ledger | a huge iron-bound ledger book held up like a shield |
| exact-payment | a single gold coin balanced on the edge of a sword blade |
| bribe-the-dark | a gloved hand offering a gold coin into deep shadow, eyes watching |
| shake-down | coins spilling out of an upturned purse, shadowy hands grabbing |
| hired-steel | a row of mercenary swords hanging on a wall with price tags |
| gilded-ward | an iron shield covered in flaking gold leaf |
| coin-toss | a gold coin spinning in the air above an open palm |
| counting-house | a dim room of stacked coins and ledgers lit by one lamp |
| collection | a collector with a lantern knocking on a row of dark doors |
| paid-guard | an armoured guard standing before a gate holding out a palm |
| small-change | a scatter of small copper coins on dark stone |
| interest | a pile of coins growing taller, a lamp beside it |
| bought-time | an hourglass filled with gold coins instead of sand |
| golden-hail | gold coins raining down from above like hail |
| blood-money | a single gold coin lying in a dark red pool |
| ransom | a chained figure behind a small gold coin on a scale |
| hostile-takeover | a great iron hand closing around a tower of coins |
| vault-dividend | a vault door opening onto shelves of gold, lamp light |
| debt-collector | a tall hooded collector with a ledger and a lantern |
| the-final-toll | a great bronze bell tolling above a gate, coins falling |
| golden-ward | a wall made of stacked gold coins |
| toll-of-ages | an ancient toll gate overgrown with roots, gold glimmering |
| bankrupt-the-dark | an empty treasure chest with the darkness pouring out of it |

#### Tollkeeper relics (`art-raw/relics/<id>.png`, 1:1, transparent)
Add to the negative prompt: `white background, grey background, studio backdrop, floor, table, shadow, pedestal, wall, paper, parchment`.
Add to the style prompt: `a single small object, centred, floating alone in total black darkness, black void around it, bold readable silhouette, nothing else in the frame, warm gold glow`.

| ID | Prompt |
|---|---|
| tollhouse-lantern | an iron lantern with a coin slot on top, gold flame inside |
| coin-purse | a small leather coin purse bulging with coins |
| brass-scales | a small set of brass weighing scales |
| ledger-of-debts | a small black ledger with gold clasps |
| weighted-dice | a pair of ivory dice with gold pips |
| gilded-hand | a mummified hand covered in gold leaf |
| golden-key | an ornate golden key with a coin-shaped bow |
| the-last-coin | a single worn gold coin on a chain |
| drowned-coin | a tarnished gold coin crusted with barnacles, dripping water |

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
| floor-2 | a drowned flooded vault deep underground, still black water covering the floor, broken stone arches half submerged, faint deep blue light from below the water |
| stairs | a narrow spiral stone staircase descending into black water far below, a shattered iron lock gate at the top, cold blue light rising from the depths |

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
