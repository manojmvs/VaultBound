import React from 'react';
import {
  ArrowLeft,
  Bot,
  Coins,
  Crosshair,
  LockKeyhole,
  Play,
  ShieldAlert,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LEVELS } from '../game/levels';
import { getBotStyleForLevel, SWITCH_HEX } from '../game/models';
import { SwitchColor } from '../game/types';

interface LevelBriefingModalProps {
  levelId: number;
  onStart: () => void;
  onBack: () => void;
}

const SWITCH_LABEL: Record<SwitchColor, string> = {
  amber: 'Amber',
  cyan: 'Cyan',
  violet: 'Violet',
};

export const LevelBriefingModal: React.FC<LevelBriefingModalProps> = ({
  levelId,
  onStart,
  onBack,
}) => {
  const levelDef = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const gridJoined = levelDef.grid.join('');
  const switches: SwitchColor[] = [];
  if (gridJoined.includes('a')) switches.push('amber');
  if (gridJoined.includes('b')) switches.push('cyan');
  if (gridJoined.includes('v')) switches.push('violet');

  const botStyle = getBotStyleForLevel(levelDef.id);
  const botClassName =
    botStyle === 'dreadnought'
      ? 'Heavy Dreadnoughts'
      : botStyle === 'enforcer'
        ? 'Armored Enforcers'
        : 'Sentinel Bots';
  const isArmoredTier = levelDef.id >= 18;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md safe-modal-inset overflow-hidden">
      <motion.div
        key={`briefing_${levelDef.id}`}
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-4xl max-h-full rounded-2xl border border-white/14 bg-slate-900/95 shadow-2xl p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3 overflow-hidden"
      >
        {/* Pinned Top Header */}
        <div className="flex items-center justify-between gap-2.5 border-b border-slate-800 pb-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-7 rounded-sm shrink-0"
              style={{ backgroundColor: levelDef.theme.wallAccent }}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold leading-none">
                <span className="font-mono-num text-amber-300 tracking-wide">
                  LEVEL {levelDef.id} / {LEVELS.length}
                </span>
                <span className="px-1.5 py-0.5 rounded-md border border-slate-700 bg-slate-800/90 text-[10px] text-slate-200">
                  {levelDef.difficultyLabel}
                </span>
              </div>
              <h2 className="font-display text-base sm:text-xl font-bold text-white truncate mt-0.5">
                {levelDef.theme.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-slate-300">
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono-num">Par {levelDef.parTimeSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Two-Column Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-touch pr-0.5">
          <div className="grid grid-cols-1 min-[540px]:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
            {/* Objective Card */}
            <div className="min-[540px]:col-span-5 rounded-xl border border-amber-400/30 bg-slate-950/80 p-2.5 sm:p-3 flex flex-col justify-between gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span>Level Objective</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-2">
                  <div className="text-[10px] text-slate-400">Target Vault Relic</div>
                  <div
                    className="font-display text-sm sm:text-base font-bold mt-0.5 leading-snug"
                    style={{ color: levelDef.theme.treasureColor }}
                  >
                    {levelDef.theme.jewelleryName}
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                  Unseal the inner sanctum doors, clear every guard and gold coin, and retrieve the{' '}
                  <span className="text-white font-semibold">{levelDef.theme.jewelleryName}</span>.
                </p>
              </div>

              {/* Tactical Intel Chips */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80 text-[10px] sm:text-[11px]">
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1.5">
                  <div className="text-slate-400">Enemy Force</div>
                  <div className="font-semibold text-rose-300 truncate">{botClassName}</div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1.5">
                  <div className="text-slate-400">
                    {levelDef.gunPickupCount > 0 ? 'Special Gun' : 'Primary Weapon'}
                  </div>
                  <div
                    className={`font-semibold truncate ${
                      levelDef.gunPickupCount > 0 ? 'text-amber-300' : 'text-sky-300'
                    }`}
                  >
                    {levelDef.gunPickupCount > 0
                      ? `${levelDef.gunPickupCount} Railguns (10x AP)`
                      : 'Pulse Blaster'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Checklist Card */}
            <div className="min-[540px]:col-span-7 rounded-xl border border-white/10 bg-slate-950/75 p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  <Crosshair className="w-3.5 h-3.5 shrink-0" />
                  <span>Tasks to Complete</span>
                </div>
                <span className="text-[11px] font-mono-num text-slate-400">4 Tasks</span>
              </div>

              <div className="space-y-1.5 text-[11px] sm:text-xs">
                {/* Task 1: Energy Switches */}
                <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white leading-tight">
                      Shoot {switches.length === 1 ? 'Vault Switch' : `${switches.length} Vault Switches`}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {switches.map((sw) => (
                        <span
                          key={sw}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-white/10 bg-slate-950 text-[10px] font-medium text-slate-200"
                        >
                          <span
                            className="w-2 h-2 rounded-xs"
                            style={{ backgroundColor: SWITCH_HEX[sw] }}
                          />
                          {SWITCH_LABEL[sw]} Gate
                        </span>
                      ))}
                      {levelDef.bountyKillsRequired > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-rose-500/35 bg-rose-950/40 text-[10px] font-medium text-rose-200">
                          <LockKeyhole className="w-2.5 h-2.5 text-rose-400" />
                          {levelDef.bountyKillsRequired}-Bot Bounty Gate
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task 2: Collect Coins */}
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Coins className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">Collect All Gold Coins</span>
                    <span className="font-mono-num font-bold text-amber-300 shrink-0">
                      {levelDef.totalCoins} Coins
                    </span>
                  </div>
                </div>

                {/* Task 3: Defeat Bots */}
                <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="w-5 h-5 rounded-md bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">Defeat All {botClassName}</span>
                      <span className="font-mono-num font-bold text-rose-300 shrink-0">
                        {levelDef.botCount} {levelDef.botCount === 1 ? 'Bot' : 'Bots'}
                      </span>
                    </div>
                    {isArmoredTier && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 mt-0.5">
                        <ShieldAlert className="w-3 h-3 shrink-0" />
                        <span>
                          Heavy armor resists default blaster — grab the 10-shot Railgun!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task 4: Unlock Trophy Door */}
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/25 p-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/45 flex items-center justify-center text-emerald-300 shrink-0">
                    <Trophy className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-emerald-200">
                      Enter the Final Trophy Door &amp; Claim the Relic
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Action Bar — Always 100% Visible */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Levels
          </button>
          <button
            type="button"
            onClick={onStart}
            className="flex-1 sm:flex-none sm:min-w-[220px] py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:via-amber-400 hover:to-orange-400 text-slate-950 font-display font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(245,158,11,0.35)] border border-yellow-200/75 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-white whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950 shrink-0" />
            Start Level {levelDef.id}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
