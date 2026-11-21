/** "3h 12m", "45m", "under a minute". */
export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return 'under a minute';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

/** "~4.5h" style estimate for hours of work left. */
export function formatHours(hours: number): string {
  if (!isFinite(hours)) return '∞';
  if (hours < 1) return `~${Math.max(1, Math.round(hours * 60))}m`;
  return `~${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
}

/** "just now", "12m ago", "5h ago", "3 days ago". */
export function formatAgo(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
