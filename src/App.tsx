import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { GameHUD } from './components/GameHUD';
import { GameOverlayModal } from './components/GameOverlayModal';
import { IntroScreen } from './components/IntroScreen';
import { LevelBriefingModal } from './components/LevelBriefingModal';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { AppUpdateBanner, OfflineIndicator } from './components/PWAInstallButton';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { soundFX } from './game/audio';
import { VaultGameEngine } from './game/engine';
import { LEVELS } from './game/levels';
import {
  CoinCollectEvent,
  ControlInputState,
  GamePhase,
  HudSnapshot,
  LevelProgressRecord,
} from './game/types';

const STORAGE_KEY = 'vaultbound_progress_v1';

function detectPortraitMobile(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerHeight <= window.innerWidth) return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
  const mobileUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  return Boolean(coarse || hasTouch || mobileUA);
}

function musicModeForPhase(target: GamePhase): 'menu' | 'action' | 'victory' | 'paused' {
  if (target === 'playing') return 'action';
  if (target === 'level_complete' || target === 'victory') return 'victory';
  if (target === 'intro' || target === 'level_select' || target === 'level_briefing') return 'menu';
  return 'paused';
}

function loadInitialProgress(): Record<number, LevelProgressRecord> {
  const defaults: Record<number, LevelProgressRecord> = {};
  for (const lvl of LEVELS) {
    defaults[lvl.id] = {
      unlocked: lvl.id === 1,
      completed: false,
      bestScore: 0,
      bestTime: null,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<number, LevelProgressRecord>;
      for (const lvl of LEVELS) {
        if (parsed[lvl.id]) {
          defaults[lvl.id] = {
            unlocked: Boolean(parsed[lvl.id].unlocked || lvl.id === 1),
            completed: Boolean(parsed[lvl.id].completed),
            bestScore: Number(parsed[lvl.id].bestScore || 0),
            bestTime:
              parsed[lvl.id].bestTime != null ? Number(parsed[lvl.id].bestTime) : null,
          };
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return defaults;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<VaultGameEngine | null>(null);
  const inputRef = useRef<ControlInputState>({
    moveForward: 0,
    moveStrafe: 0,
    turnDelta: 0,
    aimDeltaX: 0,
    aimDeltaY: 0,
    firing: false,
  });

  const [phase, setPhase] = useState<GamePhase>('intro');
  const phaseRef = useRef<GamePhase>('intro');
  const { updateAvailable, isApplyingUpdate, applyUpdateNow } = useAutoUpdate(
    phase === 'playing',
  );
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [progress, setProgress] = useState<Record<number, LevelProgressRecord>>(
    loadInitialProgress,
  );
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [latestCoinEvent, setLatestCoinEvent] = useState<CoinCollectEvent | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [isPortraitTouch, setIsPortraitTouch] = useState<boolean>(detectPortraitMobile);
  const [orientationLockNote, setOrientationLockNote] = useState<boolean>(false);
  const pausedByOrientationRef = useRef<boolean>(false);
  const [summary, setSummary] = useState<{
    score: number;
    elapsedSeconds: number;
    kills: number;
    totalBots: number;
    coinsCollected: number;
    totalCoins: number;
    accuracy: number;
  } | null>(null);

  const updatePhase = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
    if (detectPortraitMobile()) {
      soundFX.setMusicMode('paused');
      return;
    }
    soundFX.setMusicMode(musicModeForPhase(next));
  }, []);

  const ensureLandscapeMode = useCallback(async (): Promise<boolean> => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
    const mobileUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    if (!coarse && !hasTouch && !mobileUA) return true;

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };

    if (orientation?.lock) {
      try {
        await orientation.lock('landscape');
      } catch {
        try {
          await orientation.lock('landscape-primary');
        } catch {
          // Ignore if orientation lock requires standalone/native context (never call requestFullscreen, which triggers Chrome's exit-fullscreen toast)
        }
      }
    }

    return window.innerWidth > window.innerHeight;
  }, []);

  // Strictly enforce landscape-only orientation on mobile & pause gameplay if rotated to portrait
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = detectPortraitMobile();
      setIsPortraitTouch(portrait);

      if (portrait) {
        inputRef.current.moveForward = 0;
        inputRef.current.moveStrafe = 0;
        inputRef.current.turnDelta = 0;
        inputRef.current.firing = false;
        if (phaseRef.current === 'playing') {
          pausedByOrientationRef.current = true;
          engineRef.current?.setPaused(true);
        }
        soundFX.setMusicMode('paused');
      } else {
        setOrientationLockNote(false);
        if (pausedByOrientationRef.current) {
          pausedByOrientationRef.current = false;
          if (phaseRef.current === 'playing') {
            engineRef.current?.setPaused(false);
          }
        }
        soundFX.setMusicMode(musicModeForPhase(phaseRef.current));
      }
    };

    checkOrientation();
    void ensureLandscapeMode();

    const unlockOnce = () => {
      soundFX.unlock();
      void ensureLandscapeMode();
    };
    const orientationObj = screen.orientation;
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    orientationObj?.addEventListener?.('change', checkOrientation);
    window.visualViewport?.addEventListener('resize', checkOrientation);
    window.addEventListener('touchstart', unlockOnce, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockOnce, { passive: true, once: true });
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      orientationObj?.removeEventListener?.('change', checkOrientation);
      window.visualViewport?.removeEventListener('resize', checkOrientation);
      window.removeEventListener('touchstart', unlockOnce);
      window.removeEventListener('pointerdown', unlockOnce);
    };
  }, [ensureLandscapeMode]);

  // Initialize Three.js Engine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new VaultGameEngine(container, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onCoinCollected: (event) => {
        setLatestCoinEvent(event);
      },
      onLevelComplete: (res) => {
        setSummary({
          score: res.score,
          elapsedSeconds: res.elapsedSeconds,
          kills: res.kills,
          totalBots: res.totalBots,
          coinsCollected: res.coinsCollected,
          totalCoins: res.totalCoins,
          accuracy: res.accuracy,
        });

        setProgress((prev) => {
          const next = { ...prev };
          const cur = next[res.levelId] || {
            unlocked: true,
            completed: false,
            bestScore: 0,
            bestTime: null,
          };
          next[res.levelId] = {
            unlocked: true,
            completed: true,
            bestScore: Math.max(cur.bestScore, res.score),
            bestTime:
              cur.bestTime == null
                ? res.elapsedSeconds
                : Math.min(cur.bestTime, res.elapsedSeconds),
          };
          if (res.levelId < LEVELS.length) {
            const nxt = next[res.levelId + 1] || {
              unlocked: true,
              completed: false,
              bestScore: 0,
              bestTime: null,
            };
            next[res.levelId + 1] = { ...nxt, unlocked: true };
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore quota errors
          }
          return next;
        });

        updatePhase(res.levelId >= LEVELS.length ? 'victory' : 'level_complete');
      },
      onGameOver: () => {
        updatePhase('game_over');
      },
      onContextLost: (lost) => {
        setContextLost(lost);
      },
    });

    engine.setPaused(true);
    engine.input = inputRef.current;
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [updatePhase]);

  // Desktop keyboard support (WASD + Arrows + Space) alongside mobile touch controls
  useEffect(() => {
    const keys = new Set<string>();

    const syncKeyboardToInput = () => {
      if (phaseRef.current !== 'playing') return;
      let fwd = 0;
      let strafe = 0;
      let turn = 0;

      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      if (keys.has('KeyA')) strafe -= 1;
      if (keys.has('KeyD')) strafe += 1;
      if (keys.has('ArrowLeft') || keys.has('KeyQ')) turn -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyE')) turn += 1;

      inputRef.current.moveForward = fwd;
      inputRef.current.moveStrafe = strafe;
      inputRef.current.turnDelta = turn;
      inputRef.current.firing = keys.has('Space') || keys.has('KeyJ');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (phaseRef.current === 'playing') {
          engineRef.current?.setPaused(true);
          updatePhase('paused');
        } else if (phaseRef.current === 'paused') {
          engineRef.current?.setPaused(false);
          updatePhase('playing');
        }
        return;
      }

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) &&
        phaseRef.current === 'playing'
      ) {
        e.preventDefault();
      }
      soundFX.unlock();
      keys.add(e.code);
      syncKeyboardToInput();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      syncKeyboardToInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [updatePhase]);

  const openLevelBriefing = useCallback(
    (levelId: number) => {
      soundFX.unlock();
      void ensureLandscapeMode();
      setCurrentLevelId(levelId);
      setSummary(null);
      setLatestCoinEvent(null);
      inputRef.current.moveForward = 0;
      inputRef.current.moveStrafe = 0;
      inputRef.current.turnDelta = 0;
      inputRef.current.aimDeltaX = 0;
      inputRef.current.aimDeltaY = 0;
      inputRef.current.firing = false;
      engineRef.current?.loadLevel(levelId);
      engineRef.current?.setPaused(true);
      pausedByOrientationRef.current = false;
      updatePhase('level_briefing');
    },
    [ensureLandscapeMode, updatePhase],
  );

  const beginLoadedLevel = useCallback(() => {
    soundFX.unlock();
    void ensureLandscapeMode();
    const portrait = detectPortraitMobile();
    pausedByOrientationRef.current = portrait;
    engineRef.current?.setPaused(portrait);
    updatePhase('playing');
  }, [ensureLandscapeMode, updatePhase]);

  const startLevel = useCallback(
    (levelId: number) => {
      soundFX.unlock();
      void ensureLandscapeMode();
      setCurrentLevelId(levelId);
      setSummary(null);
      setLatestCoinEvent(null);
      inputRef.current.moveForward = 0;
      inputRef.current.moveStrafe = 0;
      inputRef.current.turnDelta = 0;
      inputRef.current.aimDeltaX = 0;
      inputRef.current.aimDeltaY = 0;
      inputRef.current.firing = false;
      engineRef.current?.loadLevel(levelId);
      const portrait = detectPortraitMobile();
      pausedByOrientationRef.current = portrait;
      engineRef.current?.setPaused(portrait);
      updatePhase('playing');
    },
    [ensureLandscapeMode, updatePhase],
  );

  const handleEnterPlay = useCallback(() => {
    soundFX.unlock();
    void ensureLandscapeMode();
    updatePhase('level_select');
  }, [ensureLandscapeMode, updatePhase]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !soundFX.muted;
    soundFX.setMuted(nextMuted);
    setMuted(nextMuted);
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.setPaused(true);
    updatePhase('paused');
  }, [updatePhase]);

  const handleResume = useCallback(() => {
    soundFX.unlock();
    void ensureLandscapeMode();
    const portrait = detectPortraitMobile();
    pausedByOrientationRef.current = portrait;
    engineRef.current?.setPaused(portrait);
    updatePhase('playing');
  }, [ensureLandscapeMode, updatePhase]);

  const handleRetry = useCallback(() => {
    startLevel(currentLevelId);
  }, [currentLevelId, startLevel]);

  const handleNextLevel = useCallback(() => {
    const nextId = Math.min(LEVELS.length, currentLevelId + 1);
    openLevelBriefing(nextId);
  }, [currentLevelId, openLevelBriefing]);

  const handleReturnLevelSelect = useCallback(() => {
    engineRef.current?.setPaused(true);
    updatePhase('level_select');
  }, [updatePhase]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-slate-950 select-none">
      {/* Dedicated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* Context Lost Recovery Banner */}
      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="font-display text-lg font-bold text-white">
              Graphics Context Restoring
            </h2>
            <p className="text-xs text-slate-300 mt-2">
              Your 3D viewport was paused by the device. Tap Retry if it does not resume automatically.
            </p>
          </div>
        </div>
      )}

      {/* Strict Landscape-Only Gate on Mobile Portrait (cannot be bypassed) */}
      {isPortraitTouch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="landscape-lock-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950 safe-modal-inset p-5 text-center"
        >
          <div className="w-full max-w-sm rounded-2xl border border-amber-400/50 bg-slate-900 p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <RotateCw className="w-7 h-7 animate-spin" style={{ animationDuration: '3.5s' }} />
            </div>
            <div>
              <h2 id="landscape-lock-title" className="font-display text-xl font-bold text-white">
                Landscape Only
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Vaultbound opens exclusively in landscape mode. Rotate your device sideways or tap below to lock landscape.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                soundFX.unlock();
                const rotated = await ensureLandscapeMode();
                const stillPortrait = detectPortraitMobile();
                setIsPortraitTouch(stillPortrait);
                if (!rotated && stillPortrait) {
                  setOrientationLockNote(true);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-white cursor-pointer whitespace-nowrap"
            >
              Switch to Landscape
            </button>
            {orientationLockNote && (
              <p className="text-[11px] text-amber-300 leading-relaxed">
                Automatic rotation is restricted by your browser. Unlock orientation in Quick Settings / Control Center and turn your phone sideways.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Intro Screen with Play Button */}
      {phase === 'intro' && <IntroScreen onPlay={handleEnterPlay} />}

      {/* 30-Level Selection Screen */}
      {phase === 'level_select' && (
        <LevelSelectScreen
          progress={progress}
          onStartLevel={openLevelBriefing}
          onBack={() => updatePhase('intro')}
        />
      )}

      {/* Pre-Level Objective & Tasks Briefing Screen */}
      {phase === 'level_briefing' && (
        <LevelBriefingModal
          levelId={currentLevelId}
          onStart={beginLoadedLevel}
          onBack={handleReturnLevelSelect}
        />
      )}

      {/* In-Game Two-Control HUD */}
      {phase === 'playing' && hud && (
        <GameHUD
          hud={hud}
          inputRef={inputRef}
          muted={muted}
          latestCoinEvent={latestCoinEvent}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onAudioUnlock={() => soundFX.unlock()}
        />
      )}

      {/* Pause / Level Clear / Victory / Game Over Modals */}
      <GameOverlayModal
        phase={phase}
        levelId={currentLevelId}
        summary={summary}
        onResume={handleResume}
        onRetry={handleRetry}
        onNextLevel={handleNextLevel}
        onReturnTitle={handleReturnLevelSelect}
      />

      <AppUpdateBanner
        updateAvailable={updateAvailable}
        isApplyingUpdate={isApplyingUpdate}
        onApplyNow={applyUpdateNow}
      />
      <OfflineIndicator />
    </main>
  );
}
