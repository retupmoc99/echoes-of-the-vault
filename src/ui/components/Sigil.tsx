/**
 * Code-drawn enemy sigil: an outer polygon, an inner counter-rotating shape,
 * orbit rings and a pulsing core. Every enemy's SigilSpec makes it distinct.
 */
import type { SigilSpec } from '../../engine';

function polygon(sides: number, r: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
}

function Shape({ sides, r }: { sides: number; r: number }) {
  return sides < 3 ? <circle r={r} /> : <polygon points={polygon(sides, r)} />;
}

export function Sigil({ spec, size }: { spec: SigilSpec; size: number }) {
  const color = `hsl(${spec.hue} 95% 64%)`;
  const dim = `hsl(${spec.hue} 80% 45%)`;
  const dur = (s: number) => `${Math.abs(s)}s`;
  const dir = (s: number) => (s < 0 ? 'reverse' : 'normal');

  return (
    <svg
      className="sigil"
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ ['--sigil-color' as string]: color }}
      aria-hidden
    >
      <g fill="none" stroke={color} strokeLinejoin="round">
        {Array.from({ length: spec.rings }, (_, i) => (
          <circle
            key={i}
            className="spin"
            r={88 - i * 7}
            stroke={dim}
            strokeWidth={1}
            strokeDasharray={`${4 + i * 3} ${9 + i * 4}`}
            style={{ animationDuration: dur(spec.spin * (1.6 + i)), animationDirection: dir(-spec.spin) }}
          />
        ))}
        <g className="spin" style={{ animationDuration: dur(spec.spin), animationDirection: dir(spec.spin) }} strokeWidth={2.5}>
          <Shape sides={spec.sides} r={70} />
        </g>
        {spec.innerSides > 0 && (
          <g className="spin" style={{ animationDuration: dur(spec.spin * 0.6), animationDirection: dir(-spec.spin) }} strokeWidth={1.6}>
            <Shape sides={spec.innerSides} r={36} />
          </g>
        )}
      </g>
      <circle className="sigil-core" r={9} fill={color} />
    </svg>
  );
}
