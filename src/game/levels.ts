import { BotStyle, LevelDefinition, LevelTheme } from './types';

export const TILE_SIZE = 3.2;
export const WALL_HEIGHT = 3.4;

interface BiomePalette {
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

const BIOMES: BiomePalette[] = [
  {
    wallPrimary: '#36495e',
    wallSecondary: '#273545',
    wallAccent: '#f59e0b',
    floorPrimary: '#475569',
    floorSecondary: '#3b4759',
    ceilingColor: '#1e293b',
    fogColor: '#1a2436',
    ambientSky: '#93c5fd',
    ambientGround: '#475569',
    keyLightColor: '#fde68a',
    treasureColor: '#fbbf24',
  },
  {
    wallPrimary: '#1e3a5f',
    wallSecondary: '#162b47',
    wallAccent: '#06b6d4',
    floorPrimary: '#334155',
    floorSecondary: '#263244',
    ceilingColor: '#0f172a',
    fogColor: '#111d33',
    ambientSky: '#67e8f9',
    ambientGround: '#334155',
    keyLightColor: '#e0f2fe',
    treasureColor: '#22d3ee',
  },
  {
    wallPrimary: '#4a2535',
    wallSecondary: '#361926',
    wallAccent: '#f43f5e',
    floorPrimary: '#3f3542',
    floorSecondary: '#312834',
    ceilingColor: '#1f121b',
    fogColor: '#23131e',
    ambientSky: '#fda4af',
    ambientGround: '#4a2535',
    keyLightColor: '#fef08a',
    treasureColor: '#fb7185',
  },
  {
    wallPrimary: '#1b4332',
    wallSecondary: '#122e22',
    wallAccent: '#10b981',
    floorPrimary: '#2d3e37',
    floorSecondary: '#22302a',
    ceilingColor: '#0d1f18',
    fogColor: '#10241c',
    ambientSky: '#6ee7b7',
    ambientGround: '#1b4332',
    keyLightColor: '#d1fae5',
    treasureColor: '#34d399',
  },
  {
    wallPrimary: '#2e2545',
    wallSecondary: '#201933',
    wallAccent: '#a855f7',
    floorPrimary: '#2b283b',
    floorSecondary: '#211e2e',
    ceilingColor: '#120e1f',
    fogColor: '#171226',
    ambientSky: '#c4b5fd',
    ambientGround: '#2e2545',
    keyLightColor: '#fde68a',
    treasureColor: '#facc15',
  },
  {
    wallPrimary: '#3f3222',
    wallSecondary: '#2c2216',
    wallAccent: '#fb923c',
    floorPrimary: '#3b352e',
    floorSecondary: '#2d2822',
    ceilingColor: '#1c1610',
    fogColor: '#211912',
    ambientSky: '#fdba74',
    ambientGround: '#3f3222',
    keyLightColor: '#fef3c7',
    treasureColor: '#f59e0b',
  },
];

const LEVEL_NAMES = [
  'Sunlit Coin Courtyard',
  'Cobalt Ammo Foundry',
  'Crimson Ring Sanctum',
  'Emerald Crossroads Keep',
  'Obsidian Spiral Vault',
  'Amber Switchback Wing',
  'Azure Colonnade Hall',
  'Scarlet Twin-Bridge',
  'Jade Core Rotunda',
  'Violet Bastion Maze',
  'Solar Spiral Depths',
  'Tidal Serpentine Lock',
  'Ruby Pillar Cathedral',
  'Verdant Split Citadel',
  'Amethyst Ring Archive',
  'Gilded Quadrant Vault',
  'Cerulean Helix Keep',
  'Garnet Conduit Wing',
  'Malachite Nave Hall',
  'Twilight Bridge Keep',
  'Bronze Inner Rotunda',
  'Froststeel Crossroads',
  'Magma Spiral Core',
  'Mossguard Switchback',
  'Astral Pillared Spire',
  'Ochre Twin Fortress',
  'Deepwater Ring Nexus',
  'Bloodstone Bastion',
  'Prismatic Helix Sanctum',
  'Sovereign Apex Citadel',
];

const JEWELLERY_NAMES = [
  'Sunburst Gold Brooch',
  'Cobalt Sapphire Tiara',
  'Crimson Ruby Pendant',
  'Verdant Emerald Anklet',
  'Royal Amethyst Crown',
  'Amber Topaz Signet',
  'Azure Pearl Diadem',
  'Scarlet Garnet Locket',
  'Jade Lotus Bracelet',
  'Violet Star Necklace',
  'Solar Citrine Medallion',
  'Aquamarine Crest Ring',
  'Ruby Sovereign Choker',
  'Emerald Canopy Torque',
  'Amethyst Prism Scepter',
  'Gilded Filigree Earcuff',
  'Cerulean Moonstone Orb',
  'Garnet Imperial Clasp',
  'Malachite Relic Bangle',
  'Twilight Opal Brooch',
  'Bronze Sunburst Tiara',
  'Frost Diamond Pendant',
  'Fire Opal Crownlet',
  'Emerald Heart Locket',
  'Astral Sapphire Necklace',
  'Golden Amber Circlet',
  'Oceanic Pearl Coronet',
  'Bloodstone Sovereign Ring',
  'Prismatic Jewel Chalice',
  'Imperial Star Crown',
];

const BOT_STYLE_CHAR: Record<BotStyle, string> = {
  sentinel: '1',
  striker: '2',
  enforcer: '3',
  dreadnought: '4',
};

export function getBotRosterForLevel(levelId: number): BotStyle[] {
  switch (levelId) {
    case 1:
      // Level 1: Coin Collection Tutorial (zero enemies)
      return [];
    case 2:
      // Level 2: Enemy + Bullet Pack Introduction (1 Sentinel)
      return ['sentinel'];
    case 3:
      return ['sentinel', 'sentinel'];
    case 4:
      // Striker Drone debuts — mixed squad begins
      return ['sentinel', 'sentinel', 'striker'];
    case 5:
      return ['sentinel', 'striker', 'striker'];
    case 6:
      return ['sentinel', 'sentinel', 'striker', 'striker'];
    case 7:
      return ['sentinel', 'striker', 'striker', 'striker'];
    case 8:
      // Armored Enforcer debuts alongside Sentinels & Strikers
      return ['sentinel', 'sentinel', 'striker', 'enforcer'];
    case 9:
      return ['sentinel', 'striker', 'striker', 'enforcer'];
    case 10:
      return ['sentinel', 'sentinel', 'striker', 'striker', 'enforcer'];
    case 11:
      return ['sentinel', 'striker', 'striker', 'enforcer', 'enforcer'];
    case 12:
      return ['sentinel', 'sentinel', 'striker', 'enforcer', 'enforcer'];
    case 13:
      return ['sentinel', 'sentinel', 'striker', 'striker', 'enforcer', 'enforcer'];
    case 14:
      return ['sentinel', 'striker', 'striker', 'striker', 'enforcer', 'enforcer'];
    case 15:
      return ['sentinel', 'striker', 'striker', 'enforcer', 'enforcer', 'enforcer'];
    case 16:
      // Heavy Dreadnought debuts leading a 4-class mixed squad
      return ['sentinel', 'sentinel', 'striker', 'striker', 'enforcer', 'dreadnought'];
    case 17:
      return ['sentinel', 'striker', 'striker', 'enforcer', 'enforcer', 'dreadnought'];
    case 18:
      return ['sentinel', 'sentinel', 'striker', 'striker', 'enforcer', 'enforcer', 'dreadnought'];
    case 19:
      return ['sentinel', 'striker', 'striker', 'enforcer', 'enforcer', 'enforcer', 'dreadnought'];
    case 20:
      return ['sentinel', 'striker', 'striker', 'enforcer', 'enforcer', 'dreadnought', 'dreadnought'];
    case 21:
      return [
        'sentinel',
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
      ];
    case 22:
      return [
        'sentinel',
        'striker',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
      ];
    case 23:
      return [
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
      ];
    case 24:
      return [
        'sentinel',
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    case 25:
      return [
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    case 26:
      return [
        'sentinel',
        'striker',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    case 27:
      return [
        'sentinel',
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    case 28:
      return [
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    case 29:
      return [
        'sentinel',
        'striker',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
    default:
      // Level 30 Finale: Full 11-bot elite mixed garrison
      return [
        'sentinel',
        'striker',
        'striker',
        'enforcer',
        'enforcer',
        'enforcer',
        'enforcer',
        'dreadnought',
        'dreadnought',
        'dreadnought',
        'dreadnought',
      ];
  }
}

function summarizeBotMix(roster: BotStyle[]): Partial<Record<BotStyle, number>> {
  const mix: Partial<Record<BotStyle, number>> = {};
  for (const style of roster) {
    mix[style] = (mix[style] ?? 0) + 1;
  }
  return mix;
}

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDifficultyLabel(id: number): string {
  if (id === 1) return 'Coin Tutorial';
  if (id === 2) return 'Combat Tutorial';
  if (id <= 5) return 'Recruit';
  if (id <= 10) return 'Explorer';
  if (id <= 16) return 'Tactician';
  if (id <= 23) return 'Enforcer';
  return 'Dreadnought';
}

interface Coord {
  x: number;
  z: number;
}

type LayoutArchetype =
  | 'coin_tutorial'
  | 'ammo_foundry'
  | 'central_ring'
  | 'quadrant_bastion'
  | 'spiral_vault'
  | 'serpentine_gallery'
  | 'cathedral_nave'
  | 'twin_bridge';

interface BlueprintResult {
  grid: string[][];
  spawn: Coord;
  trophy: Coord;
  trophyDoor: Coord;
  sanctumCells: Set<string>;
  layoutName: string;
}

function isInside(x: number, z: number, cols: number, rows: number): boolean {
  return x > 0 && z > 0 && x < cols - 1 && z < rows - 1;
}

function makeSolidGrid(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => '#'));
}

function carveRect(
  grid: string[][],
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  val = '.',
) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      if (isInside(x, z, cols, rows)) {
        grid[z][x] = val;
      }
    }
  }
}

function computeReachable(
  grid: string[][],
  start: Coord,
  unlockedSwitches: Set<string>,
  bountyOpen: boolean,
  trophyOpen = false,
): Set<string> {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const queue: Coord[] = [start];
  visited.add(`${start.x},${start.z}`);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const [dx, dz] of dirs) {
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
      const key = `${nx},${nz}`;
      if (visited.has(key)) continue;

      const ch = grid[nz][nx];
      if (ch === '#' || ch === 'C') continue;
      if (ch === 'A' && !unlockedSwitches.has('a')) continue;
      if (ch === 'B' && !unlockedSwitches.has('b')) continue;
      if (ch === 'V' && !unlockedSwitches.has('v')) continue;
      if (ch === 'K' && !bountyOpen) continue;
      if (ch === 'F' && !trophyOpen) continue;

      visited.add(key);
      queue.push({ x: nx, z: nz });
    }
  }
  return visited;
}

function hasGridLineOfSight(
  grid: string[][],
  x1: number,
  z1: number,
  x2: number,
  z2: number,
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const steps = Math.max(2, Math.ceil(Math.hypot(dx, dz) * 3));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const gx = Math.round(x1 + dx * t);
    const gz = Math.round(z1 + dz * t);
    const ch = grid[gz]?.[gx];
    if (
      !ch ||
      ch === '#' ||
      ch === 'C' ||
      ch === 'A' ||
      ch === 'B' ||
      ch === 'V' ||
      ch === 'K' ||
      ch === 'F'
    ) {
      return false;
    }
  }
  return true;
}

function transformGrid(
  grid: string[][],
  rot90: 0 | 1 | 2 | 3,
  flipX: boolean,
): string[][] {
  let current = grid.map((r) => [...r]);

  if (flipX) {
    current = current.map((row) => [...row].reverse());
  }

  for (let r = 0; r < rot90; r++) {
    const oldRows = current.length;
    const oldCols = current[0].length;
    const next = Array.from({ length: oldCols }, () => Array.from({ length: oldRows }, () => '#'));
    for (let z = 0; z < oldRows; z++) {
      for (let x = 0; x < oldCols; x++) {
        next[x][oldRows - 1 - z] = current[z][x];
      }
    }
    current = next;
  }

  return current;
}

function transformCoord(
  c: Coord,
  cols: number,
  rows: number,
  rot90: 0 | 1 | 2 | 3,
  flipX: boolean,
): Coord {
  let x = flipX ? cols - 1 - c.x : c.x;
  let z = c.z;
  let curCols = cols;
  let curRows = rows;
  for (let r = 0; r < rot90; r++) {
    const nx = curRows - 1 - z;
    const nz = x;
    x = nx;
    z = nz;
    const tmp = curCols;
    curCols = curRows;
    curRows = tmp;
  }
  return { x, z };
}

function computeTrophyZoneLabel(trophy: Coord, cols: number, rows: number): string {
  const rx = trophy.x / (cols - 1);
  const rz = trophy.z / (rows - 1);
  if (rx >= 0.34 && rx <= 0.66 && rz >= 0.34 && rz <= 0.66) {
    return 'Center Vault';
  }
  const v = rz < 0.34 ? 'North' : rz > 0.66 ? 'South' : '';
  const h = rx < 0.34 ? 'West' : rx > 0.66 ? 'East' : '';
  if (v && h) return `${v}-${h} Sanctum`;
  if (v) return `${v} Vault`;
  if (h) return `${h} Wing`;
  return 'Inner Sanctum';
}

function computeBestStartYaw(grid: string[][], spawn: Coord): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const dirs: Array<{ dx: number; dz: number; yaw: number }> = [
    { dx: 0, dz: -1, yaw: 0 }, // North (-Z)
    { dx: 1, dz: 0, yaw: -Math.PI / 2 }, // East (+X)
    { dx: 0, dz: 1, yaw: Math.PI }, // South (+Z)
    { dx: -1, dz: 0, yaw: Math.PI / 2 }, // West (-X)
  ];

  let bestScore = -1;
  let bestYaw = 0;
  for (const d of dirs) {
    let score = 0;
    for (let step = 1; step <= 8; step++) {
      const nx = spawn.x + d.dx * step;
      const nz = spawn.z + d.dz * step;
      if (nx <= 0 || nz <= 0 || nx >= cols - 1 || nz >= rows - 1) break;
      const ch = grid[nz][nx];
      if (ch === '#' || ch === 'C' || ch === 'A' || ch === 'B' || ch === 'V' || ch === 'K' || ch === 'F') {
        break;
      }
      score += 1;
      // Slight bonus if a coin, bullet pack, or switch is directly visible down this sightline
      if (ch === 'O' || ch === 'E' || ch === 'a') {
        score += 2.5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestYaw = d.yaw;
    }
  }
  return bestYaw;
}

// ============================================================================
// 8 DISTINCT ARCHITECTURAL PLAY-AREA BLUEPRINTS
// ============================================================================

/** Blueprint 1: Level 1 Handcrafted Coin Collection Tutorial Courtyard (11x9) */
function buildCoinTutorialBlueprint(): BlueprintResult {
  const cols = 11;
  const rows = 9;
  const grid = makeSolidGrid(cols, rows);

  // West Courtyard (Spawn + opening coins + Amber Switch)
  carveRect(grid, 1, 1, 4, 7, '.');
  // Decorative center pillar in West Courtyard for spatial depth
  grid[4][2] = '#';

  // East Treasury Gallery (behind Amber Door A)
  carveRect(grid, 6, 4, 9, 7, '.');
  carveRect(grid, 6, 1, 6, 4, '.');
  // Open hallway from East Gallery up to East-North Trophy Door F
  carveRect(grid, 6, 3, 9, 4, '.');

  // Amber Door A in solid vertical divider at x=5
  grid[6][5] = 'A';

  // East-North Corner Trophy Sanctum (rows 1..1, cols 8..9) sealed by F at (7,1)
  carveRect(grid, 8, 1, 9, 1, '.');
  grid[2][7] = '#';
  grid[2][8] = '#';
  grid[2][9] = '#';
  grid[1][7] = 'F';

  const spawn: Coord = { x: 2, z: 7 };
  const trophy: Coord = { x: 9, z: 1 };
  const trophyDoor: Coord = { x: 7, z: 1 };

  grid[spawn.z][spawn.x] = 'S';
  grid[trophy.z][trophy.x] = 'T';
  // Amber switch clearly placed in North-West alcove
  grid[2][3] = 'a';

  // Curated coin trail guiding the player smoothly through every room
  const coins: Coord[] = [
    { x: 2, z: 5 }, // Right ahead of spawn!
    { x: 4, z: 6 }, // Near Amber Gate
    { x: 1, z: 2 }, // Near Amber Switch
    { x: 7, z: 6 }, // Inside East Gallery
    { x: 9, z: 7 }, // Far South-East alcove
    { x: 8, z: 4 }, // Along approach to Trophy Door
  ];
  for (const c of coins) {
    grid[c.z][c.x] = 'O';
  }

  // Two light tactical crates so the courtyard feels crafted
  grid[6][8] = 'C';
  grid[3][4] = 'C';

  const sanctumCells = new Set<string>(['8,1', '9,1']);
  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Sunlit Tutorial Plaza',
  };
}

/** Blueprint 2: Level 2 Handcrafted Enemy + Bullet Pack Introduction Foundry (13x11) */
function buildAmmoFoundryBlueprint(): BlueprintResult {
  const cols = 13;
  const rows = 11;
  const grid = makeSolidGrid(cols, rows);

  // South Entry Corridor & Staging Wing (Player starts SE, sees Blue Bullet Packs ahead!)
  carveRect(grid, 5, 7, 11, 9, '.');
  carveRect(grid, 1, 6, 4, 9, '.');
  // Wall dividing SE Entry from SW Switch Workshop with a clean doorway
  for (let z = 6; z <= 9; z++) grid[z][5] = '#';
  grid[8][5] = '.';

  // North Combat Foundry Arena (where the 1 Sentinel patrols behind cover, separated by row 5)
  carveRect(grid, 5, 1, 11, 4, '.');
  carveRect(grid, 1, 3, 4, 4, '.');

  // Amber Gate A in solid horizontal ridge (z=5) connecting SW Workshop to North Arena
  grid[5][3] = 'A';

  // North-West Corner Trophy Sanctum (rows 1..1, cols 1..3), sealed by F at (4, 1)
  carveRect(grid, 1, 1, 3, 1, '.');
  grid[2][1] = '#';
  grid[2][2] = '#';
  grid[2][3] = '#';
  grid[2][4] = '#';
  grid[1][4] = 'F';

  const spawn: Coord = { x: 10, z: 8 };
  const trophy: Coord = { x: 1, z: 1 };
  const trophyDoor: Coord = { x: 4, z: 1 };

  grid[spawn.z][spawn.x] = 'S';
  grid[trophy.z][trophy.x] = 'T';
  grid[7][2] = 'a'; // Amber switch in SW Workshop

  // Guaranteed glowing Blue Bullet Packs right in front of the player in the starting wing!
  grid[8][8] = 'E';
  grid[8][6] = 'E';
  grid[6][3] = 'E'; // Extra pack right before entering North Arena

  // Single Sentinel Bot in North-East Foundry Arena (zero direct LOS from spawn)
  grid[2][9] = '1';

  // Cover crates in the combat arena for duck-and-shoot practice
  grid[3][7] = 'C';
  grid[2][6] = 'C';
  grid[4][10] = 'C';

  // 6 Gold Coins distributed across both wings
  const coins: Coord[] = [
    { x: 9, z: 7 },
    { x: 2, z: 9 },
    { x: 1, z: 6 },
    { x: 6, z: 4 },
    { x: 11, z: 2 },
    { x: 6, z: 1 },
  ];
  for (const c of coins) {
    grid[c.z][c.x] = 'O';
  }

  const sanctumCells = new Set<string>(['1,1', '2,1', '3,1']);
  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'L-Wing Ammo Foundry',
  };
}

/** Blueprint 3: Central Inner Vault surrounded by a 360° Ring Gallery (Trophy in CENTER!) */
function buildCentralRingBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);
  const cx = Math.floor(cols / 2);
  const cz = Math.floor(rows / 2);

  // Carve full outer playable arena
  carveRect(grid, 1, 1, cols - 2, rows - 2, '.');

  // Build fortified 3x3 wall ring enclosing the exact Center Vault (cx, cz)
  const sx1 = cx - 2;
  const sx2 = cx + 2;
  const sz1 = cz - 2;
  const sz2 = cz + 2;
  carveRect(grid, sx1, sz1, sx2, sz2, '#');
  // Carve 3x3 inner sanctum chamber around center
  carveRect(grid, cx - 1, cz - 1, cx + 1, cz + 1, '.');

  // Trophy sits dead center; Trophy Door F sits on the East face of the central fortress
  const trophy: Coord = { x: cx, z: cz };
  const trophyDoor: Coord = { x: sx2, z: cz };
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  // Four radial bulkhead walls dividing the 360° outer ring into 4 progressive sectors:
  // 1) South divider (solid wall separating SW Start from SE Final Sector!)
  for (let z = sz2 + 1; z <= rows - 2; z++) {
    grid[z][cx] = '#';
  }
  // 2) West divider (Amber Door A connecting SW Start -> NW Sector)
  for (let x = 1; x <= sx1 - 1; x++) {
    grid[cz][x] = '#';
  }
  const doorAX = Math.max(1, Math.min(sx1 - 1, Math.floor(sx1 / 2)));
  grid[cz][doorAX] = 'A';

  // 3) North divider (Cyan Door B if enabled, else open archway connecting NW -> NE Sector)
  for (let z = 1; z <= sz1 - 1; z++) {
    grid[z][cx] = '#';
  }
  const doorBZ = Math.max(1, Math.min(sz1 - 1, Math.floor(sz1 / 2)));
  grid[doorBZ][cx] = opts.useCyan ? 'B' : '.';

  // 4) East divider (Violet Door V or Bounty Door K connecting NE -> SE Sanctum Approach)
  for (let x = sx2 + 1; x <= cols - 2; x++) {
    grid[cz - 1][x] = '#';
  }
  const doorEX = Math.max(sx2 + 1, Math.min(cols - 2, sx2 + 1 + Math.floor((cols - 2 - sx2) / 2)));
  if (opts.useViolet) {
    grid[cz - 1][doorEX] = 'V';
  } else if (opts.useBounty) {
    grid[cz - 1][doorEX] = 'K';
  } else {
    grid[cz - 1][doorEX] = '.';
  }

  // If both Violet and Bounty are active, add a Bounty Gate along the South-East approach
  if (opts.useViolet && opts.useBounty && cols - 2 - sx2 >= 3) {
    for (let x = sx2 + 1; x <= cols - 2; x++) {
      grid[cz + 1][x] = '#';
    }
    grid[cz + 1][cols - 2] = 'K';
  }

  // Add architectural corner pillars on larger maps for richer sightlines
  if (cols >= 15 && rows >= 13) {
    if (grid[2][2] === '.') grid[2][2] = '#';
    if (grid[2][cols - 3] === '.') grid[2][cols - 3] = '#';
    if (grid[rows - 3][2] === '.') grid[rows - 3][2] = '#';
    if (grid[rows - 3][cols - 3] === '.') grid[rows - 3][cols - 3] = '#';
  }

  const spawn: Coord = { x: 2, z: rows - 2 };
  const sanctumCells = new Set<string>();
  for (let z = cz - 1; z <= cz + 1; z++) {
    for (let x = cx - 1; x <= cx + 1; x++) {
      sanctumCells.add(`${x},${z}`);
    }
  }

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Central Sanctum Ring',
  };
}

/** Blueprint 4: 4-Quadrant Bastion with Central Crossroads Hub & Corner Sanctum */
function buildQuadrantBastionBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);
  const mx = Math.floor(cols / 2);
  const mz = Math.floor(rows / 2);

  // Carve 4 large quadrant chambers
  carveRect(grid, 1, 1, mx - 1, mz - 1, '.'); // NW
  carveRect(grid, mx + 1, 1, cols - 2, mz - 1, '.'); // NE
  carveRect(grid, 1, mz + 1, mx - 1, rows - 2, '.'); // SW (Start)
  carveRect(grid, mx + 1, mz + 1, cols - 2, rows - 2, '.'); // SE (Trophy Wing)

  // Carve Central Crossroads Atrium (3x3)
  carveRect(grid, mx - 1, mz - 1, mx + 1, mz + 1, '.');
  // Seal the 4 cardinal cross-walls except gated entries so quadrants stay distinct
  grid[mz][mx - 1] = '#';
  grid[mz][mx + 1] = '#';
  grid[mz - 1][mx] = '#';
  grid[mz + 1][mx] = '#';

  // Open SW -> NW (free exploration)
  const swNwX = Math.max(2, Math.floor(mx / 2));
  grid[mz][swNwX] = '.';

  // Amber Gate A connects NW -> NE across vertical spine x=mx
  const aZ = Math.max(2, Math.floor(mz / 2));
  grid[aZ][mx] = 'A';

  // Cyan Gate B (or open) connects NE -> SE across horizontal ridge z=mz
  const bX = Math.min(cols - 2, mx + 1 + Math.floor((cols - 2 - mx) / 2));
  grid[mz][bX] = opts.useCyan ? 'B' : '.';

  // Optional extra loop from SW -> Central Hub -> NE when spacious
  if (cols >= 15) {
    // Carve an open pillared vestibule in NW & NE
    grid[2][2] = '#';
    grid[2][cols - 3] = '#';
  }

  // Seal Trophy Sanctum deep in the South-East corner (rows-2, cols-3..cols-2)
  const sanctumW = cols >= 15 ? 3 : 2;
  const sLeft = cols - 1 - sanctumW;
  const sTop = rows - 3;
  // Build wall enclosure around SE corner
  for (let x = sLeft - 1; x <= cols - 2; x++) {
    grid[sTop][x] = '#';
  }
  for (let z = sTop; z <= rows - 2; z++) {
    grid[z][sLeft - 1] = '#';
  }
  carveRect(grid, sLeft, sTop + 1, cols - 2, rows - 2, '.');

  const trophy: Coord = { x: cols - 2, z: rows - 2 };
  const trophyDoor: Coord = { x: cols - 2, z: sTop };
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  // Place Violet / Bounty gates cleanly inside the SE wing without blocking Trophy Door F
  if (sTop - mz >= 4) {
    const midSeZ = mz + 2;
    for (let x = mx + 1; x <= cols - 2; x++) {
      grid[midSeZ][x] = '#';
    }
    const gateX = Math.min(cols - 2, mx + 2);
    if (opts.useViolet) {
      grid[midSeZ][gateX] = 'V';
      if (opts.useBounty && sTop - midSeZ >= 3) {
        const kZ = midSeZ + 2;
        for (let x = mx + 1; x <= cols - 2; x++) {
          grid[kZ][x] = '#';
        }
        grid[kZ][cols - 2] = 'K';
      } else if (opts.useBounty && cols - 2 - mx >= 4) {
        // Place Bounty gate vertically inside the lower SE hall before F
        const kX = sLeft - 1;
        for (let z = midSeZ + 1; z <= sTop - 1; z++) {
          grid[z][kX] = '#';
        }
        grid[midSeZ + 1][kX] = 'K';
      }
    } else if (opts.useBounty) {
      grid[midSeZ][gateX] = 'K';
    } else {
      grid[midSeZ][gateX] = '.';
    }
  } else if (opts.useBounty && sLeft - 1 > mx + 1) {
    // Compact SE hall (rows = 11): place a clean vertical Bounty bulkhead before the Sanctum
    const kX = sLeft - 1;
    for (let z = mz + 1; z <= sTop - 1; z++) {
      grid[z][kX] = '#';
    }
    // Ensure B enters on the West side of kX (flanked by wall tiles at mx+1 and kX)
    if (bX >= kX) {
      grid[mz][bX] = '#';
      grid[mz][mx + 2] = opts.useCyan ? 'B' : '.';
    }
    grid[mz + 1][kX] = 'K';
  }

  const spawn: Coord = { x: 2, z: rows - 2 };
  const sanctumCells = new Set<string>();
  for (let z = sTop + 1; z <= rows - 2; z++) {
    for (let x = sLeft; x <= cols - 2; x++) {
      sanctumCells.add(`${x},${z}`);
    }
  }

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Four-Quadrant Bastion',
  };
}

/** Blueprint 5: Inward Spiral Labyrinth (Trophy tucked inside inner spiral core!) */
function buildSpiralVaultBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);

  // Outer perimeter track (2-tile wide on large maps, 1-2 tile wide on medium)
  carveRect(grid, 1, 1, cols - 2, 2, '.'); // North outer hall
  carveRect(grid, 1, rows - 3, cols - 2, rows - 2, '.'); // South outer hall
  carveRect(grid, 1, 1, 2, rows - 2, '.'); // West outer hall
  carveRect(grid, cols - 3, 1, cols - 2, rows - 2, '.'); // East outer hall

  // Inner chamber inside the spiral ring (separated by wall ring at x=3, x=cols-4, z=3, z=rows-4)
  const ix1 = 4;
  const ix2 = cols - 5;
  const iz1 = 4;
  const iz2 = rows - 5;
  if (ix2 >= ix1 && iz2 >= iz1) {
    carveRect(grid, ix1, iz1, ix2, iz2, '.');
  }

  // Seal outer West corridor below North corner so the spiral winds cleanly:
  // Start SW (1, rows-2) -> East along South -> North along East -> West along North -> into Inner Core!
  grid[rows - 4][1] = '#';
  grid[rows - 4][2] = '#';

  // Amber Gate A on East outer hallway (halfway up)
  const aZ = Math.floor(rows / 2);
  grid[aZ][cols - 2] = '#';
  grid[aZ][cols - 3] = 'A';

  // Cyan Gate B (or open) on North outer hallway (halfway across)
  const bX = Math.floor(cols / 2);
  grid[1][bX] = '#';
  grid[2][bX] = opts.useCyan ? 'B' : '.';

  // Entry from North-West outer ring into Inner Core at (3, iz1)
  const innerEntryZ = Math.min(rows - 5, iz1);
  grid[innerEntryZ][3] = opts.useViolet ? 'V' : opts.useBounty ? 'K' : '.';

  // Inside the Inner Core, seal an inner Trophy Chamber on the East side of the core!
  const coreMidX = Math.max(ix1 + 1, Math.floor((ix1 + ix2) / 2));
  const trophy: Coord = { x: ix2, z: Math.floor((iz1 + iz2) / 2) };
  const trophyDoor: Coord = { x: Math.max(ix1 + 1, ix2 - 1), z: trophy.z };

  // Build vertical sanctum divider inside inner core at x = trophyDoor.x
  for (let z = iz1; z <= iz2; z++) {
    grid[z][trophyDoor.x] = '#';
  }
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  // If both Violet & Bounty are active and core has width, put Bounty gate K across inner core
  if (opts.useViolet && opts.useBounty && trophyDoor.x - ix1 >= 3) {
    const kX = Math.max(ix1 + 1, coreMidX - 1);
    if (kX < trophyDoor.x - 1) {
      for (let z = iz1; z <= iz2; z++) {
        grid[z][kX] = '#';
      }
      grid[iz2][kX] = 'K';
    }
  }

  // Add decorative alcove pockets in the outer wall band for coins & cover
  if (rows >= 13) {
    grid[rows - 4][Math.floor(cols / 2)] = '.';
  }

  const spawn: Coord = { x: 1, z: rows - 2 };
  const sanctumCells = new Set<string>();
  for (let z = iz1; z <= iz2; z++) {
    for (let x = trophyDoor.x + 1; x <= ix2; x++) {
      sanctumCells.add(`${x},${z}`);
    }
  }

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Spiral Core Labyrinth',
  };
}

/** Blueprint 6: Serpentine S-Curve Switchback Galleries (3 staggered tiers) */
function buildSerpentineGalleryBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);
  const w1 = Math.max(3, Math.floor(rows / 3));
  const w2 = Math.min(rows - 4, Math.floor((rows * 2) / 3));

  // Carve 3 wide horizontal tiers
  carveRect(grid, 1, 1, cols - 2, w1 - 1, '.'); // North Tier (Trophy Tier)
  carveRect(grid, 1, w1 + 1, cols - 2, w2 - 1, '.'); // Middle Tier
  carveRect(grid, 1, w2 + 1, cols - 2, rows - 2, '.'); // South Tier (Start Tier)

  // S-curve staggered doorways:
  // South -> Middle on the EAST end (Amber Gate A)
  const gate1X = cols - 2;
  grid[w2][gate1X] = 'A';

  // Middle -> North on the WEST end (Cyan Gate B if enabled, else open)
  const gate2X = 1;
  grid[w1][gate2X] = opts.useCyan ? 'B' : '.';

  // Add alternating cover alcoves inside Middle Tier so it plays like a tactical gallery
  if (cols >= 15 && w2 - w1 >= 4) {
    const midZ = Math.floor((w1 + w2) / 2);
    grid[midZ][Math.floor(cols * 0.33)] = '#';
    grid[midZ][Math.floor(cols * 0.66)] = '#';
  }

  // Optional Violet / Bounty bulkhead midway across North Tier
  const sanctumLeft = cols - 3;
  const northMidX = Math.max(3, Math.floor(cols / 2));
  if (opts.useViolet && northMidX < sanctumLeft - 2) {
    for (let z = 1; z <= w1 - 1; z++) {
      grid[z][northMidX] = '#';
    }
    grid[Math.max(1, w1 - 1)][northMidX] = 'V';
  }
  if (opts.useBounty && northMidX + 2 < sanctumLeft) {
    const kX = opts.useViolet ? northMidX + 2 : northMidX;
    for (let z = 1; z <= w1 - 1; z++) {
      grid[z][kX] = '#';
    }
    grid[1][kX] = 'K';
  }

  // Seal Trophy Sanctum at the far EAST end of the North Tier
  for (let z = 1; z <= w1 - 1; z++) {
    grid[z][sanctumLeft] = '#';
  }
  const trophyZ = Math.max(1, Math.floor(w1 / 2));
  const trophyDoor: Coord = { x: sanctumLeft, z: trophyZ };
  const trophy: Coord = { x: cols - 2, z: trophyZ };
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  const spawn: Coord = { x: 2, z: rows - 2 };
  const sanctumCells = new Set<string>();
  for (let z = 1; z <= w1 - 1; z++) {
    for (let x = sanctumLeft + 1; x <= cols - 2; x++) {
      sanctumCells.add(`${x},${z}`);
    }
  }

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Serpentine Switchback',
  };
}

/** Blueprint 7: Grand Pillared Cathedral Colonnade + Gated Side Chapels */
function buildCathedralNaveBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);
  const mx = Math.floor(cols / 2);

  // Central Nave (wide pillared hall running South -> North)
  const naveL = Math.max(4, mx - 2);
  const naveR = Math.min(cols - 5, mx + 2);
  carveRect(grid, naveL, 4, naveR, rows - 2, '.');

  // West Side Chapel & East Side Chapel
  carveRect(grid, 1, 4, naveL - 2, rows - 2, '.');
  carveRect(grid, naveR + 2, 4, cols - 2, rows - 2, '.');

  // North Choir Hall spanning across the top (z = 1..2)
  carveRect(grid, 1, 1, cols - 2, 2, '.');

  // Connect Central Nave to West Chapel openly at South-West
  grid[rows - 3][naveL - 1] = '.';

  // Gate East Chapel from Central Nave via Amber Door A
  const aZ = Math.max(5, Math.floor(rows * 0.6));
  grid[aZ][naveR + 1] = 'A';

  // Gate East Chapel -> North Choir Hall via Cyan Door B (or open)
  grid[3][cols - 2] = opts.useCyan ? 'B' : '.';

  // Rhythmic structural colonnade pillars inside Central Nave (never blocking doors)
  for (let z = 6; z <= rows - 4; z += 3) {
    if (Math.abs(z - aZ) > 1 && naveR - naveL >= 4) {
      grid[z][mx] = '#';
    }
  }

  // Seal Trophy Sanctum in the North-West Apse (cols 1..2, rows 1..2)
  const apseWallX = 3;
  grid[1][apseWallX] = '#';
  grid[2][apseWallX] = '#';
  const trophyDoor: Coord = { x: apseWallX, z: 1 };
  const trophy: Coord = { x: 1, z: 1 };
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  // Place Violet / Bounty checkpoints along North Choir Hall heading West toward Apse
  if (opts.useViolet && mx > apseWallX + 2) {
    grid[1][mx] = '#';
    grid[2][mx] = 'V';
  }
  if (opts.useBounty) {
    const kX = opts.useViolet ? Math.max(apseWallX + 2, mx - 2) : mx;
    if (kX > apseWallX + 1 && kX < cols - 3) {
      grid[1][kX] = 'K';
      grid[2][kX] = '#';
    }
  }

  const spawn: Coord = { x: mx, z: rows - 2 };
  const sanctumCells = new Set<string>(['1,1', '2,1', '1,2', '2,2']);

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Pillared Cathedral Nave',
  };
}

/** Blueprint 8: Split Twin-Keep Fortress connected by Dual Gated Bridges */
function buildTwinBridgeBlueprint(
  cols: number,
  rows: number,
  opts: { useCyan: boolean; useViolet: boolean; useBounty: boolean },
): BlueprintResult {
  const grid = makeSolidGrid(cols, rows);
  const mx = Math.floor(cols / 2);
  const mz = Math.floor(rows / 2);

  // West Keep (South-West Start Hall + North-West Armory)
  carveRect(grid, 1, 1, mx - 2, rows - 2, '.');
  // Internal partition inside West Keep with a flank doorway
  for (let x = 1; x <= mx - 2; x++) {
    grid[mz][x] = '#';
  }
  grid[mz][1] = '.';
  if (mx - 2 >= 4) {
    grid[mz][mx - 2] = '.';
  }

  // East Keep (South-East Courtyard + North-East Citadel)
  carveRect(grid, mx + 2, 1, cols - 2, rows - 2, '.');
  // Internal partition inside East Keep
  for (let x = mx + 2; x <= cols - 2; x++) {
    grid[mz][x] = '#';
  }

  // Fortified central chasm (columns mx-1 .. mx+1) pierced by TWO bridge tunnels:
  // 1) South Bridge (Amber Gate A) connecting West Keep -> South-East Courtyard
  const southBridgeZ = Math.min(rows - 2, mz + 2);
  grid[southBridgeZ][mx - 1] = '.';
  grid[southBridgeZ][mx] = 'A';
  grid[southBridgeZ][mx + 1] = '.';

  // 2) Internal East Keep passage from SE Courtyard -> NE Citadel (Cyan Gate B or open)
  const eastPassX = cols - 2;
  grid[mz][eastPassX] = opts.useCyan ? 'B' : '.';

  // 3) North Bridge connecting NE Citadel back across to fortified North-West Trophy Sanctum!
  const northBridgeZ = 2;
  grid[northBridgeZ][mx - 1] = '.';
  grid[northBridgeZ][mx] = opts.useViolet ? 'V' : opts.useBounty ? 'K' : '.';
  grid[northBridgeZ][mx + 1] = '.';

  // Carve sealed North-West Citadel Vault (rows 1..3, cols 1..mx-2) separated from rest of West Keep!
  // Wait: put a solid wall at z = 4 across West Keep so you MUST cross the bridges to reach the NW Trophy Sanctum!
  const sanctumBottomZ = 4;
  if (sanctumBottomZ < mz) {
    for (let x = 1; x <= mx - 2; x++) {
      grid[sanctumBottomZ][x] = '#';
    }
    // Separate Trophy Chamber inside rows 1..3 at West end (cols 1..2)
    for (let z = 1; z <= sanctumBottomZ - 1; z++) {
      grid[z][3] = '#';
    }
    const trophyDoor: Coord = { x: 3, z: 2 };
    const trophy: Coord = { x: 1, z: 2 };
    grid[trophyDoor.z][trophyDoor.x] = 'F';

    // If both Violet & Bounty active, put Bounty Door K inside NE Citadel before North Bridge
    if (opts.useViolet && opts.useBounty && cols - 2 - (mx + 2) >= 3) {
      const kX = mx + 3;
      for (let z = 1; z <= mz - 1; z++) {
        grid[z][kX] = '#';
      }
      grid[2][kX] = 'K';
    }

    const spawn: Coord = { x: 2, z: rows - 2 };
    const sanctumCells = new Set<string>();
    for (let z = 1; z <= sanctumBottomZ - 1; z++) {
      for (let x = 1; x <= 2; x++) {
        sanctumCells.add(`${x},${z}`);
      }
    }

    return {
      grid,
      spawn,
      trophy,
      trophyDoor,
      sanctumCells,
      layoutName: 'Twin-Keep Bridge',
    };
  }

  // Fallback for compact grid height: put Sanctum in North-East corner of East Keep
  for (let z = 1; z <= mz - 1; z++) {
    grid[z][cols - 3] = '#';
  }
  const trophyDoor: Coord = { x: cols - 3, z: 1 };
  const trophy: Coord = { x: cols - 2, z: 1 };
  grid[trophyDoor.z][trophyDoor.x] = 'F';

  const spawn: Coord = { x: 2, z: rows - 2 };
  const sanctumCells = new Set<string>();
  for (let z = 1; z <= mz - 1; z++) {
    sanctumCells.add(`${cols - 2},${z}`);
  }

  return {
    grid,
    spawn,
    trophy,
    trophyDoor,
    sanctumCells,
    layoutName: 'Twin-Keep Bridge',
  };
}

// ============================================================================
// PER-LEVEL SCHEDULE: UNIQUE PLAY AREAS & VARIED TROPHY LOCATIONS (LEVELS 1-30)
// ============================================================================

const LEVEL_LAYOUT_PLAN: Array<{
  archetype: LayoutArchetype;
  rot90: 0 | 1 | 2 | 3;
  flipX: boolean;
}> = [
  /* Lv  1 */ { archetype: 'coin_tutorial', rot90: 0, flipX: false }, // East-North Trophy
  /* Lv  2 */ { archetype: 'ammo_foundry', rot90: 0, flipX: false }, // North-West Trophy
  /* Lv  3 */ { archetype: 'central_ring', rot90: 0, flipX: false }, // Center Vault Trophy
  /* Lv  4 */ { archetype: 'quadrant_bastion', rot90: 0, flipX: false }, // South-East Trophy
  /* Lv  5 */ { archetype: 'spiral_vault', rot90: 1, flipX: false }, // South-Center Inner Trophy
  /* Lv  6 */ { archetype: 'serpentine_gallery', rot90: 0, flipX: true }, // North-West Trophy
  /* Lv  7 */ { archetype: 'cathedral_nave', rot90: 2, flipX: false }, // South-East Trophy
  /* Lv  8 */ { archetype: 'twin_bridge', rot90: 1, flipX: false }, // North-East Trophy
  /* Lv  9 */ { archetype: 'central_ring', rot90: 2, flipX: true }, // Center Vault (Flipped)
  /* Lv 10 */ { archetype: 'quadrant_bastion', rot90: 1, flipX: false }, // South-West Trophy
  /* Lv 11 */ { archetype: 'spiral_vault', rot90: 2, flipX: true }, // West-Center Inner Trophy
  /* Lv 12 */ { archetype: 'serpentine_gallery', rot90: 1, flipX: false }, // South-East Trophy
  /* Lv 13 */ { archetype: 'cathedral_nave', rot90: 3, flipX: false }, // South-West Trophy
  /* Lv 14 */ { archetype: 'twin_bridge', rot90: 2, flipX: false }, // South-East Trophy
  /* Lv 15 */ { archetype: 'central_ring', rot90: 1, flipX: false }, // Center Vault (90°)
  /* Lv 16 */ { archetype: 'quadrant_bastion', rot90: 2, flipX: false }, // North-West Trophy
  /* Lv 17 */ { archetype: 'spiral_vault', rot90: 3, flipX: false }, // North-Center Inner Trophy
  /* Lv 18 */ { archetype: 'serpentine_gallery', rot90: 2, flipX: false }, // South-West Trophy
  /* Lv 19 */ { archetype: 'cathedral_nave', rot90: 0, flipX: true }, // North-East Trophy
  /* Lv 20 */ { archetype: 'twin_bridge', rot90: 3, flipX: false }, // South-West Trophy
  /* Lv 21 */ { archetype: 'central_ring', rot90: 3, flipX: true }, // Center Vault (270° Mirror)
  /* Lv 22 */ { archetype: 'quadrant_bastion', rot90: 3, flipX: false }, // North-East Trophy
  /* Lv 23 */ { archetype: 'spiral_vault', rot90: 0, flipX: false }, // East-Center Inner Trophy
  /* Lv 24 */ { archetype: 'serpentine_gallery', rot90: 3, flipX: true }, // North-East Trophy
  /* Lv 25 */ { archetype: 'cathedral_nave', rot90: 1, flipX: false }, // North-East / East Wing
  /* Lv 26 */ { archetype: 'twin_bridge', rot90: 2, flipX: false }, // South-East Trophy
  /* Lv 27 */ { archetype: 'central_ring', rot90: 2, flipX: false }, // Center Vault (180°)
  /* Lv 28 */ { archetype: 'quadrant_bastion', rot90: 0, flipX: true }, // South-West Trophy
  /* Lv 29 */ { archetype: 'spiral_vault', rot90: 1, flipX: true }, // South-Inner Vault
  /* Lv 30 */ { archetype: 'twin_bridge', rot90: 2, flipX: true }, // South-West Finale Keep
];

function generateUniqueLevel(levelId: number): LevelDefinition {
  const rng = createRng(levelId * 7919 + 424242);
  const plan = LEVEL_LAYOUT_PLAN[levelId - 1] || LEVEL_LAYOUT_PLAN[0];

  // Escalate grid dimensions smoothly across 30 levels
  const baseCols =
    levelId === 1 ? 11 : levelId <= 5 ? 13 : levelId <= 14 ? 15 : levelId <= 22 ? 17 : 19;
  const baseRows =
    levelId === 1 ? 9 : levelId <= 5 ? 11 : levelId <= 14 ? 13 : levelId <= 22 ? 15 : 17;

  const botRoster = getBotRosterForLevel(levelId);
  const botCount = botRoster.length;
  const botMix = summarizeBotMix(botRoster);

  const totalCoinsTarget =
    levelId === 1 ? 6 : levelId === 2 ? 6 : Math.min(14, 5 + Math.floor(levelId * 0.32));
  const packCount =
    levelId === 1 ? 0 : levelId === 2 ? 5 : Math.max(4, Math.ceil(botCount * 1.45));

  // Special Heavy Railgun unlocks when new enemy classes debut (Lv 4+ Strikers, Lv 8+ Enforcers, Lv 16+ Dreadnoughts)
  const gunPickupCount =
    levelId <= 3
      ? 0
      : levelId <= 5
        ? 1
        : levelId <= 11
          ? 2
          : levelId <= 23
            ? 3
            : 4;

  const useCyan = levelId >= 3;
  const useViolet = levelId >= 10;
  const useBounty = levelId >= 3;
  const bountyKillsRequired = useBounty
    ? Math.max(1, Math.min(botCount, Math.ceil(botCount * 0.55)))
    : 0;

  let bp: BlueprintResult;
  if (plan.archetype === 'coin_tutorial') {
    bp = buildCoinTutorialBlueprint();
  } else if (plan.archetype === 'ammo_foundry') {
    bp = buildAmmoFoundryBlueprint();
  } else if (plan.archetype === 'central_ring') {
    bp = buildCentralRingBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  } else if (plan.archetype === 'quadrant_bastion') {
    bp = buildQuadrantBastionBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  } else if (plan.archetype === 'spiral_vault') {
    bp = buildSpiralVaultBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  } else if (plan.archetype === 'serpentine_gallery') {
    bp = buildSerpentineGalleryBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  } else if (plan.archetype === 'cathedral_nave') {
    bp = buildCathedralNaveBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  } else {
    bp = buildTwinBridgeBlueprint(baseCols, baseRows, { useCyan, useViolet, useBounty });
  }

  // Apply spatial rotation & mirroring so every level explores a fresh layout & Trophy position
  const origCols = bp.grid[0].length;
  const origRows = bp.grid.length;
  const grid = transformGrid(bp.grid, plan.rot90, plan.flipX);
  const cols = grid[0].length;
  const rows = grid.length;

  const spawn = transformCoord(bp.spawn, origCols, origRows, plan.rot90, plan.flipX);
  const trophy = transformCoord(bp.trophy, origCols, origRows, plan.rot90, plan.flipX);
  const trophyDoor = transformCoord(bp.trophyDoor, origCols, origRows, plan.rot90, plan.flipX);

  const sanctumCells = new Set<string>();
  for (const key of bp.sanctumCells) {
    const [kx, kz] = key.split(',').map(Number);
    const tc = transformCoord({ x: kx, z: kz }, origCols, origRows, plan.rot90, plan.flipX);
    sanctumCells.add(`${tc.x},${tc.z}`);
  }

  const isSanctumTile = (x: number, z: number) => sanctumCells.has(`${x},${z}`);
  const isTutorialHandcrafted =
    plan.archetype === 'coin_tutorial' || plan.archetype === 'ammo_foundry';

  let coinsPlaced = 0;
  let botsPlaced = 0;

  if (isTutorialHandcrafted) {
    // Handcrafted Tutorial Levels (1 & 2) already contain exact S, T, F, a, O, E, 1 placements
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const ch = grid[z][x];
        if (ch === 'O') coinsPlaced++;
        if (ch === '1' || ch === '2' || ch === '3' || ch === '4') botsPlaced++;
      }
    }
  } else {
    // Ensure S and T are stamped cleanly
    grid[spawn.z][spawn.x] = 'S';
    grid[trophy.z][trophy.x] = 'T';
    grid[trophyDoor.z][trophyDoor.x] = 'F';

    const gridFlat = grid.map((r) => r.join('')).join('');
    const hasDoorA = gridFlat.includes('A');
    const hasDoorB = gridFlat.includes('B');
    const hasDoorV = gridFlat.includes('V');

    const toCoords = (set: Set<string>): Coord[] =>
      Array.from(set).map((k) => {
        const [x, z] = k.split(',').map(Number);
        return { x, z };
      });

    const isDoorNeighbor = (c: Coord) => {
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      return dirs.some(([dx, dz]) => {
        const ch = grid[c.z + dz]?.[c.x + dx];
        return ch === 'A' || ch === 'B' || ch === 'V' || ch === 'K' || ch === 'F';
      });
    };

    // 1. Place Amber Switch 'a' strictly in the initially reachable zone (before A/B/V/K/F)
    const reach0 = computeReachable(grid, spawn, new Set(), false, false);
    if (hasDoorA) {
      const candidatesA = toCoords(reach0).filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          !isDoorNeighbor(c) &&
          Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 2.2,
      );
      const fallbackA = toCoords(reach0).filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 1.5,
      );
      const poolA = candidatesA.length > 0 ? candidatesA : fallbackA;
      poolA.sort(
        (c1, c2) =>
          Math.hypot(c2.x - spawn.x, c2.z - spawn.z) - Math.hypot(c1.x - spawn.x, c1.z - spawn.z),
      );
      const pickA = poolA[Math.min(poolA.length - 1, Math.floor(rng() * Math.min(4, poolA.length)))];
      if (pickA) grid[pickA.z][pickA.x] = 'a';
    }

    // 2. Place Cyan Switch 'b' in the newly unlocked zone after 'a' opens 'A'
    const reachA = computeReachable(grid, spawn, new Set(['a']), false, false);
    if (hasDoorB) {
      const newlyA = toCoords(reachA).filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          !reach0.has(`${c.x},${c.z}`) &&
          !isDoorNeighbor(c),
      );
      const fallbackB = toCoords(reachA).filter(
        (c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z) && !reach0.has(`${c.x},${c.z}`),
      );
      const poolB =
        newlyA.length > 0
          ? newlyA
          : fallbackB.length > 0
            ? fallbackB
            : toCoords(reachA).filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z));
      const pickB = poolB[Math.floor(rng() * poolB.length)];
      if (pickB) grid[pickB.z][pickB.x] = 'b';
    }

    // 3. Place Violet Switch 'v' in the newly unlocked zone after 'a' & 'b' open
    const reachAB = computeReachable(grid, spawn, new Set(['a', 'b']), false, false);
    if (hasDoorV) {
      const newlyAB = toCoords(reachAB).filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          !reachA.has(`${c.x},${c.z}`) &&
          !isDoorNeighbor(c),
      );
      const fallbackV = toCoords(reachAB).filter(
        (c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z) && !reach0.has(`${c.x},${c.z}`),
      );
      const poolV =
        newlyAB.length > 0
          ? newlyAB
          : fallbackV.length > 0
            ? fallbackV
            : toCoords(reachAB).filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z));
      const pickV = poolV[Math.floor(rng() * poolV.length)];
      if (pickV) grid[pickV.z][pickV.x] = 'v';
    }

    // Helper verifying that adding a wall '#' or crate 'C' preserves reachability at EVERY progression stage
    const stageChecks = () => {
      const s0 = computeReachable(grid, spawn, new Set(), false, false);
      const sA = computeReachable(grid, spawn, new Set(['a']), false, false);
      const sAB = computeReachable(grid, spawn, new Set(['a', 'b']), false, false);
      const sABV = computeReachable(grid, spawn, new Set(['a', 'b', 'v']), false, false);
      const sAll = computeReachable(grid, spawn, new Set(['a', 'b', 'v']), true, false);
      return { s0, sA, sAB, sABV, sAll };
    };

    const tryPlaceObstacle = (c: Coord, ch: '#' | 'C'): boolean => {
      const key = `${c.x},${c.z}`;
      const before = stageChecks();
      grid[c.z][c.x] = ch;
      const after = stageChecks();

      const ok0 = after.s0.size === before.s0.size - (before.s0.has(key) ? 1 : 0);
      const okA = after.sA.size === before.sA.size - (before.sA.has(key) ? 1 : 0);
      const okAB = after.sAB.size === before.sAB.size - (before.sAB.has(key) ? 1 : 0);
      const okABV = after.sABV.size === before.sABV.size - (before.sABV.has(key) ? 1 : 0);
      const okAll = after.sAll.size === before.sAll.size - (before.sAll.has(key) ? 1 : 0);

      if (ok0 && okA && okAB && okABV && okAll) {
        return true;
      }
      grid[c.z][c.x] = '.';
      return false;
    };

    // 4. Add seeded interior cover walls (preserving 100% stage-by-stage connectivity!)
    const baseReachAll = computeReachable(grid, spawn, new Set(['a', 'b', 'v']), true, false);
    const allOpenForWalls = toCoords(baseReachAll).filter(
      (c) =>
        grid[c.z][c.x] === '.' &&
        !isSanctumTile(c.x, c.z) &&
        !isDoorNeighbor(c) &&
        Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 2.5,
    );
    for (let i = allOpenForWalls.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allOpenForWalls[i], allOpenForWalls[j]] = [allOpenForWalls[j], allOpenForWalls[i]];
    }

    const wallTarget = Math.min(8, 1 + Math.floor(levelId / 4));
    let wallsAdded = 0;
    for (const c of allOpenForWalls) {
      if (wallsAdded >= wallTarget) break;
      // Avoid pinching narrow 1-tile corridors
      const openNeighbors = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].filter(([dx, dz]) => {
        const ch = grid[c.z + dz]?.[c.x + dx];
        return ch && ch !== '#';
      }).length;
      if (openNeighbors < 4) continue;

      if (tryPlaceObstacle(c, '#')) {
        wallsAdded++;
      }
    }

    // 5. Place tactical Crates 'C' without breaking ANY progression stage or blocking doorways
    const crateCandidates = toCoords(
      computeReachable(grid, spawn, new Set(['a', 'b', 'v']), true, false),
    ).filter(
      (c) =>
        grid[c.z][c.x] === '.' &&
        !isSanctumTile(c.x, c.z) &&
        !isDoorNeighbor(c) &&
        Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 2.2,
    );
    for (let i = crateCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [crateCandidates[i], crateCandidates[j]] = [crateCandidates[j], crateCandidates[i]];
    }

    const crateTarget = Math.min(11, 3 + Math.floor(levelId / 3));
    let cratesPlaced = 0;
    for (const c of crateCandidates) {
      if (cratesPlaced >= crateTarget) break;
      if (tryPlaceObstacle(c, 'C')) {
        cratesPlaced++;
      }
    }

    // 6. Recompute open tiles outside Sanctum (both before and after Bounty Door K)
    const beforeBountySet = computeReachable(grid, spawn, new Set(['a', 'b', 'v']), false, false);
    const openTiles = toCoords(
      computeReachable(grid, spawn, new Set(['a', 'b', 'v']), true, false),
    ).filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z));

    for (let i = openTiles.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [openTiles[i], openTiles[j]] = [openTiles[j], openTiles[i]];
    }

    let cursor = 0;
    const takeFilteredTile = (predicate: (c: Coord) => boolean): Coord | null => {
      for (let idx = cursor; idx < openTiles.length; idx++) {
        const candidate = openTiles[idx];
        if (grid[candidate.z][candidate.x] === '.' && predicate(candidate)) {
          [openTiles[cursor], openTiles[idx]] = [openTiles[idx], openTiles[cursor]];
          cursor++;
          return candidate;
        }
      }
      return null;
    };

    // 7. Place Mixed Enemy Squads ('1'=Sentinel, '2'=Striker, '3'=Enforcer, '4'=Dreadnought)
    // Always outside immediate spawn radius & without direct spawn LOS.
    // Tougher units (Enforcers & Dreadnoughts) preferentially guard deeper sectors while Sentinels & Strikers roam earlier wings.
    for (let b = 0; b < botRoster.length; b++) {
      const style = botRoster[b];
      const mustBeBeforeBounty = b < bountyKillsRequired;
      const preferDeeper = style === 'enforcer' || style === 'dreadnought';

      const tile =
        (preferDeeper
          ? takeFilteredTile(
              (c) =>
                !reach0.has(`${c.x},${c.z}`) &&
                Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 4.5 &&
                !hasGridLineOfSight(grid, spawn.x, spawn.z, c.x, c.z) &&
                (!mustBeBeforeBounty || beforeBountySet.has(`${c.x},${c.z}`)),
            )
          : null) ||
        takeFilteredTile(
          (c) =>
            Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 4.2 &&
            !hasGridLineOfSight(grid, spawn.x, spawn.z, c.x, c.z) &&
            (!mustBeBeforeBounty || beforeBountySet.has(`${c.x},${c.z}`)),
        ) ||
        takeFilteredTile(
          (c) =>
            Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 3.4 &&
            (!mustBeBeforeBounty || beforeBountySet.has(`${c.x},${c.z}`)),
        ) ||
        takeFilteredTile((c) => Math.hypot(c.x - spawn.x, c.z - spawn.z) >= 2.6);

      if (tile) {
        grid[tile.z][tile.x] = BOT_STYLE_CHAR[style];
        botsPlaced++;
      }
    }

    // 8. Place Gold Coins 'O' spread across all explorable wings (encouraging full-map exploration!)
    for (let c = 0; c < totalCoinsTarget; c++) {
      const t =
        takeFilteredTile((pt) => Math.hypot(pt.x - spawn.x, pt.z - spawn.z) >= 2.0) ||
        takeFilteredTile((pt) => Math.hypot(pt.x - spawn.x, pt.z - spawn.z) >= 1.2);
      if (t) {
        grid[t.z][t.x] = 'O';
        coinsPlaced++;
      }
    }
  }

  const startYaw = computeBestStartYaw(grid, spawn);
  const trophyZoneLabel = computeTrophyZoneLabel(trophy, cols, rows);

  const biome = BIOMES[(levelId - 1) % BIOMES.length];
  const name = LEVEL_NAMES[levelId - 1];
  const jewelleryName = JEWELLERY_NAMES[levelId - 1];

  const finalGridStr = grid.map((r) => r.join('')).join('');
  const actualBounty = finalGridStr.includes('K') ? Math.min(bountyKillsRequired, botsPlaced) : 0;

  const lockList: string[] = [];
  if (finalGridStr.includes('a')) lockList.push('Amber Switch');
  if (finalGridStr.includes('b')) lockList.push('Cyan Switch');
  if (finalGridStr.includes('v')) lockList.push('Violet Switch');
  if (actualBounty > 0) lockList.push(`${actualBounty}-Bot Bounty`);
  lockList.push(trophyZoneLabel);

  const description =
    levelId === 1
      ? `Tutorial Vault: Practice moving, looking around, shooting the Amber Switch, and collecting all ${coinsPlaced} Gold Coins to unlock the ${jewelleryName}.`
      : levelId === 2
        ? `Combat Tutorial: Collect glowing Blue Bullet Packs to reload your blaster, defeat the Sentinel Bot, grab all ${coinsPlaced} Gold Coins, and claim the ${jewelleryName}.`
        : `Explore the ${bp.layoutName}, collect all ${coinsPlaced} Gold Coins, and defeat all ${botsPlaced} vault guards to unseal the ${trophyZoneLabel} and claim the ${jewelleryName}.`;

  const theme: LevelTheme = {
    id: levelId,
    name,
    subtitle: lockList.join(' · '),
    jewelleryName,
    description,
    ...biome,
  };

  return {
    id: levelId,
    theme,
    grid: grid.map((row) => row.join('')),
    bountyKillsRequired: actualBounty,
    startYaw,
    parTimeSeconds: levelId === 1 ? 45 : levelId === 2 ? 55 : 55 + levelId * 6,
    difficultyLabel: getDifficultyLabel(levelId),
    totalCoins: coinsPlaced,
    botCount: botsPlaced,
    botMix,
    packCount,
    gunPickupCount,
    trophyZoneLabel,
    layoutName: bp.layoutName,
    tutorialMode: levelId === 1 ? 'coins' : levelId === 2 ? 'combat_ammo' : undefined,
    startingGunBullets: levelId === 2 ? 4 : undefined,
    startingBulletPacks: levelId === 2 ? 0 : undefined,
  };
}

export const LEVELS: LevelDefinition[] = Array.from({ length: 30 }, (_, idx) =>
  generateUniqueLevel(idx + 1),
);
