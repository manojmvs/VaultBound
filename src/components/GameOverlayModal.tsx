import React from 'react';
import { ArrowRight, Home, Play, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { LEVELS } from '../game/levels';
import { GamePhase } from '../game/types';

interface GameOverlayModalProps {
  phase: GamePhase;
  levelId: number;
  summary: {
    score: number;
    elapsedSeconds: number;
    kills: number;
    totalBots: number;
    coinsCollected: number;
    totalCoins: number;
    accuracy: number;
  } | null;
  onResume: () => void;
  onRetry: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
}

export const GameOverlayModal: React.FC<GameOverlayModalProps> = ({
  phase,
  levelId,
  summary,
  onResume,
  onRetry,
  onNextLevel,
  onReturnTitle,
}) => {
  if (
    phase === 'playing' ||
    phase === 'intro' ||
    phase === 'level_select' ||
    phase === 'level_briefing'
  ) {
    return null;
  }

  const levelDef = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const hasNextLevel = levelId < LEVELS.length;
  const isGameOver = phase === 'game_over';

  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center safe-modal-inset overflow-y-auto scroll-touch ${
        isGameOver ? 'bg-slate-950' : 'bg-slate-950/85 backdrop-blur-sm'
      }`}
    >
      <motion.div
        key={phase}
        initial={isGameOver ? { opacity: 0, scale: 0.95, y: 12 } : { opacity: 0.9, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className={`w-full ${
          phase === 'paused' ? 'max-w-md' : 'max-w-lg'
        } rounded-2xl border border-white/12 bg-slate-900/95 backdrop-blur-md p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 text-center my-auto`}
      >
        {phase === 'paused' && (
          <>
            <div>
              <div className="text-xs font-semibold tracking-wider text-sky-400">
                Level {levelDef.id}/{LEVELS.length} · {levelDef.theme.name}
              </div>
              <h2 className="font-display text-2xl font-bold text-white mt-1">Game Paused</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Level
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Home className="w-4 h-4" />
                Level Select
              </button>
            </div>
          </>
        )}

        {(phase === 'level_complete' || phase === 'victory') && summary && (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.22)]">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold tracking-wider text-emerald-400">
                {phase === 'victory'
                  ? `All ${LEVELS.length} Vaults Conquered`
                  : `Level ${levelDef.id} Complete · Level ${levelDef.id + 1} Unlocked`}
              </div>
              <h2 className="font-display text-2xl font-bold text-white">
                {phase === 'victory' ? 'Master of the 30 Vaults' : levelDef.theme.jewelleryName}
              </h2>
              <p className="text-xs text-slate-300">
                {phase === 'victory'
                  ? `Every vault cleared across all ${LEVELS.length} levels.`
                  : `Level ${levelDef.id + 1} is now unlocked on the Level Screen.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-slate-950/75 p-3.5 text-left">
              <div>
                <div className="text-[11px] text-slate-400">Coins Collected</div>
                <div className="font-mono-num text-lg font-bold text-amber-300">
                  {summary.coinsCollected}/{summary.totalCoins}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Clear Time</div>
                <div className="font-mono-num text-lg font-bold text-sky-300">
                  {summary.elapsedSeconds.toFixed(1)}s
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Bots Destroyed</div>
                <div className="font-mono-num text-base font-bold text-white">
                  {summary.kills}/{summary.totalBots}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Score · Accuracy</div>
                <div className="font-mono-num text-base font-bold text-emerald-300">
                  {summary.score} · {summary.accuracy}%
                </div>
              </div>
            </div>

            <div className={`grid ${hasNextLevel ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-2.5`}>
              {hasNextLevel && (
                <button
                  type="button"
                  onClick={onNextLevel}
                  className="w-full py-3 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
                >
                  Next Level
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                Replay
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-3 px-2.5 sm:px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Home className="w-4 h-4 shrink-0" />
                Levels
              </button>
            </div>
          </>
        )}

        {phase === 'game_over' && (
          <>
            <div>
              <div className="text-xs font-semibold tracking-wider text-rose-400">
                Level {levelDef.id} · {levelDef.theme.name}
              </div>
              <h2 className="font-display text-2xl font-bold text-white mt-1">
                Vault Defense Triggered
              </h2>
              <p className="text-xs text-slate-300 mt-1.5">
                Use crates for cover during bot bursts, watch for health packs, and strike while their chest shutter recharges.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                Retry Level {levelId}
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-3 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Home className="w-4 h-4 shrink-0" />
                Level Select
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
