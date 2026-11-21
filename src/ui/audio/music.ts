/**
 * Ambient music: a slow drone plus sparse bell notes, never a melody.
 * Each screen (and each Vault Shift) sets a mood: a root note and a colour.
 * Changing mood crossfades over a few seconds. Fights add a slow low pulse.
 */
import { audioContext, buses, musicVolume, onAudioUnlocked } from './core';

interface Mood {
  root: number;
  /** Low-pass cutoff: higher is brighter. */
  bright: number;
}

const MOODS: Record<string, Mood> = {
  outpost: { root: 55, bright: 700 }, // A1: cold, open
  vault: { root: 49, bright: 500 }, // G1
  combat: { root: 41.2, bright: 650 }, // E1
  'shift-drowned-halls': { root: 46.25, bright: 380 },
  'shift-choir-awake': { root: 58.27, bright: 1100 },
  'shift-fractured-sky': { root: 61.74, bright: 1400 },
  'shift-restless-engines': { root: 43.65, bright: 800 },
  'shift-hollow-bargain': { root: 51.91, bright: 450 },
};
/** Minor pentatonic, as ratios of the root, for the bell notes. */
const SCALE = [1, 6 / 5, 4 / 3, 3 / 2, 9 / 5, 2];

interface Voice {
  gain: GainNode;
  stop: () => void;
}

let current: { key: string; combat: boolean } | null = null;
let voice: Voice | null = null;
let bellTimer: number | undefined;
let pulseTimer: number | undefined;

/** Screens call this with their background keys, e.g. ['shift-drowned-halls', 'combat']. */
export function setMusicMood(keys: string[]): void {
  const key = keys.find((k) => MOODS[k]) ?? 'vault';
  const combat = keys.includes('combat');
  if (current?.key === key && current.combat === combat) return;
  current = { key, combat };
  restart();
}

/** Start or stop the music when its volume crosses zero. */
export function refreshMusic(): void {
  if (musicVolume() === 0) stopAll();
  else if (!voice) restart();
}

onAudioUnlocked(() => restart());

function restart(): void {
  const c = audioContext();
  if (!c || !current || musicVolume() === 0) return;
  const mood = MOODS[current.key];
  const old = voice;
  voice = startDrone(c, mood);
  if (old) {
    old.gain.gain.setTargetAtTime(0, c.currentTime, 1.2);
    setTimeout(old.stop, 5000);
  }
  scheduleBells(mood);
  schedulePulse(current.combat ? mood : null);
}

function stopAll(): void {
  const c = audioContext();
  if (voice && c) {
    const v = voice;
    v.gain.gain.setTargetAtTime(0, c.currentTime, 0.4);
    setTimeout(v.stop, 2000);
  }
  voice = null;
  clearTimeout(bellTimer);
  clearInterval(pulseTimer);
}

/** Root + fifth + a detuned octave, through a slowly breathing low-pass. */
function startDrone(c: AudioContext, mood: Mood): Voice {
  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.setTargetAtTime(1, c.currentTime, 1.5);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = mood.bright;
  filter.Q.value = 0.7;
  filter.connect(out).connect(buses().music);

  const lfo = c.createOscillator();
  const lfoDepth = c.createGain();
  lfo.frequency.value = 0.06;
  lfoDepth.gain.value = mood.bright * 0.35;
  lfo.connect(lfoDepth).connect(filter.frequency);

  const parts: [number, OscillatorType, number, number][] = [
    [mood.root, 'sine', 0.5, 0],
    [mood.root * 1.5, 'triangle', 0.18, 3],
    [mood.root * 2, 'sawtooth', 0.08, -7],
    [mood.root * 2, 'sawtooth', 0.08, 7],
  ];
  const oscs = parts.map(([freq, type, gain, detune]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.value = gain;
    o.connect(g).connect(filter);
    o.start();
    return o;
  });
  lfo.start();
  return {
    gain: out,
    stop: () => {
      [...oscs, lfo].forEach((o) => o.stop());
      out.disconnect();
    },
  };
}

/** A soft bell note every 5–11 seconds, high above the drone. */
function scheduleBells(mood: Mood): void {
  clearTimeout(bellTimer);
  const ring = () => {
    const c = audioContext();
    if (c && voice) {
      const f = mood.root * 8 * SCALE[Math.floor(Math.random() * SCALE.length)];
      bell(c, f, 0.05);
      if (Math.random() < 0.35) bell(c, f * 1.5, 0.025, 0.6);
    }
    bellTimer = window.setTimeout(ring, 5000 + Math.random() * 6000);
  };
  bellTimer = window.setTimeout(ring, 2500);
}

function bell(c: AudioContext, freq: number, gain: number, delay = 0): void {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
  o.connect(g).connect(buses().music);
  o.start(t);
  o.stop(t + 3.6);
}

/** In fights: a low heartbeat every 2.4 seconds. */
function schedulePulse(mood: Mood | null): void {
  clearInterval(pulseTimer);
  if (!mood) return;
  pulseTimer = window.setInterval(() => {
    const c = audioContext();
    if (!c || !voice) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(mood.root * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(mood.root, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(buses().music);
    o.start(t);
    o.stop(t + 0.45);
  }, 2400);
}
