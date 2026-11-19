import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Heart,
  Layers,
  LockKeyhole,
  Move,
  Navigation2,
  Package,
  Pause,
  Plus,
  RefreshCw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SWITCH_HEX } from '../game/models';
import { CoinCollectEvent, ControlInputState, HudSnapshot, SwitchColor } from '../game/types';
import { Minimap } from './Minimap';

interface FlyingCollectible {
  id: number;
  kind: 'coin' | 'pack' | 'trophy' | 'gun' | 'medkit';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  points: number;
  switchColor?: SwitchColor;
}

interface GameHUDProps {
  hud: HudSnapshot;
  inputRef: React.MutableRefObject<ControlInputState>;
  muted: boolean;
  latestCoinEvent: CoinCollectEvent | null;
  onToggleMute: () => void;
  onPause: () => void;
  onAudioUnlock: () => void;
}

const CoinLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="#f59e0b" stroke="#fde047" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="6" stroke="#fef08a" strokeWidth="1.2" opacity="0.85" />
    <path d="M12 7.5L14.8 12L12 16.5L9.2 12L12 7.5Z" fill="#fef9c3" />
  </svg>
);

const BulletLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M7 18V9.5C7 6.2 9.2 3.5 12 2.5C14.8 3.5 17 6.2 17 9.5V18H7Z"
      fill="#38bdf8"
      stroke="#bae6fd"
      strokeWidth="1.5"
    />
    <rect x="6.5" y="18" width="11" height="3.5" rx="1" fill="#f59e0b" />
    <path d="M10.2 9.5V15.5" stroke="#e0f2fe" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const RailgunLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 9.5H19L22 11.5L19 13.5H11L9 19H5.5L7.2 13.5H3V9.5Z"
      fill="#f59e0b"
      stroke="#fef08a"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M5 6.5H18" stroke="#fde047" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  inputRef,
  muted,
  latestCoinEvent,
  onToggleMute,
  onPause,
  onAudioUnlock,
}) => {
  // Left Virtual Movement Stick state (Forward / Back / Strafe Left / Strafe Right)
  const movePadRef = useRef<HTMLDivElement | null>(null);
  const movePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  // Right Shoot & Aim Pad state (tap/hold fire + intentional drag aim + deliberate slide-turn)
  const shootPadRef = useRef<HTMLButtonElement | null>(null);
  const shootPointerId = useRef<number | null>(null);
  const shootOriginPos = useRef<{ x: number; y: number } | null>(null);
  const shootLastPos = useRef<{ x: number; y: number } | null>(null);
  const shootAimEngaged = useRef<boolean>(false);
  const shootTurnActive = useRef<boolean>(false);
  const [shootPressed, setShootPressed] = useState(false);
  const [shootOffset, setShootOffset] = useState({ x: 0, y: 0 });

  // Center viewport free-drag aim state
  const lookPointerId = useRef<number | null>(null);
  const lookLastPos = useRef<{ x: number; y: number } | null>(null);

  // Collectible HUD targets & flying item animation state
  const healthCardRef = useRef<HTMLDivElement | null>(null);
  const coinsCardRef = useRef<HTMLDivElement | null>(null);
  const gunCardRef = useRef<HTMLDivElement | null>(null);
  const packsCardRef = useRef<HTMLDivElement | null>(null);
  const trophyCardRef = useRef<HTMLDivElement | null>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingCollectible[]>([]);
  const [pulseKind, setPulseKind] = useState<'coin' | 'pack' | 'trophy' | 'gun' | 'medkit' | null>(
    null,
  );
  const [healAmountPop, setHealAmountPop] = useState<number | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const healPopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!latestCoinEvent) return;
    const targetEl =
      latestCoinEvent.kind === 'medkit'
        ? healthCardRef.current
        : latestCoinEvent.kind === 'gun'
          ? gunCardRef.current
          : latestCoinEvent.kind === 'pack'
            ? packsCardRef.current
            : latestCoinEvent.kind === 'trophy'
              ? trophyCardRef.current
              : coinsCardRef.current;
    const targetRect = targetEl?.getBoundingClientRect();
    const fallbackX =
      latestCoinEvent.kind === 'medkit'
        ? 110
        : latestCoinEvent.kind === 'gun'
          ? 235
          : latestCoinEvent.kind === 'pack'
            ? 280
            : latestCoinEvent.kind === 'trophy'
              ? 360
              : 190;
    const targetX = targetRect ? targetRect.left + targetRect.width / 2 : fallbackX;
    const targetY = targetRect ? targetRect.top + targetRect.height / 2 : 34;
    const startX = (latestCoinEvent.startXPercent / 100) * window.innerWidth;
    const startY = (latestCoinEvent.startYPercent / 100) * window.innerHeight;

    setFlyingItems((prev) => [
      ...prev.slice(-12),
      {
        id: latestCoinEvent.id,
        kind: latestCoinEvent.kind,
        startX,
        startY,
        targetX,
        targetY,
        points: latestCoinEvent.points,
        switchColor: latestCoinEvent.switchColor,
      },
    ]);
  }, [latestCoinEvent]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      if (healPopTimeoutRef.current !== null) {
        window.clearTimeout(healPopTimeoutRef.current);
      }
    };
  }, []);

  const handleItemArrive = (
    itemId: number,
    kind: 'coin' | 'pack' | 'trophy' | 'gun' | 'medkit',
    points: number,
  ) => {
    setFlyingItems((prev) => prev.filter((c) => c.id !== itemId));
    setPulseKind(kind);
    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = window.setTimeout(() => {
      setPulseKind(null);
    }, 320);

    if (kind === 'medkit' && points > 0) {
      setHealAmountPop(points);
      if (healPopTimeoutRef.current !== null) {
        window.clearTimeout(healPopTimeoutRef.current);
      }
      healPopTimeoutRef.current = window.setTimeout(() => {
        setHealAmountPop(null);
      }, 720);
    }
  };

  const applyStickCurve = (norm: number, deadzone = 0.14): number => {
    const abs = Math.abs(norm);
    if (abs <= deadzone) return 0;
    const scaled = (abs - deadzone) / (1 - deadzone);
    return Math.sign(norm) * Math.pow(scaled, 1.15);
  };

  const updateMoveStick = (clientX: number, clientY: number) => {
    const el = movePadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxRadius = Math.max(28, rect.width * 0.32);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobOffset({ x: dx, y: dy });

    const normX = dx / maxRadius;
    const normY = dy / maxRadius;

    // Smooth 4-way movement aligned directly with gun & camera facing direction
    inputRef.current.moveForward = applyStickCurve(-normY);
    inputRef.current.moveStrafe = applyStickCurve(normX);
  };

  const resetMoveStick = () => {
    movePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    inputRef.current.moveForward = 0;
    inputRef.current.moveStrafe = 0;
  };

  const handleMovePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onAudioUnlock();
    movePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateMoveStick(e.clientX, e.clientY);
  };

  const handleMovePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== e.pointerId) return;
    updateMoveStick(e.clientX, e.clientY);
  };

  const handleMovePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (movePointerId.current !== e.pointerId) return;
    resetMoveStick();
  };

  const updateShootDragVisualAndTurn = (clientX: number, clientY: number) => {
    const origin = shootOriginPos.current;
    const el = shootPadRef.current;
    if (!origin || !el) return;

    const rect = el.getBoundingClientRect();
    const maxOffset = Math.max(20, rect.width * 0.26);
    let dx = clientX - origin.x;
    let dy = clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxOffset) {
      dx = (dx / dist) * maxOffset;
      dy = (dy / dist) * maxOffset;
    }
    setShootOffset({ x: dx, y: dy });

    // Only engage continuous slide-turn on an intentional wide horizontal drag from touch-down point
    const rawDragX = clientX - origin.x;
    const turnThreshold = 28;
    const absDragX = Math.abs(rawDragX);
    if (absDragX > turnThreshold) {
      shootTurnActive.current = true;
      const ratio = Math.min(1, (absDragX - turnThreshold) / 36);
      inputRef.current.turnDelta = Math.sign(rawDragX) * ratio * 0.85;
    } else if (shootTurnActive.current) {
      shootTurnActive.current = false;
      inputRef.current.turnDelta = 0;
    }
  };

  const handleShootPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAudioUnlock();
    shootPointerId.current = e.pointerId;
    shootOriginPos.current = { x: e.clientX, y: e.clientY };
    shootLastPos.current = { x: e.clientX, y: e.clientY };
    shootAimEngaged.current = false;
    shootTurnActive.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    inputRef.current.firing = true;
    setShootPressed(true);
    setShootOffset({ x: 0, y: 0 });
  };

  const handleShootPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (
      shootPointerId.current !== e.pointerId ||
      !shootLastPos.current ||
      !shootOriginPos.current
    ) {
      return;
    }

    // Ignore micro finger wobble (<6px from touch-down) so tapping Shoot stays rock-steady
    if (!shootAimEngaged.current) {
      const totalDist = Math.hypot(
        e.clientX - shootOriginPos.current.x,
        e.clientY - shootOriginPos.current.y,
      );
      if (totalDist < 6) {
        return;
      }
      shootAimEngaged.current = true;
      shootLastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const dx = e.clientX - shootLastPos.current.x;
    const dy = e.clientY - shootLastPos.current.y;
    shootLastPos.current = { x: e.clientX, y: e.clientY };
    inputRef.current.aimDeltaX += dx * 1.15;
    inputRef.current.aimDeltaY += dy * 0.78;
    updateShootDragVisualAndTurn(e.clientX, e.clientY);
  };

  const handleShootPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (shootPointerId.current !== e.pointerId) return;
    shootPointerId.current = null;
    shootOriginPos.current = null;
    shootLastPos.current = null;
    shootAimEngaged.current = false;
    inputRef.current.firing = false;
    if (shootTurnActive.current) {
      shootTurnActive.current = false;
      inputRef.current.turnDelta = 0;
    }
    setShootPressed(false);
    setShootOffset({ x: 0, y: 0 });
  };

  const handleLookPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onAudioUnlock();
    lookPointerId.current = e.pointerId;
    lookLastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleLookPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId || !lookLastPos.current) return;
    const dx = e.clientX - lookLastPos.current.x;
    const dy = e.clientY - lookLastPos.current.y;
    lookLastPos.current = { x: e.clientX, y: e.clientY };
    inputRef.current.aimDeltaX += dx * 1.3;
    inputRef.current.aimDeltaY += dy * 0.85;
  };

  const handleLookPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    lookPointerId.current = null;
    lookLastPos.current = null;
  };

  const healthRatio = Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100));
  const allCoinsCollected = hud.coinsCollected >= hud.totalCoins;
  const reticleColor =
    hud.targetHighlight === 'enemy'
      ? '#f43f5e'
      : hud.targetHighlight === 'switch'
        ? '#22d3ee'
        : hud.targetHighlight === 'treasure'
          ? '#facc15'
          : '#f8fafc';

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between overflow-hidden touch-none">
      {/* Free-look drag surface across central viewport */}
      <div
        className="absolute inset-0 pointer-events-auto touch-none"
        onPointerDown={handleLookPointerDown}
        onPointerMove={handleLookPointerMove}
        onPointerUp={handleLookPointerUp}
        onPointerCancel={handleLookPointerUp}
      />

      {/* Last-Enemy Slow-Motion Cinematic Edge Glow */}
      {hud.slowMoActive && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            background:
              'radial-gradient(circle, transparent 58%, rgba(56, 189, 248, 0.18) 88%, rgba(250, 204, 21, 0.22) 100%)',
          }}
        />
      )}

      {/* Red Damage Vignette Flash */}
      {hud.damageFlash > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none border-8 border-rose-500/70"
          style={{
            opacity: hud.damageFlash * 0.75,
            background:
              'radial-gradient(circle, transparent 52%, rgba(225, 29, 72, 0.45) 100%)',
          }}
        />
      )}

      {/* Emerald Health Restore Vignette Flash */}
      {hud.healFlash > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: hud.healFlash * 0.72,
            background:
              'radial-gradient(circle, transparent 55%, rgba(34, 197, 94, 0.36) 100%)',
          }}
        />
      )}

      {/* Player Death Fadeout Overlay -> Transitions seamlessly into Lose Screen */}
      {hud.deathFade > 0.005 && (
        <div
          className="fixed inset-0 z-50 pointer-events-auto"
          style={{
            opacity: hud.deathFade,
            background: `radial-gradient(circle at center, rgba(69, 10, 24, ${
              0.35 * (1 - hud.deathFade)
            }) 0%, rgb(2, 6, 23) 78%)`,
            backgroundColor: '#020617',
          }}
        />
      )}

      {/* Flying Collectibles -> Health, Coins, Gun, Bullet Packs & Trophies HUD Boxes */}
      <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {flyingItems.map((item) => {
            const midX = (item.startX + item.targetX) * 0.5;
            const midY = Math.min(item.startY, item.targetY) - 42;
            const trophyHex = item.switchColor ? SWITCH_HEX[item.switchColor] : '#facc15';
            return (
              <motion.div
                key={item.id}
                initial={{
                  x: item.startX - 18,
                  y: item.startY - 18,
                  scale: 1.45,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: [item.startX - 18, midX - 18, item.targetX - 18],
                  y: [item.startY - 18, midY - 18, item.targetY - 18],
                  scale: [1.45, 1.12, 0.48],
                  opacity: [1, 1, 0.3],
                  rotate:
                    item.kind === 'coin'
                      ? [0, 360, 720]
                      : item.kind === 'medkit'
                        ? [0, 0, 0]
                        : [0, 180, 360],
                }}
                transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={() => handleItemArrive(item.id, item.kind, item.points)}
                className="absolute top-0 left-0 flex items-center gap-1"
              >
                {item.kind === 'medkit' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border-2 border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.75)] flex items-center justify-center text-red-600">
                    <Plus className="w-6 h-6 stroke-[3.5]" />
                  </div>
                )}
                {item.kind === 'coin' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 border-2 border-yellow-100 shadow-lg flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rotate-45 bg-yellow-100/90 rounded-[2px]" />
                  </div>
                )}
                {item.kind === 'pack' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-300 via-sky-500 to-indigo-600 border-2 border-sky-100 shadow-lg flex items-center justify-center text-slate-950">
                    <Package className="w-5 h-5 stroke-[2.4]" />
                  </div>
                )}
                {item.kind === 'gun' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600 border-2 border-yellow-100 shadow-lg flex items-center justify-center text-slate-950">
                    <RailgunLogo className="w-5 h-5" />
                  </div>
                )}
                {item.kind === 'trophy' && (
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-slate-950"
                    style={{ backgroundColor: trophyHex }}
                  >
                    <Trophy className="w-4 h-4 stroke-[2.4]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* TOP BAR: Sleek Frosted Obsidian HUD Cards */}
      <header className="relative z-20 flex items-start justify-between gap-2 safe-hud-top pointer-events-none">
        {/* Left: Boxed Icon Cards for Level, Health, Coins, Bullets, Bullet Packs & Bots */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[74vw]">
          {/* Level Number Box */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg"
            title={`Level ${hud.levelId}/${hud.totalLevels} · ${hud.levelName}`}
            aria-label={`Level ${hud.levelId} of ${hud.totalLevels}`}
          >
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono-num text-xs sm:text-sm font-bold text-amber-300 whitespace-nowrap">
              {hud.levelId}/{hud.totalLevels}
            </span>
          </div>

          {/* Player Health Box */}
          <div
            ref={healthCardRef}
            className={`relative flex items-center gap-1.5 rounded-xl border bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg transition-all duration-150 ${
              pulseKind === 'medkit'
                ? 'scale-110 border-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.45)]'
                : healthRatio <= 25
                  ? 'border-rose-500/80'
                  : 'border-white/12'
            }`}
            title="Player Health"
            aria-label={`Health ${hud.health}`}
          >
            <Heart
              className={`w-4 h-4 shrink-0 ${
                healthRatio > 55
                  ? 'text-emerald-400 fill-emerald-400'
                  : healthRatio > 25
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-rose-500 fill-rose-500'
              }`}
            />
            <div className="w-12 sm:w-16 h-2.5 rounded-sm bg-slate-800 overflow-hidden">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${healthRatio}%`,
                  backgroundColor:
                    healthRatio > 55 ? '#22c55e' : healthRatio > 25 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="font-mono-num text-xs sm:text-sm font-bold text-white w-7 text-right">
              {hud.health}
            </span>
            {healAmountPop !== null && (
              <span className="font-mono-num text-[11px] font-extrabold text-emerald-300 ml-0.5">
                +{healAmountPop}
              </span>
            )}
          </div>

          {/* Coins Collected Box */}
          <div
            ref={coinsCardRef}
            className={`flex items-center gap-1.5 rounded-xl border bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg transition-transform duration-150 ${
              pulseKind === 'coin' ? 'scale-110 border-amber-300' : 'border-white/12'
            }`}
            title="Coins Collected"
            aria-label={`Coins ${hud.coinsCollected} of ${hud.totalCoins}`}
          >
            <CoinLogo className="w-4 h-4 shrink-0" />
            <span
              className={`font-mono-num text-xs sm:text-sm font-bold whitespace-nowrap ${
                allCoinsCollected ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {hud.coinsCollected}/{hud.totalCoins}
            </span>
          </div>

          {/* Active Gun & Bullet Count Box */}
          <div
            ref={gunCardRef}
            className={`flex items-center gap-1.5 rounded-xl border backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg transition-all duration-150 ${
              hud.activeWeapon === 'heavy'
                ? `border-amber-400/90 bg-amber-950/85 ${pulseKind === 'gun' ? 'scale-110 border-yellow-200' : ''}`
                : `border-white/12 bg-slate-950/82 ${pulseKind === 'gun' ? 'scale-110 border-amber-300' : ''}`
            }`}
            title={
              hud.activeWeapon === 'heavy'
                ? 'Apex Railgun (Armor Piercing · 10 Bullets)'
                : 'Default Pulse Blaster'
            }
            aria-label={
              hud.activeWeapon === 'heavy'
                ? `Heavy Railgun ${hud.specialGunBullets} of ${hud.maxSpecialGunBullets} bullets`
                : `Bullets ${hud.gunBullets} of ${hud.maxGunBullets}`
            }
          >
            {hud.activeWeapon === 'heavy' ? (
              <>
                <RailgunLogo className="w-4 h-4 shrink-0" />
                <span className="font-mono-num text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                  RAIL
                </span>
                <span className="font-mono-num text-xs sm:text-sm font-bold whitespace-nowrap text-yellow-300">
                  {hud.specialGunBullets}/{hud.maxSpecialGunBullets}
                </span>
              </>
            ) : (
              <>
                {hud.reloading ? (
                  <RefreshCw className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
                ) : (
                  <BulletLogo className="w-4 h-4 shrink-0" />
                )}
                <span
                  className={`font-mono-num text-xs sm:text-sm font-bold whitespace-nowrap ${
                    hud.reloading
                      ? 'text-amber-300'
                      : hud.gunBullets === 0
                        ? 'text-rose-400'
                        : hud.gunBullets <= 3
                          ? 'text-amber-300'
                          : 'text-sky-300'
                  }`}
                >
                  {hud.gunBullets}/{hud.maxGunBullets}
                </span>
              </>
            )}
          </div>

          {/* Bullet Packs Bucket Box */}
          <div
            ref={packsCardRef}
            className={`flex items-center gap-1.5 rounded-xl border bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg transition-transform duration-150 ${
              pulseKind === 'pack' ? 'scale-110 border-sky-300' : 'border-white/12'
            }`}
            title="Bullet Packs in Bucket (Max 5)"
            aria-label={`Bullet Packs ${hud.bulletPacks} of ${hud.maxBulletPacks}`}
          >
            <Package className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hud.maxBulletPacks }).map((_, idx) => {
                const filled = idx < hud.bulletPacks;
                return (
                  <span
                    key={idx}
                    className={`w-1.5 sm:w-2 h-3 sm:h-3.5 rounded-[2px] border ${
                      filled
                        ? 'bg-sky-400 border-sky-200'
                        : 'bg-slate-800/90 border-slate-700'
                    }`}
                  />
                );
              })}
            </div>
            <span className="font-mono-num text-xs sm:text-sm font-bold text-sky-300 whitespace-nowrap">
              {hud.bulletPacks}/{hud.maxBulletPacks}
            </span>
          </div>

          {/* Bots & Door Trophy/Seal Logos Box */}
          <div
            ref={trophyCardRef}
            className={`flex items-center gap-2 rounded-xl border bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg transition-transform duration-150 ${
              pulseKind === 'trophy' ? 'scale-110 border-emerald-400' : 'border-white/12'
            }`}
          >
            <div
              className="flex items-center gap-1"
              title="Bots Defeated"
              aria-label={`Bots defeated ${hud.kills} of ${hud.totalBots}`}
            >
              <Bot className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-mono-num text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap">
                {hud.kills}/{hud.totalBots}
              </span>
            </div>

            {hud.switchesTotal.length > 0 && (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-800">
                {hud.switchesTotal.map((color) => {
                  const active = hud.switchesActivated.includes(color);
                  return (
                    <Zap
                      key={color}
                      className="w-3.5 h-3.5"
                      style={{
                        color: active ? '#22c55e' : SWITCH_HEX[color],
                        fill: active ? '#22c55e' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {hud.bountyKillsRequired > 0 && (
              <div
                className="flex items-center gap-1 pl-1.5 border-l border-slate-800"
                title="Bot Seal Door"
              >
                <LockKeyhole
                  className={`w-3.5 h-3.5 ${
                    hud.bountyUnlocked ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                />
                <span
                  className={`font-mono-num text-xs font-bold ${
                    hud.bountyUnlocked ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {Math.min(hud.kills, hud.bountyKillsRequired)}/{hud.bountyKillsRequired}
                </span>
              </div>
            )}

            {/* Final Trophy Door Seal Logo Indicator */}
            <div
              className="flex items-center gap-1 pl-1.5 border-l border-slate-800"
              title={
                hud.trophyDoorUnlocked
                  ? `${hud.jewelleryName} Door Open`
                  : 'Collect all Coins & Kill all Bots to open Trophy Door'
              }
              aria-label={hud.trophyDoorUnlocked ? 'Trophy door unlocked' : 'Trophy door locked'}
            >
              <Trophy
                className={`w-3.5 h-3.5 ${
                  hud.trophyDoorUnlocked ? 'text-emerald-400' : 'text-yellow-400'
                }`}
              />
              <LockKeyhole
                className={`w-3 h-3 ${
                  hud.trophyDoorUnlocked ? 'text-emerald-400' : 'text-yellow-400/80'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right: Boxed Score Logo Card, Mute/Pause Icon Boxes & Compact Minimap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-slate-950/82 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg"
              title="Score"
              aria-label={`Score ${hud.score}`}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono-num text-xs sm:text-sm font-bold text-amber-300">
                {hud.score}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-950/82 backdrop-blur-md hover:bg-slate-800 text-slate-200 border border-white/12 shadow-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-950/82 backdrop-blur-md hover:bg-slate-800 text-slate-200 border border-white/12 shadow-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label="Pause game"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden min-[540px]:block">
            <Minimap data={hud.minimap} />
          </div>
        </div>
      </header>

      {/* ALL TASKS COMPLETE POPUP & LIVE TROPHY NAVIGATION COMPASS */}
      <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 px-3 pointer-events-none max-w-[68vw]">
        <AnimatePresence>
          {hud.bannerMessage && (
            <motion.div
              key={hud.bannerMessage}
              initial={{ opacity: 0, y: -10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex items-center gap-2 rounded-xl border border-yellow-300/75 bg-slate-950/92 backdrop-blur-md px-3.5 py-1.5 shadow-[0_8px_28px_rgba(250,204,21,0.3)]"
              role="status"
              aria-live="polite"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-300/60 flex items-center justify-center text-yellow-300 shrink-0">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <span className="font-display text-xs sm:text-sm font-bold text-yellow-200 tracking-wide truncate">
                {hud.bannerMessage}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {hud.trophyDoorUnlocked && (
          <div
            className="flex items-center gap-2 rounded-xl border border-amber-400/55 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 shadow-lg"
            aria-label={`Navigate to ${hud.jewelleryName}, ${hud.trophyDistance} meters`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-300/50 flex items-center justify-center text-yellow-300 shrink-0">
              <Navigation2
                className="w-3.5 h-3.5 fill-yellow-300 transition-transform duration-75"
                style={{ transform: `rotate(${hud.trophyBearingDeg}deg)` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
              <span className="text-yellow-300 font-display font-bold">
                Reach {hud.jewelleryName}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-300">
                {Math.abs(hud.trophyBearingDeg) <= 25
                  ? 'Ahead'
                  : Math.abs(hud.trophyBearingDeg) >= 145
                    ? 'Behind'
                    : hud.trophyBearingDeg > 0
                      ? 'Turn Right'
                      : 'Turn Left'}
              </span>
              <span className="font-mono-num text-amber-200">({hud.trophyDistance}m)</span>
            </div>
          </div>
        )}
      </div>

      {/* CENTER TACTICAL CROSSHAIR + 4-CORNER HITMARKER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative flex items-center justify-center transition-transform duration-100"
          style={{
            transform: `scale(${
              hud.targetHighlight !== 'none' ? 0.92 : shootPressed ? 1.18 : 1
            })`,
          }}
        >
          {/* 4-Prong Precision Reticle */}
          <span
            className="absolute -top-3 w-0.5 h-2 rounded-full transition-colors duration-100"
            style={{ backgroundColor: reticleColor, opacity: 0.92 }}
          />
          <span
            className="absolute -bottom-3 w-0.5 h-2 rounded-full transition-colors duration-100"
            style={{ backgroundColor: reticleColor, opacity: 0.92 }}
          />
          <span
            className="absolute -left-3 h-0.5 w-2 rounded-full transition-colors duration-100"
            style={{ backgroundColor: reticleColor, opacity: 0.92 }}
          />
          <span
            className="absolute -right-3 h-0.5 w-2 rounded-full transition-colors duration-100"
            style={{ backgroundColor: reticleColor, opacity: 0.92 }}
          />

          {/* Center Dot */}
          <div
            className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.9)]"
            style={{ backgroundColor: reticleColor }}
          />

          {/* 4-Tick X Hitmarker */}
          {hud.hitMarker > 0.05 && (
            <div
              className="absolute w-9 h-9 pointer-events-none"
              style={{ opacity: hud.hitMarker }}
            >
              <span className="absolute left-1 top-1 w-0.5 h-2.5 -rotate-45 bg-amber-300 rounded-full" />
              <span className="absolute right-1 top-1 w-0.5 h-2.5 rotate-45 bg-amber-300 rounded-full" />
              <span className="absolute left-1 bottom-1 w-0.5 h-2.5 rotate-45 bg-amber-300 rounded-full" />
              <span className="absolute right-1 bottom-1 w-0.5 h-2.5 -rotate-45 bg-amber-300 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TWO-CONTROL BAR: ICONIC MOVE PAD + SHOOT/AIM PAD */}
      <div className="relative z-20 flex items-end justify-between safe-hud-controls pointer-events-none">
        {/* Control 1: Movement Virtual Stick (Directional Arrow Logos) */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div
            ref={movePadRef}
            onPointerDown={handleMovePointerDown}
            onPointerMove={handleMovePointerMove}
            onPointerUp={handleMovePointerUp}
            onPointerCancel={handleMovePointerUp}
            className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-2 border-sky-400/50 bg-slate-950/70 backdrop-blur-sm shadow-xl flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
            aria-label="Movement Joystick"
          >
            <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-slate-500/35 pointer-events-none" />
            <ChevronUp className="absolute top-1.5 sm:top-2 w-4 h-4 text-sky-300/75 pointer-events-none" />
            <ChevronDown className="absolute bottom-1.5 sm:bottom-2 w-4 h-4 text-sky-300/75 pointer-events-none" />
            <ChevronLeft className="absolute left-1.5 sm:left-2 w-4 h-4 text-sky-300/75 pointer-events-none" />
            <ChevronRight className="absolute right-1.5 sm:right-2 w-4 h-4 text-sky-300/75 pointer-events-none" />

            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 border-2 border-sky-100 shadow-lg pointer-events-none flex items-center justify-center text-slate-950"
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              }}
            >
              <Move className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Control 2: Shoot & Aim Trigger (Weapon-Aware Glow + Reload Ring) */}
        <div className="flex flex-col items-center pointer-events-auto">
          <button
            ref={shootPadRef}
            type="button"
            onPointerDown={handleShootPointerDown}
            onPointerMove={handleShootPointerMove}
            onPointerUp={handleShootPointerUp}
            onPointerCancel={handleShootPointerUp}
            className={`relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-2 flex items-center justify-center shadow-xl backdrop-blur-sm touch-none transition-colors duration-75 cursor-pointer ${
              shootPressed
                ? 'bg-amber-400/95 border-yellow-100 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.55)]'
                : hud.activeWeapon === 'heavy'
                  ? 'bg-amber-600/85 hover:bg-amber-500/90 border-yellow-300/85 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.4)]'
                  : 'bg-rose-600/80 hover:bg-rose-500/90 border-rose-300/70 text-white'
            }`}
            aria-label="Shoot and Aim Blaster"
          >
            <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-white/25 pointer-events-none" />
            {hud.reloading && (
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-amber-300 animate-spin pointer-events-none" />
            )}
            <div
              className="flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate3d(${shootOffset.x * 0.45}px, ${shootOffset.y * 0.45}px, 0)`,
              }}
            >
              <Crosshair className="w-9 h-9 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
