import { CONTENT } from '../../data';
import { describeRelic, maxStrain, type RelicState } from '../../engine';
import { ArtImg, artUrl } from '../art';

interface Props {
  relics: RelicState[];
  /** Extra Strain allowed this fight (Vault Shift). */
  strainBonus?: number;
  onInspect: (t: string) => void;
}

export function RelicBar({ relics, strainBonus = 0, onInspect }: Props) {
  return (
    <div className="relics">
      {relics.map((r) => {
        const def = CONTENT.relics[r.relicId];
        const max = maxStrain(def, strainBonus);
        const text = describeRelic(def);
        const lines = [
          def.name + (r.cracked ? ' (cracked)' : ''),
          text.passive,
          text.overload && `Overload: ${text.overload}`,
          text.overload && `Strain ${r.strain}/${max}.`,
        ];
        return (
          <button
            key={r.relicId}
            data-fx-id={`relic-${r.relicId}`}
            className={`relic ${r.cracked ? 'cracked' : ''}`}
            onClick={() => onInspect(lines.filter(Boolean).join(' '))}
          >
            <ArtImg src={artUrl('relics', def.id, def.image)} className="relic-art" fallback={<span className="relic-glyph">{def.name[0]}</span>} />
            {def.overload && (
              <span className="strain">
                {Array.from({ length: max }, (_, i) => (
                  <i key={i} className={i < r.strain ? 'on' : ''} />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
