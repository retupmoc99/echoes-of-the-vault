/**
 * A light canvas layer behind the UI: slow ambient motes, plus bursts when
 * the engine reports hits, Ward, deaths and Overloads.
 *
 * Bursts find their position from DOM elements tagged `data-fx-id`
 * (enemies use their uid, the player strip uses "player").
 * Respects prefers-reduced-motion and pauses while the tab is hidden.
 */
import { useEffect, useRef } from 'react';
import type { CombatEvent } from '../../engine';
import { onFx } from './fxBus';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  ambient: boolean;
}

const AMBIENT_COUNT = 26;
const MAX_PARTICLES = 260;

function centerOf(fxId: string): { x: number; y: number } | null {
  const el = document.querySelector(`[data-fx-id="${fxId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const particles: Particle[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnAmbient = (anywhere: boolean): Particle => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      vx: (Math.random() - 0.5) * 6,
      vy: -(4 + Math.random() * 10),
      life: 0,
      maxLife: 8 + Math.random() * 10,
      size: 0.6 + Math.random() * 1.6,
      hue: Math.random() < 0.7 ? 270 : 195,
      ambient: true,
    });
    if (!reduced) for (let i = 0; i < AMBIENT_COUNT; i++) particles.push(spawnAmbient(true));

    const burst = (at: { x: number; y: number } | null, hue: number, count: number, speed = 140) => {
      if (!at || reduced) return;
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.3 + Math.random() * 0.9);
        particles.push({
          x: at.x,
          y: at.y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 0,
          maxLife: 0.4 + Math.random() * 0.5,
          size: 1 + Math.random() * 2.4,
          hue: hue + (Math.random() - 0.5) * 30,
          ambient: false,
        });
      }
    };

    const onEvent = (e: CombatEvent) => {
      switch (e.type) {
        case 'attack':
          if (e.amount > e.blocked) burst(centerOf(e.targetId), e.targetId === 'player' ? 355 : 18, 16);
          else burst(centerOf(e.targetId), 190, 8, 80);
          return;
        case 'hpLoss':
          burst(centerOf(e.targetId), 340, 8, 70);
          return;
        case 'ward':
          burst(centerOf(e.targetId), 190, 10, 60);
          return;
        case 'death':
          if (e.targetId !== 'player') burst(centerOf(e.targetId), 275, 46, 220);
          return;
        case 'relicOverload':
          burst(centerOf(`relic-${e.relicId}`) ?? centerOf('player'), 42, 18, 120);
          return;
        case 'relicCracked':
          burst(centerOf(`relic-${e.relicId}`) ?? centerOf('player'), 15, 26, 160);
          return;
        case 'delayFired':
          burst((e.targetId && centerOf(e.targetId)) || centerOf('player'), 165, 28, 180);
          return;
        case 'paradoxSnap':
          burst(centerOf('player'), 165, 40, 240);
          return;
        case 'phaseChange':
          // A boss changes phase: a large magenta flare around it.
          burst(centerOf(e.enemyId), 320, 60, 260);
          return;
        case 'echoReturned':
        case 'rewound':
          burst(centerOf('player'), 175, 10, 70);
          return;
      }
    };
    const unsubscribe = onFx(onEvent);

    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife || p.y < -20) {
          if (p.ambient) particles[i] = spawnAmbient(false);
          else particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (!p.ambient) {
          p.vx *= 0.92;
          p.vy = p.vy * 0.92 + 30 * dt; // a little gravity
        }
        const t = p.life / p.maxLife;
        const alpha = p.ambient ? Math.sin(t * Math.PI) * 0.45 : (1 - t) * 0.9;
        ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === 'visible') {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles" aria-hidden />;
}
