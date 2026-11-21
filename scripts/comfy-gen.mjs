/**
 * Generate art candidates with a local ComfyUI server.
 *
 *   npm run art:gen -- [ids...] [--folder cards|backgrounds|enemies|relics|ui] [--seeds 101,303] [--force]
 *
 * Prompts come straight from the tables in ART_GUIDE.md, so the guide stays
 * the single source. Each item gets one image per seed, written to
 * art-raw/_candidates/<folder>/<id>_<seed>.png. Copy the keeper to
 * art-raw/<folder>/<id>.png and run `npm run art`.
 *
 * Settings match "Tested setup" in ART_GUIDE.md. Point COMFY_URL at your
 * server (default http://127.0.0.1:8188). Model and LoRA names can be
 * overridden with COMFY_CKPT and COMFY_LORA (set COMFY_LORA= to skip it).
 * Existing candidates are skipped unless --force is passed.
 *
 * Enemies, relics and node icons are cut out with ComfyUI's built-in Remove
 * Background node, which needs a BiRefNet model in the background_removal
 * models folder (COMFY_BG_MODEL overrides the file name).
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API = process.env.COMFY_URL ?? 'http://127.0.0.1:8188';
const CKPT = process.env.COMFY_CKPT ?? 'sd_xl_base_1.0.safetensors';
const LORA = process.env.COMFY_LORA ?? 'LaxpeintXL-2.0.safetensors';
const LORA_STRENGTH = 0.45;

/**
 * Per-folder setup. `upscale` adds a second pass ("hires fix"): the latent
 * is enlarged and re-sampled at partial denoise, which adds real detail
 * using only built-in nodes (no upscaler model to download).
 */
const FOLDERS = {
  cards: { sections: ['#### Cards (', '#### Hour-Thief cards'], width: 1152, height: 864 },
  backgrounds: { sections: ['#### Backgrounds ('], width: 768, height: 1344, upscale: { by: 1.5, denoise: 0.45, steps: 20 } },
  // Sprites: generated on black, then cut out (see cutOut below).
  enemies: { sections: ['#### Enemies ('], width: 1024, height: 1024, cutout: true },
  relics: { sections: ['#### Relics (', '#### Hour-Thief relics'], width: 1024, height: 1024, cutout: true },
  ui: { sections: ['#### Node icons'], width: 1024, height: 1024, cutout: true },
};
const BG_REMOVAL_MODEL = process.env.COMFY_BG_MODEL ?? 'birefnet.safetensors';

// --- Arguments ---------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args.splice(i, 2)[1];
};
const folder = flag('--folder') ?? 'cards';
const setup = FOLDERS[folder];
if (!setup) throw new Error(`--folder must be one of: ${Object.keys(FOLDERS).join(', ')}`);
const seeds = (flag('--seeds') ?? '101,303').split(',').map(Number);
const force = args.includes('--force');
const wanted = args.filter((a) => !a.startsWith('--'));

// --- Read prompts from ART_GUIDE.md -----------------------------------------

const guide = await readFile('ART_GUIDE.md', 'utf8');
const sectionOf = (heading) => {
  const start = guide.indexOf(heading);
  if (start < 0) throw new Error(`ART_GUIDE.md has no section "${heading}"`);
  const end = guide.indexOf('\n#', start + heading.length);
  return guide.slice(start, end < 0 ? undefined : end);
};
// Table rows: | id | ... | prompt |  (the prompt is always the last cell).
const rows = (section) =>
  [...section.matchAll(/^\| ([a-z0-9-]+) \|(.+)\|$/gm)].map(([, id, rest]) => ({ id, prompt: rest.split('|').at(-1).trim() }));

// The first two fenced blocks under "## ComfyUI" are the style and negative prompts.
const comfy = guide.slice(guide.indexOf('## ComfyUI'));
const [STYLE, NEGATIVE] = [...comfy.matchAll(/```\n([^`]+?)\n```/g)].map((m) => m[1].trim());
if (!STYLE || !NEGATIVE) throw new Error('ART_GUIDE.md: style or negative prompt block not found under "## ComfyUI"');

// A section can add to the prompts with lines like
//   Add to the style prompt: `...`    Add to the negative prompt: `...`
const ITEMS = setup.sections.flatMap((heading) => {
  const section = sectionOf(heading);
  const extra = section.match(/Add to the style prompt: `([^`]+)`/)?.[1] ?? '';
  const extraNeg = section.match(/Add to the negative prompt[^:\n]*: `([^`]+)`/)?.[1] ?? '';
  return rows(section).map((r) => ({ ...r, extra, extraNeg }));
});
const unknown = wanted.filter((id) => !ITEMS.some((c) => c.id === id));
if (unknown.length) throw new Error(`Not in ART_GUIDE.md (${folder}): ${unknown.join(', ')}`);
const items = wanted.length ? ITEMS.filter((c) => wanted.includes(c.id)) : ITEMS;
const OUT = path.resolve('art-raw/_candidates', folder);

// --- ComfyUI -----------------------------------------------------------------

function graph(item, seed) {
  const g = { ckpt: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } } };
  let model = ['ckpt', 0];
  let clip = ['ckpt', 1];
  if (LORA) {
    g.lora = { class_type: 'LoraLoader', inputs: { model, clip, lora_name: LORA, strength_model: LORA_STRENGTH, strength_clip: LORA_STRENGTH } };
    model = ['lora', 0];
    clip = ['lora', 1];
  }
  // Subject first: with the style in front, SDXL ignores the subject.
  const text = [item.prompt, STYLE, item.extra].filter(Boolean).join(', ');
  const sampler = { model, positive: ['pos', 0], negative: ['neg', 0], seed, cfg: 6, sampler_name: 'dpmpp_2m', scheduler: 'karras' };
  Object.assign(g, {
    pos: { class_type: 'CLIPTextEncode', inputs: { clip, text } },
    neg: { class_type: 'CLIPTextEncode', inputs: { clip, text: [NEGATIVE, item.extraNeg].filter(Boolean).join(', ') } },
    lat: { class_type: 'EmptyLatentImage', inputs: { width: setup.width, height: setup.height, batch_size: 1 } },
    ks: { class_type: 'KSampler', inputs: { ...sampler, latent_image: ['lat', 0], steps: 30, denoise: 1 } },
  });
  let samples = ['ks', 0];
  if (setup.upscale) {
    const { by, denoise, steps } = setup.upscale;
    g.up = { class_type: 'LatentUpscaleBy', inputs: { samples, upscale_method: 'bislerp', scale_by: by } };
    g.ks2 = { class_type: 'KSampler', inputs: { ...sampler, latent_image: ['up', 0], steps, denoise } };
    samples = ['ks2', 0];
  }
  g.dec = { class_type: 'VAEDecode', inputs: { samples, vae: ['ckpt', 2] } };
  g.save = { class_type: 'SaveImage', inputs: { images: ['dec', 0], filename_prefix: `eotv/${folder}/${item.id}_${seed}` } };
  if (setup.cutout) {
    // ComfyUI's built-in BiRefNet node finds the subject; the mask is saved
    // as a second image and combined with the painting in cutOut().
    g.bgm = { class_type: 'LoadBackgroundRemovalModel', inputs: { bg_removal_name: BG_REMOVAL_MODEL } };
    g.rmbg = { class_type: 'RemoveBackground', inputs: { bg_removal_model: ['bgm', 0], image: ['dec', 0] } };
    g.maskimg = { class_type: 'MaskToImage', inputs: { mask: ['rmbg', 0] } };
    g.savemask = { class_type: 'SaveImage', inputs: { images: ['maskimg', 0], filename_prefix: `eotv/${folder}/${item.id}_${seed}_mask` } };
  }
  return g;
}

/**
 * Painting + subject mask → transparent PNG.
 *
 * alpha = max(feathered mask, glow). The mask keeps dark parts of the
 * subject solid (obsidian, black iron). The glow term keeps light that
 * spills past the subject's edge, as soft falloff instead of a hard cut-out
 * line. Glow counts only *coloured* light (chroma, so a grey or white
 * backdrop doesn't qualify) and only near the subject.
 */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
async function cutOut(paintingBuf, maskBuf) {
  const { data: rgb, info } = await sharp(paintingBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const maskImg = sharp(maskBuf).resize(info.width, info.height).greyscale();
  const mask = await maskImg.clone().blur(1.2).raw().toBuffer();
  // A wide blur of the mask: ~1 at the subject, fading to 0 about 30px away.
  const near = await maskImg.clone().blur(14).raw().toBuffer();
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    const r = rgb[p * 3], gr = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
    const chroma = (Math.max(r, gr, b) - Math.min(r, gr, b)) / 255;
    const glow = clamp01((chroma - 0.12) / 0.3) * clamp01((near[p] / 255) * 3);
    out[p * 4] = r;
    out[p * 4 + 1] = gr;
    out[p * 4 + 2] = b;
    out[p * 4 + 3] = Math.round(Math.max(mask[p] / 255, glow) * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function api(route, body) {
  const res = await fetch(`${API}${route}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(`${route}: ${res.status} ${await res.text()}`);
  return res;
}

try {
  await api('/system_stats');
} catch {
  throw new Error(`No ComfyUI server at ${API}. Start ComfyUI, or set COMFY_URL.`);
}

await mkdir(OUT, { recursive: true });
const jobs = items.flatMap((item) => seeds.map((seed) => ({ item, seed, file: path.join(OUT, `${item.id}_${seed}.png`) })));
const todo = jobs.filter((j) => force || !existsSync(j.file));
console.log(`${todo.length} ${folder} image(s) to make (${jobs.length - todo.length} already exist).`);

// Queue everything up front so the GPU never waits on this script.
for (const job of todo) job.promptId = (await (await api('/prompt', { prompt: graph(job.item, job.seed) })).json()).prompt_id;

const t0 = Date.now();
for (const [i, job] of todo.entries()) {
  for (;;) {
    const entry = (await (await api(`/history/${job.promptId}`)).json())[job.promptId];
    if (entry) {
      const fetchOutput = async (nodeId) => {
        const img = entry.outputs?.[nodeId]?.images?.[0];
        if (!img) throw new Error(`${job.item.id} ${job.seed} failed: ${JSON.stringify(entry.status)}`);
        const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder, type: img.type });
        return Buffer.from(await (await api(`/view?${q}`)).arrayBuffer());
      };
      const painting = await fetchOutput('save');
      await writeFile(job.file, setup.cutout ? await cutOut(painting, await fetchOutput('savemask')) : painting);
      console.log(`  [${i + 1}/${todo.length}] ${path.basename(job.file)}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
console.log(`Done. Candidates are in ${path.relative(process.cwd(), OUT)}.`);
