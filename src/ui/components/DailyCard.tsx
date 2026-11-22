/**
 * The Daily Descent card on the Descend tab: today's Omen and Shift, one
 * try a day, then the result with a Share button.
 */
import { useMemo, useState } from 'react';
import { CONTENT } from '../../data';
import { createRun, dailyPlayed, dailySetup, dayKey, omenForDay, type SaveData } from '../../engine';
import { dailyShareText, shareText } from '../share';

interface Props {
  save: SaveData;
  onStart: () => void;
}

export function DailyCard({ save, onStart }: Props) {
  const day = dayKey(Date.now());
  const omen = omenForDay(day, CONTENT);
  const played = dailyPlayed(save, day);
  const warden = CONTENT.classes[save.outpost.classId];
  // Today's Shift comes from the date, so build the day's loop once to read it.
  // (It depends only on the day: the Shift is rolled before anything player-specific.)
  const shiftId = useMemo(() => createRun(dailySetup(save, day, CONTENT), CONTENT).vaultShiftId, [day]);
  const shift = CONTENT.vaultShifts[shiftId];
  const last = save.daily.last?.day === day ? save.daily.last : undefined;
  const [shareNote, setShareNote] = useState('');

  const share = async () => {
    if (!last) return;
    const outcome = await shareText(dailyShareText(last));
    setShareNote(outcome === 'copied' ? 'Copied.' : outcome === 'failed' ? 'Not shared.' : '');
  };

  return (
    <div className={`daily-card ${played ? 'played' : ''}`}>
      <div className="daily-head">
        <strong>☀ Daily Descent</strong>
        <span>{day}</span>
      </div>
      <p className="daily-omen">
        <b>{omen.name}.</b> {omen.text}
      </p>
      <p className="daily-shift">◈ {shift.name}</p>
      {played ? (
        <>
          <p className="daily-result">
            {last ? `Done today: ${last.result === 'victory' ? 'escaped' : `fell at depth ${last.depth} of ${last.rows}`}, +${last.shards} Shards.` : 'Done today.'} A new dream
            tomorrow.
          </p>
          {last && (
            <button className="ghost-btn wide" onClick={share}>
              Share today’s result{shareNote && ` · ${shareNote}`}
            </button>
          )}
        </>
      ) : (
        <button className="primary-btn wide" onClick={onStart}>
          Descend as the {warden.name}
        </button>
      )}
      <p className="daily-note">
        Same vault for everyone today. One try. Standard kit, every card. No Echo, and the Sleeper doesn’t stir. Days played: {save.daily.daysPlayed}
      </p>
    </div>
  );
}
