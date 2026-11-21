import React from 'react';
import { ArrowLeft, CheckCircle2, Lock, Play, Trophy } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { LevelProgressRecord } from '../game/types';

interface LevelSelectScreenProps {
  progress: Record<number, LevelProgressRecord>;
  onStartLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onStartLevel,
  onBack,
}) => {
  const completedCount = LEVELS.filter((l) => progress[l.id]?.completed).length;
  const highestUnlocked = LEVELS.reduce(
    (max, l) => (progress[l.id]?.unlocked || l.id === 1 ? Math.max(max, l.id) : max),
    1,
  );

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/92 backdrop-blur-sm safe-modal-inset overflow-hidden">
      <div className="w-full max-w-6xl [@media(max-height:540px)]:max-w-none h-full max-h-[96dvh] [@media(max-height:540px)]:max-h-full rounded-2xl [@media(max-height:540px)]:rounded-xl border border-white/12 bg-slate-900/95 shadow-2xl p-3 sm:p-5 flex flex-col gap-3">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label="Back to Intro"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-white leading-tight">
                Select Vault Level (1–{LEVELS.length})
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Clear each vault to unlock the next · Up to Level {highestUnlocked}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono-num font-bold text-emerald-400 whitespace-nowrap">
                {completedCount}/{LEVELS.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onStartLevel(highestUnlocked)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shadow-md focus-visible:outline-2 focus-visible:outline-white"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Continue Lv {highestUnlocked}
            </button>
          </div>
        </div>

        {/* 30-Level Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5 overflow-y-auto scroll-touch pr-1 pb-2">
          {LEVELS.map((lvl) => {
            const rec = progress[lvl.id];
            const unlocked = rec ? rec.unlocked : lvl.id === 1;
            const completed = Boolean(rec?.completed);
            const isCurrent = unlocked && !completed && lvl.id === highestUnlocked;

            return (
              <button
                key={lvl.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onStartLevel(lvl.id)}
                className={`group relative rounded-xl border p-2.5 sm:p-3 text-left transition-all flex flex-col justify-between gap-1.5 min-h-[88px] sm:min-h-[100px] focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  !unlocked
                    ? 'border-slate-800/80 bg-slate-950/55 text-slate-500 cursor-not-allowed opacity-65'
                    : completed
                      ? 'border-emerald-500/45 bg-slate-950/85 hover:border-emerald-400 hover:bg-slate-900 text-white cursor-pointer'
                      : isCurrent
                        ? 'border-amber-400/85 bg-slate-800/95 hover:bg-slate-800 hover:border-amber-300 text-white cursor-pointer shadow-[0_0_16px_rgba(245,158,11,0.18)]'
                        : 'border-white/15 bg-slate-800/80 hover:bg-slate-800 hover:border-amber-300/70 text-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{
                        backgroundColor: unlocked ? lvl.theme.wallAccent : '#475569',
                      }}
                    />
                    <span className="font-display text-sm font-bold">Lv {lvl.id}</span>
                  </span>

                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Play className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{lvl.theme.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {lvl.tutorialMode === 'coins'
                      ? `Coin Tutorial · ${lvl.totalCoins} Coins`
                      : lvl.tutorialMode === 'combat_ammo'
                        ? `1 Bot · Ammo Tutorial`
                        : Object.keys(lvl.botMix).length > 1
                          ? `${lvl.botCount} Mixed Bots · ${lvl.totalCoins} Coins`
                          : `${lvl.botCount} ${lvl.botCount === 1 ? 'Bot' : 'Bots'} · ${lvl.totalCoins} Coins`}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 gap-1">
                  {!unlocked ? (
                    <span className="text-slate-500">Locked</span>
                  ) : completed ? (
                    <>
                      <span className="font-mono-num text-emerald-400 font-semibold truncate">
                        {rec?.bestTime != null ? `${rec.bestTime.toFixed(1)}s` : 'Cleared'}
                      </span>
                      <span className="font-mono-num text-amber-300 shrink-0">
                        {rec?.bestScore || 0}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-300 font-semibold truncate">
                        {lvl.difficultyLabel}
                      </span>
                      <span className="text-amber-200 font-bold shrink-0">Play</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
