import React from 'react';
import { Play } from 'lucide-react';
import introHumanVsRobotImg from '../assets/images/intro_human_vs_robot_1794665477652.jpg';
import { PWAInstallButton } from './PWAInstallButton';

interface IntroScreenProps {
  onPlay: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onPlay }) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="absolute inset-0 z-30 w-full h-full overflow-hidden bg-slate-950">
      {/* Full-Screen Edge-to-Edge Human Aiming vs Robot Key Art */}
      {!imgError ? (
        <img
          src={introHumanVsRobotImg}
          alt="Human hunter aiming a cyan energy blaster at a combat robot sentinel inside a treasure vault"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'radial-gradient(circle at 25% 50%, rgba(14, 165, 233, 0.25), transparent 50%), radial-gradient(circle at 75% 50%, rgba(244, 63, 94, 0.25), transparent 50%), linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e1b4b 100%)',
          }}
        />
      )}

      {/* Subtle radial/vertical scrim keeping Human and Robot crisp while ensuring center title contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/65" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.14) 46%, rgba(2, 6, 23, 0.42) 100%)',
        }}
      />

      {/* Top-Right Android & iOS Install Option */}
      <div className="absolute top-0 right-0 z-20 safe-hud-top flex justify-end pointer-events-auto">
        <PWAInstallButton />
      </div>

      {/* Clean Foreground Overlay */}
      <div className="relative z-10 w-full h-full safe-modal-inset flex flex-col items-center justify-center">
        {/* Centered Colorful Title + Primary Play Button */}
        <div className="flex flex-col items-center justify-center text-center gap-5 sm:gap-7 px-4">
          <h1
            className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-wider uppercase leading-none select-none bg-gradient-to-r from-amber-300 via-cyan-300 to-rose-400 bg-clip-text text-transparent"
            style={{
              filter:
                'drop-shadow(0 4px 0 rgba(15, 23, 42, 0.95)) drop-shadow(0 10px 28px rgba(0, 0, 0, 0.85))',
            }}
          >
            VAULTBOUND
          </h1>

          <button
            type="button"
            onClick={onPlay}
            className="inline-flex items-center justify-center gap-3 px-10 sm:px-14 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:via-amber-400 hover:to-orange-400 text-slate-950 font-display font-bold text-lg sm:text-xl tracking-widest shadow-[0_12px_32px_rgba(245,158,11,0.48)] border border-yellow-200/85 transition-all duration-150 hover:scale-[1.03] active:scale-95 focus-visible:outline-2 focus-visible:outline-white cursor-pointer whitespace-nowrap min-h-[48px]"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950" />
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
};


