/**
 * The vault map. The start is at the bottom (near the thumb) and the boss at
 * the top. Tap a lit node to see what it is, then tap Enter, or tap the
 * node again.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { CONTENT } from '../../data';
import { NODE_INFO } from '../../data/nodeTypes';
import { reachableNodes, type MapNode, type RunAction, type RunState } from '../../engine';
import { backgroundFor } from '../art';
import { NodeIcon } from '../components/NodeIcon';
import { RunHeader } from '../components/RunHeader';

/** First words of a loop: which way the vault has shifted. */
function shiftIntro(run: RunState): string {
  const shift = CONTENT.vaultShifts[run.vaultShiftId];
  return `${shift.name}. ${shift.flavor} ${shift.text}`;
}

const ROW_H = 76;
const PAD = 44;

interface Props {
  run: RunState;
  error?: string;
  dispatch: (a: RunAction) => void;
  onMenu: () => void;
}

export function MapScreen({ run, error, dispatch, onMenu }: Props) {
  const { map } = run;
  const reachable = new Set(reachableNodes(map, run.position));
  const visited = new Set(run.visited);
  const [selected, setSelected] = useState<string>();
  const [info, setInfo] = useState<string>();
  const scroller = useRef<HTMLDivElement>(null);

  const height = PAD * 2 + map.rows * ROW_H;
  const yOf = (n: MapNode) => height - PAD - n.row * ROW_H;
  const currentRow = run.position ? map.nodes[run.position].row : -1;

  // Keep the next choice in view: scroll so the current row sits low on screen.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight - Math.max(0, currentRow - 1) * ROW_H;
  }, [currentRow]);

  const selectedNode = selected && reachable.has(selected) ? map.nodes[selected] : undefined;
  const enter = (id: string) => {
    setSelected(undefined);
    dispatch({ type: 'chooseNode', nodeId: id });
  };

  const tapNode = (node: MapNode) => {
    const meta = NODE_INFO[node.type];
    if (!reachable.has(node.id)) {
      setSelected(undefined);
      setInfo(`${meta.name}: ${meta.description}`);
      return;
    }
    if (selected === node.id) enter(node.id);
    else {
      setSelected(node.id);
      setInfo(undefined);
    }
  };

  const edgeClass = (from: MapNode, to: MapNode) => {
    if (visited.has(from.id) && visited.has(to.id)) return 'edge walked';
    if (from.id === run.position && reachable.has(to.id)) return 'edge open';
    if (run.position === null && from.row === 0) return 'edge';
    return from.row < currentRow ? 'edge past' : 'edge';
  };

  const bg = backgroundFor(`shift-${run.vaultShiftId}`, 'vault');

  return (
    <div className={`screen map-screen ${bg.className}`} style={bg.style}>
      <RunHeader run={run} onMenu={onMenu} onInspect={setInfo} />

      <div className="map-scroll" ref={scroller}>
        <div className="map" style={{ height }}>
          <svg className="map-edges" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
            {Object.values(map.nodes).flatMap((from) =>
              from.next.map((id) => {
                const to = map.nodes[id];
                return (
                  <line
                    key={`${from.id}-${id}`}
                    className={edgeClass(from, to)}
                    x1={from.x * 100}
                    y1={yOf(from)}
                    x2={to.x * 100}
                    y2={yOf(to)}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }),
            )}
          </svg>
          {Object.values(map.nodes).map((node) => {
            const state = visited.has(node.id)
              ? 'visited'
              : reachable.has(node.id)
                ? 'reachable'
                : node.row <= currentRow
                  ? 'lost'
                  : 'future';
            return (
              <button
                key={node.id}
                className={`map-node ${state} ${node.id === run.position ? 'current' : ''} ${node.id === selected ? 'selected' : ''} ${node.type === 'boss' ? 'boss' : ''}`}
                style={{ left: `${node.x * 100}%`, top: yOf(node), ['--hue' as string]: NODE_INFO[node.type].hue }}
                onClick={() => tapNode(node)}
                aria-label={NODE_INFO[node.type].name}
              >
                <NodeIcon type={node.type} size={node.type === 'boss' ? 32 : 22} />
              </button>
            );
          })}
        </div>
      </div>

      <footer className="map-foot">
        {selectedNode ? (
          <>
            <p className="info-line">
              <strong>{NODE_INFO[selectedNode.type].name}.</strong> {NODE_INFO[selectedNode.type].description}
            </p>
            <button className="primary-btn wide" onClick={() => enter(selectedNode.id)}>
              Enter
            </button>
          </>
        ) : (
          <p className="info-line">{error ?? info ?? (run.position === null ? shiftIntro(run) : 'Choose your path. The lit chambers are open to you.')}</p>
        )}
      </footer>
    </div>
  );
}
