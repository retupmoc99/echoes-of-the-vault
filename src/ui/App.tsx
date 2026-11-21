import { useEffect, useState } from 'react';
import { setHapticsEnabled } from './fx/haptics';
import { useGame } from '../store/useGame';
import { AwayReport } from './components/AwayReport';
import { Toasts } from './components/Toasts';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ParticleLayer } from './fx/ParticleLayer';
import { OutpostScreen } from './screens/OutpostScreen';
import { RunView } from './screens/RunView';

export function App() {
  const game = useGame();
  useEffect(() => setHapticsEnabled(game.save.settings.haptics), [game.save.settings.haptics]);
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
        onEnterRun={() => setView('run')}
        onAbandon={() => {
          game.dispatch({ type: 'abandon' });
          setView('run');
        }}
      />
    );

  return (
    <>
      <ParticleLayer />
      {screen}
      <Toasts items={game.notices} onDismiss={game.dismissNotice} />
      {game.awayReport && <AwayReport report={game.awayReport} onClose={game.dismissAwayReport} />}
      <UpdatePrompt />
    </>
  );
}
