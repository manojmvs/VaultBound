import React from 'react';
import { SWITCH_HEX } from '../game/models';
import { MinimapData } from '../game/types';

interface MinimapProps {
  data: MinimapData;
}

const StaticMinimapGrid = React.memo<{ grid: string[]; cell: number }>(({ grid, cell }) => {
  return (
    <>
      {grid.map((row, gz) =>
        row.split('').map((ch, gx) => {
          if (ch === '#') {
            return (
              <rect
                key={`${gx}_${gz}`}
                x={gx * cell}
                y={gz * cell}
                width={cell}
                height={cell}
                fill="#334155"
              />
            );
          }
          if (ch === 'C') {
            return (
              <rect
                key={`${gx}_${gz}`}
                x={gx * cell + cell * 0.16}
                y={gz * cell + cell * 0.16}
                width={cell * 0.68}
                height={cell * 0.68}
                fill="#b45309"
                rx={1}
              />
            );
          }
          return null;
        }),
      )}
    </>
  );
});

export const Minimap: React.FC<MinimapProps> = ({ data }) => {
  const cell = Math.max(4.5, Math.min(7, 118 / Math.max(data.cols, data.rows)));
  const width = data.cols * cell;
  const height = data.rows * cell;

  const px = data.playerX * cell;
  const pz = data.playerZ * cell;
  const deg = (-data.playerYaw * 180) / Math.PI;

  return (
    <div
      className="rounded-xl border border-white/12 bg-slate-950/82 backdrop-blur-md p-1.5 shadow-xl pointer-events-none [@media(max-height:430px)]:scale-90 [@media(max-height:430px)]:origin-top-right"
      aria-label="Vault Radar"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block rounded-lg"
      >
        <rect x={0} y={0} width={width} height={height} fill="#09101d" />
        <StaticMinimapGrid grid={data.grid} cell={cell} />

        {/* Doors */}
        {data.doors.map((d, i) => (
          <rect
            key={`d_${i}`}
            x={(d.x - 0.5) * cell + 0.5}
            y={(d.z - 0.5) * cell + 0.5}
            width={Math.max(2, cell - 1)}
            height={Math.max(2, cell - 1)}
            fill={
              d.unlocked
                ? '#22c55e'
                : d.kind === 'trophy'
                  ? '#facc15'
                  : d.kind === 'bounty'
                    ? '#f43f5e'
                    : d.color
                      ? SWITCH_HEX[d.color]
                      : '#f59e0b'
            }
            opacity={d.unlocked ? 0.35 : 0.95}
          />
        ))}

        {/* Switches */}
        {data.switches.map((s, i) => (
          <circle
            key={`s_${i}`}
            cx={s.x * cell}
            cy={s.z * cell}
            r={Math.max(1.8, cell * 0.33)}
            fill={s.activated ? '#22c55e' : SWITCH_HEX[s.color]}
          />
        ))}

        {/* Uncollected Health Packs (Medkits) */}
        {(data.medkits || [])
          .filter((m) => !m.collected)
          .map((m, i) => {
            const cx = m.x * cell;
            const cz = m.z * cell;
            const boxSize = Math.max(3.6, cell * 0.68);
            const arm = Math.max(1.5, cell * 0.27);
            const thick = Math.max(1, cell * 0.14);
            return (
              <g key={`m_${i}`}>
                <rect
                  x={cx - boxSize / 2}
                  y={cz - boxSize / 2}
                  width={boxSize}
                  height={boxSize}
                  fill="#f8fafc"
                  rx={0.7}
                />
                <rect
                  x={cx - arm}
                  y={cz - thick / 2}
                  width={arm * 2}
                  height={thick}
                  fill="#ef4444"
                  rx={0.35}
                />
                <rect
                  x={cx - thick / 2}
                  y={cz - arm}
                  width={thick}
                  height={arm * 2}
                  fill="#ef4444"
                  rx={0.35}
                />
              </g>
            );
          })}

        {/* Uncollected Bullet Packs */}
        {data.packs
          .filter((p) => !p.collected)
          .map((p, i) => (
            <rect
              key={`p_${i}`}
              x={p.x * cell - cell * 0.22}
              y={p.z * cell - cell * 0.22}
              width={cell * 0.44}
              height={cell * 0.44}
              fill="#38bdf8"
              rx={0.6}
            />
          ))}

        {/* Uncollected Special Gun Pickups */}
        {data.guns
          .filter((g) => !g.collected)
          .map((g, i) => (
            <polygon
              key={`g_${i}`}
              points={`${g.x * cell},${g.z * cell - cell * 0.36} ${g.x * cell + cell * 0.36},${g.z * cell} ${g.x * cell},${g.z * cell + cell * 0.36} ${g.x * cell - cell * 0.36},${g.z * cell}`}
              fill="#f97316"
              stroke="#fef08a"
              strokeWidth={0.7}
            />
          ))}

        {/* Uncollected Coins */}
        {data.coins
          .filter((c) => !c.collected)
          .map((c, i) => (
            <circle
              key={`c_${i}`}
              cx={c.x * cell}
              cy={c.z * cell}
              r={Math.max(1.3, cell * 0.24)}
              fill="#fbbf24"
            />
          ))}

        {/* Alive Bots */}
        {data.enemies
          .filter((e) => e.alive)
          .map((e, i) => (
            <circle
              key={`e_${i}`}
              cx={e.x * cell}
              cy={e.z * cell}
              r={Math.max(1.7, cell * 0.3)}
              fill="#ef4444"
            />
          ))}

        {/* Golden Trophy Navigation Path (when all tasks are complete) */}
        {!data.treasure.collected && data.trophyPath && data.trophyPath.length >= 2 && (
          <polyline
            points={data.trophyPath.map((pt) => `${pt.x * cell},${pt.z * cell}`).join(' ')}
            fill="none"
            stroke="#facc15"
            strokeWidth={Math.max(1.4, cell * 0.25)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${cell * 0.45} ${cell * 0.35}`}
            opacity={0.95}
          />
        )}

        {/* Final Jewellery */}
        {!data.treasure.collected && (
          <g>
            {data.trophyPath && data.trophyPath.length > 0 && (
              <circle
                cx={data.treasure.x * cell}
                cy={data.treasure.z * cell}
                r={cell * 0.72}
                fill="none"
                stroke="#facc15"
                strokeWidth={0.9}
                opacity={0.75}
              />
            )}
            <polygon
              points={`${data.treasure.x * cell},${data.treasure.z * cell - cell * 0.46} ${data.treasure.x * cell + cell * 0.44},${data.treasure.z * cell} ${data.treasure.x * cell},${data.treasure.z * cell + cell * 0.46} ${data.treasure.x * cell - cell * 0.44},${data.treasure.z * cell}`}
              fill="#facc15"
            />
          </g>
        )}

        {/* Player Sight Cone & Direction Arrow */}
        <g transform={`translate(${px}, ${pz}) rotate(${deg})`}>
          <polygon
            points="0,0 -7,-13 7,-13"
            fill="#38bdf8"
            opacity={0.18}
          />
          <polygon points="0,-3.8 2.8,2.8 0,1.3 -2.8,2.8" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
};
