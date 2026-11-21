/**
 * Audio core: one AudioContext, two volume buses (effects, music) and a
 * couple of synth primitives. Everything is generated in code, so there are
 * no sound files to download or cache.
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * on the first tap (unlockAudio). It's suspended while the app is hidden.
 * On iOS the audio session is set to "ambient": the game respects the silent
 * switch and mixes with whatever else is playing.
 */

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let volumes = { sound: 0.65, music: 0.35 };
const unlockListeners = new Set<() => void>();

export function audioContext(): AudioContext | null {
  return ctx && ctx.state === 'running' ? ctx : null;
}
export function buses() {
  return { sfx: sfxBus!, music: musicBus! };
}
export function musicVolume(): number {
  return volumes.music;
}

/** Called on user gestures until audio is running. Safe to call repeatedly. */
export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'ambient';
    ctx = new AC();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(ctx.destination);
    musicBus.connect(ctx.destination);
    applyVolumes();
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
  }
  // A context made during a tap usually starts running at once; otherwise
  // resume it. Either way, tell listeners (the music) once it's running.
  if (ctx.state === 'running') notifyUnlocked();
  else if (!document.hidden) void ctx.resume().then(notifyUnlocked);
}

let notified = false;
function notifyUnlocked(): void {
  if (notified || ctx?.state !== 'running') return;
  notified = true;
  unlockListeners.forEach((l) => l());
}

/** Runs once audio is actually running (used to start the music). */
export function onAudioUnlocked(listener: () => void): () => void {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
}

export function setVolumes(sound: number, music: number): void {
  volumes = { sound, music };
  applyVolumes();
}

function applyVolumes(): void {
  if (!ctx || !sfxBus || !musicBus) return;
  // Squared, so the low settings are properly quiet (hearing is logarithmic).
  sfxBus.gain.setTargetAtTime(volumes.sound ** 2 * 0.9, ctx.currentTime, 0.05);
  musicBus.gain.setTargetAtTime(volumes.music ** 2 * 0.6, ctx.currentTime, 0.3);
}

// ─────────────── Synth primitives ───────────────

interface ToneOpts {
  freq: number;
  /** Glide to this frequency over the note. */
  to?: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
  /** Seconds from now. */
  at?: number;
  /** Optional low-pass cutoff. */
  lowpass?: number;
  bus?: 'sfx' | 'music';
}

/** One enveloped oscillator note. */
export function tone({ freq, to, type = 'sine', gain = 0.2, attack = 0.005, decay = 0.2, at = 0, lowpass, bus = 'sfx' }: ToneOpts): void {
  const c = audioContext();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + attack + decay);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  let node: AudioNode = osc;
  if (lowpass) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    osc.connect(f);
    node = f;
  }
  node.connect(env).connect(bus === 'sfx' ? sfxBus! : musicBus!);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

interface NoiseOpts {
  gain?: number;
  attack?: number;
  decay?: number;
  at?: number;
  filter?: BiquadFilterType;
  freq?: number;
  /** Sweep the filter to this frequency. */
  to?: number;
  q?: number;
}

/** A burst of filtered white noise: impacts, swishes, cracks. */
export function noise({ gain = 0.2, attack = 0.003, decay = 0.15, at = 0, filter = 'lowpass', freq = 1200, to, q = 1 }: NoiseOpts): void {
  const c = audioContext();
  if (!c) return;
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  src.connect(f).connect(env).connect(sfxBus!);
  src.start(t, Math.random() * 0.5);
  src.stop(t + attack + decay + 0.05);
}
