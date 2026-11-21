/** Picks the right screen for where the player is in the loop. */
import { CONTENT } from '../../data';
import { NODE_INFO } from '../../data/nodeTypes';
import type { RunAction, RunState } from '../../engine';
import { CombatScreen } from './CombatScreen';
import { MapScreen } from './MapScreen';
import { CacheScreen, EventScreen, RewardScreen, RunEndScreen, ShrineScreen } from './NodeScreens';

interface Props {
  run: RunState;
  error?: string;
  dispatch: (a: RunAction) => void;
  onMenu: () => void;
  onLoopDone: () => void;
}

export function RunView({ run, error, dispatch, onMenu, onLoopDone }: Props) {
  if (run.phase === 'ended') return <RunEndScreen run={run} onDone={onLoopDone} />;

  const node = run.node;
  const common = { run, error, dispatch, onMenu };

  if (!node) return <MapScreen {...common} />;
  switch (node.kind) {
    case 'combat': {
      const mapNode = run.map.nodes[node.nodeId];
      return (
        <CombatScreen
          state={run.combat!}
          error={error}
          // At Awakening stage 5 the boss chamber holds the Sleeper, not the Lock.
          label={`Depth ${mapNode.row + 1} · ${node.encounterId === 'the-sleeper' ? 'The Sleeper' : NODE_INFO[mapNode.type].name}`}
          tier={CONTENT.encounters[node.encounterId].tier}
          dispatch={(action) => dispatch({ type: 'combat', action })}
          onMenu={onMenu}
          onContinue={() => dispatch({ type: 'leave' })}
          bgKeys={[`shift-${run.vaultShiftId}`, 'combat']}
        />
      );
    }
    case 'shrine':
      return <ShrineScreen {...common} />;
    case 'cache':
      return <CacheScreen {...common} />;
    case 'event':
      return <EventScreen {...common} />;
    case 'reward':
      return <RewardScreen {...common} />;
  }
}
