export function HpBar({ hp, maxHp, ward }: { hp: number; maxHp: number; ward: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="hpbar">
      <div className="hpbar-fill" style={{ width: `${pct}%` }} />
      <span className="hpbar-text">
        {hp}/{maxHp}
      </span>
      {ward > 0 && <span className="ward-badge">⬡ {ward}</span>}
    </div>
  );
}
