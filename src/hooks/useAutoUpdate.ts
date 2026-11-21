import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const CHECK_INTERVAL_MS = 60_000;
const MIN_CHECK_GAP_MS = 10_000;
const APPLIED_BUILD_STORAGE_KEY = 'vaultbound_last_applied_build';
const RELOAD_TS_STORAGE_KEY = 'vaultbound_last_reload_ts';
const MIN_RELOAD_COOLDOWN_MS = 15_000;

interface VersionResponse {
  buildId?: string;
  builtAt?: string;
}

function canSafelyReload(targetBuildId: string): boolean {
  try {
    const lastApplied = sessionStorage.getItem(APPLIED_BUILD_STORAGE_KEY);
    if (targetBuildId && lastApplied === targetBuildId) {
      return false;
    }
    const lastTs = Number(sessionStorage.getItem(RELOAD_TS_STORAGE_KEY) || '0');
    if (Date.now() - lastTs < MIN_RELOAD_COOLDOWN_MS) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function markReloading(targetBuildId: string): void {
  try {
    if (targetBuildId) {
      sessionStorage.setItem(APPLIED_BUILD_STORAGE_KEY, targetBuildId);
    }
    sessionStorage.setItem(RELOAD_TS_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore restricted storage contexts
  }
}

/**
 * Automatically detects new GitHub Pages / PWA deployments and updates installed
 * mobile apps without requiring users to uninstall and reinstall.
 *
 * - Never interrupts active mid-level gameplay (`isMidLevel === true`); queues
 *   the update and applies it automatically as soon as the player finishes or
 *   leaves the level (or taps "Update Now").
 * - Protected against reload loops via buildId + cooldown tracking in sessionStorage.
 */
export function useAutoUpdate(isMidLevel: boolean) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  const isMidLevelRef = useRef(isMidLevel);
  isMidLevelRef.current = isMidLevel;

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const pendingBuildIdRef = useRef<string>('');
  const lastCheckAtRef = useRef<number>(0);
  const reloadingRef = useRef<boolean>(false);

  const applyUpdateNow = useCallback(async () => {
    if (reloadingRef.current) return;
    const targetBuild = pendingBuildIdRef.current || `sw-${Date.now()}`;
    if (!canSafelyReload(targetBuild)) {
      setUpdateAvailable(false);
      return;
    }

    reloadingRef.current = true;
    setIsApplyingUpdate(true);
    markReloading(targetBuild);

    const hasConfirmedNewBuild =
      Boolean(pendingBuildIdRef.current) &&
      !pendingBuildIdRef.current.startsWith('sw-') &&
      !pendingBuildIdRef.current.startsWith('waiting-') &&
      !pendingBuildIdRef.current.startsWith('refresh-') &&
      !pendingBuildIdRef.current.startsWith('controller-');

    try {
      const reg = registrationRef.current;
      if (reg) {
        await reg.update().catch(() => {});

        const nextWorker = reg.installing || reg.waiting;
        if (nextWorker) {
          if (reg.waiting && updateSWRef.current) {
            await updateSWRef.current(false).catch(() => {});
          }
          // Wait up to 4 seconds for the updated Service Worker to finish activating
          await new Promise<void>((resolve) => {
            if (nextWorker.state === 'activated') {
              resolve();
              return;
            }
            const timer = window.setTimeout(resolve, 4000);
            const onState = () => {
              if (nextWorker.state === 'activated' || nextWorker.state === 'redundant') {
                window.clearTimeout(timer);
                nextWorker.removeEventListener('statechange', onState);
                resolve();
              }
            };
            nextWorker.addEventListener('statechange', onState);
          });
        } else if (hasConfirmedNewBuild && navigator.onLine) {
          // Newer version.json is live on GitHub Pages while sw.js was still edge-cached:
          // clear stale caches and unregister so the reload loads the fresh bundle & SW.
          if ('caches' in window) {
            const keys = await caches.keys().catch(() => [] as string[]);
            await Promise.all(
              keys
                .filter((k) => k === 'pages-cache' || k.startsWith('workbox-precache'))
                .map((k) => caches.delete(k).catch(() => false)),
            );
          }
          await reg.unregister().catch(() => {});
        }
      }

      if ('caches' in window) {
        await caches.delete('pages-cache').catch(() => {});
      }
    } catch {
      // Fall through to reload
    }

    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }, []);

  // If an update was deferred while the player was mid-level, apply automatically
  // as soon as they exit active gameplay (level complete, pause, or menu).
  useEffect(() => {
    if (!isMidLevel && updateAvailable && !reloadingRef.current) {
      void applyUpdateNow();
    }
  }, [isMidLevel, updateAvailable, applyUpdateNow]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentBuildId = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : '';
    const hadControllerAtBoot = Boolean(navigator.serviceWorker?.controller);

    const handleUpdateDetected = (detectedBuildId: string) => {
      if (reloadingRef.current) return;
      if (detectedBuildId && !canSafelyReload(detectedBuildId)) return;

      pendingBuildIdRef.current = detectedBuildId || pendingBuildIdRef.current || `sw-${Date.now()}`;
      setUpdateAvailable(true);

      if (!isMidLevelRef.current) {
        void applyUpdateNow();
      }
    };

    const checkForUpdates = async (force = false) => {
      if (!navigator.onLine || reloadingRef.current) return;
      const now = Date.now();
      if (!force && now - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return;
      lastCheckAtRef.current = now;

      // 1. Ask the Service Worker to check sw.js against the server
      const reg = registrationRef.current;
      if (reg) {
        reg.update().catch(() => {});
      }

      // 2. Check build-stamped version.json (bypasses SW and HTTP cache)
      if (!currentBuildId || import.meta.env.DEV) return;
      try {
        const versionUrl = new URL(`./version.json?t=${now}`, window.location.href).href;
        const response = await fetch(versionUrl, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;

        const data = (await response.json()) as VersionResponse;
        if (data.buildId && data.buildId !== currentBuildId) {
          if (reg) {
            await reg.update().catch(() => {});
          }
          handleUpdateDetected(data.buildId);
        }
      } catch {
        // Offline or transient network error — silently ignore
      }
    };

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        registrationRef.current = registration;

        // If a waiting SW already exists right on boot, trigger update flow
        if (registration.waiting) {
          handleUpdateDetected(`waiting-${Date.now()}`);
        }
      },
      onNeedRefresh() {
        handleUpdateDetected(`refresh-${Date.now()}`);
      },
    });
    updateSWRef.current = updateSW;

    // When a newly installed SW takes control via skipWaiting + clientsClaim
    const onControllerChange = () => {
      if (!hadControllerAtBoot || reloadingRef.current) return;
      handleUpdateDetected(pendingBuildIdRef.current || `controller-${Date.now()}`);
    };
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

    // Check shortly after startup, when returning to the installed app, and periodically
    const bootTimer = window.setTimeout(() => {
      void checkForUpdates(true);
    }, 1800);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates(false);
      }
    }, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates(false);
      }
    };
    const onFocus = () => {
      void checkForUpdates(false);
    };
    const onOnline = () => {
      void checkForUpdates(true);
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      window.clearTimeout(bootTimer);
      window.clearInterval(intervalId);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [applyUpdateNow]);

  return {
    updateAvailable,
    isApplyingUpdate,
    applyUpdateNow,
  };
}
