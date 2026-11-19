import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, QrCode, Smartphone, WifiOff, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

function getMobileShareUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function getAndroidChromeIntentUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${parsed.protocol.replace(':', '')};package=com.android.chrome;end`;
  } catch {
    return url;
  }
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isIOSSafari, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const mobileUrl = getMobileShareUrl();
  const inIframe = typeof window !== 'undefined' && window.self !== window.top;
  const chromeIntentUrl = getAndroidChromeIntentUrl(mobileUrl);

  useEffect(() => {
    if (!showModal || !mobileUrl) return;
    let active = true;
    QRCode.toDataURL(mobileUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#f8fafc',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [showModal, mobileUrl]);

  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    if (isInstallable && isAndroid) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-sky-400/55 text-sky-200 font-semibold text-xs sm:text-sm shadow-lg backdrop-blur-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        {isInstallable ? (
          <Download className="w-4 h-4 text-sky-400" />
        ) : (
          <Smartphone className="w-4 h-4 text-sky-400" />
        )}
        {isInstallable ? 'Install · Android & iOS' : 'Android & iOS'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 safe-modal-inset"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl flex flex-col gap-4 max-h-[90dvh] overflow-y-auto scroll-touch"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  Play &amp; Install on Android &amp; iOS
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full-screen landscape play with offline caching
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                aria-label="Close install dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* QR Code Card */}
              <div className="sm:col-span-5 flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan QR code to open Vaultbound on Android or iOS"
                    className="w-36 h-36 rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 text-center">
                  Scan with Android or iPhone camera
                </span>
              </div>

              {/* Step-by-Step Android & iOS Instructions */}
              <div className="sm:col-span-7 flex flex-col gap-3 text-xs text-slate-300">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await install();
                      if (ok) setShowModal(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Install Now on This Device
                  </button>
                )}

                {isAndroid && !isInstallable && (
                  <a
                    href={chromeIntentUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Chrome to Install
                  </a>
                )}

                <div className="space-y-2.5 leading-relaxed">
                  {(!isAndroid || isIOS) && (
                    <div>
                      <div className="font-bold text-sky-300">iPhone &amp; iPad (iOS)</div>
                      <p className="text-slate-300 mt-0.5">
                        {isIOS && !isIOSSafari ? (
                          <>
                            1. Open the link below in <strong>Safari</strong> (iOS requires Safari to install web apps).<br />
                            2. Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
                          </>
                        ) : (
                          <>
                            1. Open in <strong>Safari</strong> (if a 403 appears, sign into the same Google account in Safari or use AI Studio&apos;s <strong>Share</strong> link).<br />
                            2. Tap the <strong>Share</strong> icon → <strong>Add to Home Screen</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {!isIOS && (
                    <div className="space-y-2">
                      <div>
                        <div className="font-bold text-amber-300">Android (APK &amp; Chrome Install)</div>
                        <p className="text-slate-300 mt-0.5">
                          1. Download &amp; open the <strong>Vaultbound.apk</strong> installer below, or<br />
                          2. Open in <strong>Google Chrome</strong> and tap <strong>Install App</strong> (or <strong>⋮ → Add to Home screen</strong>).
                        </p>
                      </div>
                      <a
                        href="/vaultbound.apk?v=3"
                        download="Vaultbound.apk"
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download Android APK (v1.0.3)
                      </a>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        On Pixel / Android 15+: uninstall any older Vaultbound APK first, allow Chrome/Files to install unknown apps, and if Play Protect prompts tap <strong>More details → Install anyway</strong>.
                      </p>
                    </div>
                  )}

                  {inIframe && (
                    <p className="text-amber-300">
                      Note: Open the copied link directly in a full Safari or Chrome tab to install on your Home Screen.
                    </p>
                  )}
                </div>

                {/* Copyable Mobile URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={mobileUrl}
                    aria-label="Mobile install URL"
                    className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[11px] font-mono-num text-slate-300 truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-amber-400/50 bg-slate-950/92 px-3 py-1.5 text-xs font-semibold text-amber-200 shadow-lg whitespace-nowrap pointer-events-none">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — Playing from cached Vaultbound app</span>
    </div>
  );
};
