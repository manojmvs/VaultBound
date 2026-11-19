export type GamePhase =
  | 'intro'
  | 'level_select'
  | 'level_briefing'
  | 'playing'
  | 'paused'
  | 'level_complete'
  | 'game_over'
  | 'victory';

export type SwitchColor = 'amber' | 'cyan' | 'violet';

export type WeaponKind = 'default' | 'heavy';

export type BotStyle = 'sentinel' | 'enforcer' | 'dreadnought';

export interface LevelTheme {
  id: number;
  name: string;
  subtitle: string;
  jewelleryName: string;
  description: string;
  wallPrimary: string;
  wallSecondary: string;
  wallAccent: string;
  floorPrimary: string;
  floorSecondary: string;
  ceilingColor: string;
  fogColor: string;
  ambientSky: string;
  ambientGround: string;
  keyLightColor: string;
  treasureColor: string;
}

export interface LevelDefinition {
  id: number;
  theme: LevelTheme;
  grid: string[];
  bountyKillsRequired: number;
  startYaw: number;
  parTimeSeconds: number;
  difficultyLabel: string;
  totalCoins: number;
  botCount: number;
  packCount: number;
  gunPickupCount: number;
}

export interface DoorState {
  id: string;
  gridX: number;
  gridZ: number;
  kind: 'switch' | 'bounty' | 'trophy';
  switchColor?: SwitchColor;
  requiredKills?: number;
  unlocked: boolean;
  openProgress: number;
}

export interface SwitchState {
  id: string;
  gridX: number;
  gridZ: number;
  color: SwitchColor;
  activated: boolean;
}

export interface MinimapData {
  cols: number;
  rows: number;
  grid: string[];
  playerX: number;
  playerZ: number;
  playerYaw: number;
  doors: Array<{
    x: number;
    z: number;
    unlocked: boolean;
    kind: 'switch' | 'bounty' | 'trophy';
    color?: SwitchColor;
  }>;
  switches: Array<{ x: number; z: number; activated: boolean; color: SwitchColor }>;
  enemies: Array<{ x: number; z: number; alive: boolean }>;
  coins: Array<{ x: number; z: number; collected: boolean }>;
  packs: Array<{ x: number; z: number; collected: boolean }>;
  medkits: Array<{ x: number; z: number; collected: boolean }>;
  guns: Array<{ x: number; z: number; collected: boolean }>;
  treasure: { x: number; z: number; collected: boolean };
  trophyPath?: Array<{ x: number; z: number }>;
}

export interface HudSnapshot {
  levelId: number;
  totalLevels: number;
  levelName: string;
  jewelleryName: string;
  health: number;
  maxHealth: number;
  activeWeapon: WeaponKind;
  gunBullets: number;
  maxGunBullets: number;
  specialGunBullets: number;
  maxSpecialGunBullets: number;
  bulletPacks: number;
  maxBulletPacks: number;
  reloading: boolean;
  coinsCollected: number;
  totalCoins: number;
  score: number;
  kills: number;
  totalBots: number;
  bountyKillsRequired: number;
  bountyUnlocked: boolean;
  trophyDoorUnlocked: boolean;
  switchesActivated: SwitchColor[];
  switchesTotal: SwitchColor[];
  elapsedSeconds: number;
  shotsFired: number;
  shotsHit: number;
  targetHighlight: 'none' | 'enemy' | 'switch' | 'treasure';
  damageFlash: number;
  healFlash: number;
  deathFade: number;
  slowMoActive: boolean;
  hitMarker: number;
  bannerMessage: string | null;
  bannerTone: 'info' | 'unlock' | 'warning' | 'treasure';
  trophyDistance: number;
  trophyBearingDeg: number;
  minimap: MinimapData;
}

export interface LevelProgressRecord {
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  bestTime: number | null;
}

export interface ControlInputState {
  moveForward: number;
  moveStrafe: number;
  turnDelta: number;
  aimDeltaX: number;
  aimDeltaY: number;
  firing: boolean;
}

export interface CoinCollectEvent {
  id: number;
  kind: 'coin' | 'pack' | 'trophy' | 'gun' | 'medkit';
  startXPercent: number;
  startYPercent: number;
  points: number;
  switchColor?: SwitchColor;
}
