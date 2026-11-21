import { useEffect, useState } from 'react';
import { setHapticsEnabled } from './fx/haptics';
import { setVolumes, unlockAudio } from './audio/core';
import { refreshMusic } from './audio/music';
import { playSfx } from './audio/sfx';
import { onFx } from './fx/fxBus';
import { useGame } from '../store/useGame';
import { AwayReport } from './components/AwayReport';
import { Toasts } from './components/Toasts';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ParticleLayer } from './fx/ParticleLayer';
import { HintsProvider } from './hints';
import { OutpostScreen } from './screens/OutpostScreen';
import { RunView } from './screens/RunView';
import { useUiScale } from './uiScale';

export function App() {
  const game = useGame();
  const scale = useUiScale();
  // Defaults guard saves without these fields (only dev saves; v7 adds them).
  const sound = game.save.settings.sound ?? 0.65;
  const music = game.save.settings.music ?? 0.35;
  useEffect(() => setHapticsEnabled(game.save.settings.haptics), [game.save.settings.haptics]);
  useEffect(() => {
    setVolumes(sound, music);
    refreshMusic();
  }, [sound, music]);
  useEffect(() => {
    // Browsers only allow audio after a tap; the first one starts it.
    window.addEventListener('pointerdown', unlockAudio);
    const unsubscribe = onFx(playSfx);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      unsubscribe();
    };
  }, []);
  // Resume straight into a loop in progress; otherwise open at the Outpost.
  const [view, setView] = useState<'outpost' | 'run'>(() => (game.run && game.run.phase !== 'ended' ? 'run' : 'outpost'));

  const screen =
    view === 'run' && game.run ? (
      <RunView
        run={game.run}
        error={game.error}
        dispatch={game.dispatch}
        onMenu={() => setView('outpost')}
        onLoopDone={() => {
          game.finishLoop();
          setView('outpost');
        }}
      />
    ) : (
      <OutpostScreen
        save={game.save}
        error={game.error}
        notice={game.notice}
        outpost={game.outpost}
        onSettings={game.updateSettings}
        backup={{ lastBackupAt: game.lastBackupAt, exportCode: game.exportCode, importCode: game.importCode }}
        onEnterRun={() => setView('run')}
        onAbandon={() => {
          game.dispatch({ type: 'abandon' });
          setView('run');
        }}
      />
    );

  const { hints, hintsSeen } = game.save.settings;
  const hintsApi = {
    enabled: hints,
    seen: hintsSeen,
    dismiss: (id: string) => game.updateSettings({ hintsSeen: [...hintsSeen, id] }),
  };

  return (
    <HintsProvider value={hintsApi}>
      <ParticleLayer />
      {/* Everything but the particles scales up on wide screens (see uiScale.ts). */}
      <div className="ui-scale" style={scale === 1 ? undefined : { zoom: scale }}>
        {screen}
        <Toasts items={game.notices} onDismiss={game.dismissNotice} />
        {game.awayReport && <AwayReport report={game.awayReport} onClose={game.dismissAwayReport} />}
        <UpdatePrompt />
      </div>
    </HintsProvider>
  );
}
