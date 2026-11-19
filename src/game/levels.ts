import { LevelDefinition, LevelTheme } from './types';

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
  'Sunlit Crate Yard',
  'Cobalt Switchworks',
  'Crimson Sentinel Keep',
  'Emerald Twin-Seal',
  'Obsidian Crown Hall',
  'Amber Foundry Gate',
  'Azure Conduit Maze',
  'Scarlet Guardhouse',
  'Jade Courtyard',
  'Violet Core Bastion',
  'Solar Brass Armory',
  'Tidal Lock Corridor',
  'Ruby Watchtower',
  'Verdant Pillar Hall',
  'Amethyst Relay Vault',
  'Gilded Crossworks',
  'Cerulean Sector Nine',
  'Garnet Turret Wing',
  'Malachite Archive',
  'Twilight Nexus',
  'Bronze Labyrinth',
  'Froststeel Trench',
  'Magma Seal Atrium',
  'Mossguard Sanctum',
  'Astral Spire Keep',
  'Ochre Gauntlet',
  'Deepwater Conduit',
  'Bloodstone Fortress',
  'Prismatic Inner Keep',
  'Sovereign Apex Vault',
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
  if (id <= 5) return 'Recruit';
  if (id <= 12) return 'Explorer';
  if (id <= 17) return 'Tactician';
  if (id <= 24) return 'Enforcer';
  return 'Dreadnought';
}

interface Coord {
  x: number;
  z: number;
}

function isInside(x: number, z: number, cols: number, rows: number): boolean {
  return x > 0 && z > 0 && x < cols - 1 && z < rows - 1;
}

function carveRect(
  grid: string[][],
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  val = '.',
) {
  for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      if (isInside(x, z, grid[0].length, grid.length)) {
        grid[z][x] = val;
      }
    }
  }
}

function carveCorridor(grid: string[][], a: Coord, b: Coord, horizontalFirst: boolean) {
  let cx = a.x;
  let cz = a.z;
  const cols = grid[0].length;
  const rows = grid.length;

  const stepX = () => {
    while (cx !== b.x) {
      cx += cx < b.x ? 1 : -1;
      if (isInside(cx, cz, cols, rows)) grid[cz][cx] = '.';
    }
  };
  const stepZ = () => {
    while (cz !== b.z) {
      cz += cz < b.z ? 1 : -1;
      if (isInside(cx, cz, cols, rows)) grid[cz][cx] = '.';
    }
  };

  if (isInside(cx, cz, cols, rows)) grid[cz][cx] = '.';
  if (horizontalFirst) {
    stepX();
    stepZ();
  } else {
    stepZ();
    stepX();
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

function hasGridLineOfSight(grid: string[][], x1: number, z1: number, x2: number, z2: number): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const steps = Math.max(2, Math.ceil(Math.hypot(dx, dz) * 3));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const gx = Math.round(x1 + dx * t);
    const gz = Math.round(z1 + dz * t);
    const ch = grid[gz]?.[gx];
    if (!ch || ch === '#' || ch === 'C' || ch === 'A' || ch === 'B' || ch === 'V' || ch === 'K' || ch === 'F') {
      return false;
    }
  }
  return true;
}

function generateUniqueLevel(levelId: number): LevelDefinition {
  const rng = createRng(levelId * 7919 + 424242);

  // Escalate dimensions across 30 levels
  const cols =
    levelId === 1 ? 11 : levelId <= 5 ? 13 : levelId <= 14 ? 15 : levelId <= 22 ? 17 : 19;
  const rows =
    levelId === 1 ? 9 : levelId <= 5 ? 11 : levelId <= 14 ? 13 : levelId <= 22 ? 15 : 17;

  // Gradually increase enemy count; ramp difficulty sharply from Level 18 to 30
  const botCount =
    levelId === 1
      ? 1
      : levelId <= 3
        ? 2
        : levelId <= 6
          ? 3
          : levelId <= 9
            ? 4
            : levelId <= 12
              ? 5
              : levelId <= 15
                ? 6
                : levelId <= 17
                  ? 7
                  : levelId <= 20
                    ? 8
                    : levelId <= 24
                      ? 9
                      : levelId <= 27
                        ? 10
                        : 11;
  const totalCoins = Math.min(14, 4 + Math.floor(levelId * 0.35));
  const packCount = Math.max(3, Math.ceil(botCount * 1.4));
  // Special Heavy Railgun spawns when new armored enemy classes appear (Levels 18-30)
  const gunPickupCount = levelId >= 25 ? 4 : levelId >= 18 ? 3 : 0;
  const useCyan = levelId >= 3;
  const useViolet = levelId >= 10;
  const useBounty = levelId >= 2;
  const bountyKillsRequired = useBounty
    ? Math.max(1, Math.min(botCount, Math.ceil(botCount * 0.6)))
    : 0;

  // Initialize solid wall grid
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '#'),
  );

  // Define 4 structured puzzle sectors with randomized offsets per levelId
  const midX = Math.floor(cols / 2);
  const shiftX = Math.floor((rng() - 0.5) * 2);
  const shiftZ = Math.floor((rng() - 0.5) * 2);

  // Sector 0: Dedicated South Start Courtyard (Player spawns alone here, away from enemies)
  const s0x1 = 1;
  const s0x2 = cols - 2;
  const s0z1 = rows === 9 ? 6 : rows - 3;
  const s0z2 = rows - 2;
  carveRect(grid, s0x1, s0z1, s0x2, s0z2, '.');

  // Spawn near bottom center with slight unique offset
  const spawnX = Math.max(2, Math.min(cols - 3, midX + shiftX));
  const spawnZ = rows - 2;

  // Sector 3 bounds: Top Row Sanctum (row 1) containing Final Jewellery T behind Trophy Door F
  const sanctumW = Math.min(5, Math.max(3, Math.floor(cols / 3)));
  const sanctumLeft = Math.max(1, Math.min(cols - 1 - sanctumW, midX - Math.floor(sanctumW / 2)));
  const sanctumRight = sanctumLeft + sanctumW - 1;
  const sanctumDoorX = Math.floor((sanctumLeft + sanctumRight) / 2);

  // Sector 1: West & East Mid Chambers separated from Sector 0 by gateRow
  const gateRow = s0z1 - 1;
  const northHallZ = 3;
  const sanctumGateZ = 2;
  const midTop = rows === 9 ? 3 : 5;
  let splitX = Math.max(4, Math.min(cols - 5, midX + shiftX));
  if (rows === 9 && splitX === sanctumDoorX) {
    splitX = Math.max(3, sanctumDoorX - 1);
  }

  // West Wing (open from Sector 0 via westPassX)
  carveRect(grid, 1, midTop, splitX - 1, gateRow - 1, '.');
  // East Wing (gated by Amber Door A)
  carveRect(grid, splitX + 1, midTop, cols - 2, gateRow - 1, '.');

  // Connect Sector 0 -> West Wing through a deterministic doorway in gateRow
  const westPassX = Math.max(1, Math.min(splitX - 1, 1 + Math.floor(rng() * (splitX - 2))));
  grid[gateRow][westPassX] = '.';

  // Gate Amber Door A in a true wall ridge between West Wing and East Wing (or Sector 0 -> East Wing)
  const useHorizontalA = rows === 9 ? true : rng() > 0.45;
  let doorAPos: Coord;
  if (useHorizontalA) {
    const az = Math.max(midTop, Math.min(gateRow - 1, Math.floor((midTop + gateRow - 1) / 2) + shiftZ));
    grid[az][splitX] = 'A';
    grid[az][splitX - 1] = '.';
    grid[az][splitX + 1] = '.';
    doorAPos = { x: splitX, z: az };
  } else {
    const ax = Math.max(
      splitX + 1,
      Math.min(cols - 2, splitX + 1 + Math.floor(rng() * Math.max(1, cols - splitX - 3))),
    );
    grid[gateRow][ax] = 'A';
    grid[gateRow + 1][ax] = '.';
    grid[gateRow - 1][ax] = '.';
    doorAPos = { x: ax, z: gateRow };
  }

  // Sector 2: North Hallway (row 3), separated from Sector 1 by row 4 wall ridge (on rows >= 11)
  let bGateX = Math.max(splitX + 1, cols - 2);
  if (rows >= 11) {
    carveRect(grid, 1, northHallZ, cols - 2, northHallZ, '.');
    const minBGate = useViolet ? Math.max(splitX + 1, sanctumDoorX + 2) : splitX + 1;
    const maxBGate = cols - 2;
    bGateX =
      minBGate <= maxBGate
        ? minBGate + Math.floor(rng() * (maxBGate - minBGate + 1))
        : maxBGate;

    // Row 4 is a solid wall ridge; open only bGateX with Cyan Door B (or '.' on Level 2)
    grid[northHallZ + 1][bGateX] = useCyan ? 'B' : '.';
    grid[northHallZ][bGateX] = '.';
    grid[northHallZ + 2][bGateX] = '.';
  } else {
    // Level 1 (rows = 9): connect East Wing row 3 cleanly across to sanctumDoorX while keeping West/East split intact
    if (sanctumDoorX < splitX) {
      carveRect(grid, sanctumDoorX, northHallZ, splitX - 1, northHallZ, '.');
    } else if (sanctumDoorX > splitX) {
      carveRect(grid, splitX + 1, northHallZ, sanctumDoorX, northHallZ, '.');
    }
  }

  // Optional extra winding side-loops inside West & East wings for unique maze feel
  const extraPaths = 2 + (levelId % 4);
  for (let p = 0; p < extraPaths; p++) {
    const p1: Coord = {
      x: 1 + Math.floor(rng() * Math.max(1, splitX - 2)),
      z: midTop + Math.floor(rng() * Math.max(1, gateRow - midTop)),
    };
    const p2: Coord = {
      x: 1 + Math.floor(rng() * Math.max(1, splitX - 2)),
      z: midTop + Math.floor(rng() * Math.max(1, gateRow - midTop)),
    };
    carveCorridor(grid, p1, p2, rng() > 0.5);
  }

  // Add inner structural maze walls (only where they don't break sector doorways or seal paths)
  const wallObstacles = Math.min(10, 2 + Math.floor(levelId / 3));
  for (let w = 0; w < wallObstacles; w++) {
    const wx = 2 + Math.floor(rng() * (cols - 4));
    const wz = midTop + 1 + Math.floor(rng() * Math.max(1, rows - midTop - 5));
    if (wz >= gateRow || wz <= northHallZ + 1) continue;
    if (wx === splitX || wz === gateRow || wz === northHallZ || wz === sanctumGateZ) continue;
    if (Math.abs(wx - spawnX) <= 1 && Math.abs(wz - spawnZ) <= 1) continue;
    if (Math.abs(wx - westPassX) <= 1 && Math.abs(wz - gateRow) <= 1) continue;
    if (Math.abs(wx - doorAPos.x) <= 1 && Math.abs(wz - doorAPos.z) <= 1) continue;
    if (Math.abs(wx - bGateX) <= 1 && Math.abs(wz - (northHallZ + 1)) <= 1) continue;
    if (grid[wz][wx] === '.') {
      const beforeWall = computeReachable(
        grid,
        { x: spawnX, z: spawnZ },
        new Set(['a', 'b', 'v']),
        true,
        false,
      ).size;
      grid[wz][wx] = '#';
      const afterWall = computeReachable(
        grid,
        { x: spawnX, z: spawnZ },
        new Set(['a', 'b', 'v']),
        true,
        false,
      ).size;
      if (afterWall !== beforeWall - 1) {
        grid[wz][wx] = '.';
      }
    }
  }

  // Carve sealed Top Row Sanctum (row 1, sanctumLeft..sanctumRight)
  carveRect(grid, sanctumLeft, 1, sanctumRight, 1, '.');
  // Surround sanctum on row 2 with walls except the dedicated Final Trophy Door 'F'
  for (let x = sanctumLeft - 1; x <= sanctumRight + 1; x++) {
    if (x >= 0 && x < cols) grid[sanctumGateZ][x] = '#';
  }
  grid[sanctumGateZ][sanctumDoorX] = 'F';

  // Carve side alcoves in row 1 outside the sanctum (sealed from Sanctum by walls at sanctumLeft-1 / sanctumRight+1)
  if (sanctumLeft > 2) {
    carveRect(grid, 1, 1, sanctumLeft - 2, 1, '.');
    grid[2][1] = '.';
  }
  if (sanctumRight < cols - 3) {
    carveRect(grid, sanctumRight + 2, 1, cols - 2, 1, '.');
    grid[2][cols - 2] = '.';
  }

  // Place Violet Door V and Bounty Door K in true wall-bounded North Hall passages (never overwriting F)
  if (rows >= 11) {
    if (useViolet) {
      const vGateX = sanctumDoorX + 1;
      if (vGateX < bGateX) {
        grid[northHallZ][vGateX] = 'V';
      }
      if (useBounty) {
        const kSplitX = Math.max(2, sanctumLeft - 1);
        if (kSplitX > 1 && kSplitX < sanctumDoorX) {
          grid[northHallZ][kSplitX] = 'K';
        }
      }
    } else if (useBounty) {
      if (bGateX > sanctumDoorX + 1) {
        grid[northHallZ][sanctumDoorX + 1] = 'K';
      } else {
        const kSplitX = Math.max(2, sanctumLeft - 1);
        if (kSplitX > 1 && kSplitX < sanctumDoorX) {
          grid[northHallZ][kSplitX] = 'K';
        }
      }
    }
  }

  // Place Spawn & Final Jewellery
  grid[spawnZ][spawnX] = 'S';
  grid[1][sanctumDoorX] = 'T';

  const isSanctumTile = (x: number, z: number) =>
    z === 1 && x >= sanctumLeft && x <= sanctumRight;

  // Ensure Amber Switch 'a' is placed cleanly in the initially reachable zone (before A/B/V/K/F)
  const initialReachable = Array.from(
    computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(), false, false),
  )
    .map((k) => {
      const [x, z] = k.split(',').map(Number);
      return { x, z };
    })
    .filter(
      (c) =>
        grid[c.z][c.x] === '.' &&
        !isSanctumTile(c.x, c.z) &&
        Math.hypot(c.x - spawnX, c.z - spawnZ) >= 2.2,
    );

  // Pick farthest West-wing cell for 'a'
  initialReachable.sort((c1, c2) => c1.z - c2.z + (c1.x - c2.x) * 0.25);
  const switchACoord = initialReachable[0] || { x: Math.max(1, westPassX), z: gateRow - 1 };
  grid[switchACoord.z][switchACoord.x] = 'a';

  // Place Cyan Switch 'b' in East Wing (reachable after 'a' opens 'A', before 'B')
  if (useCyan) {
    const afterA = Array.from(
      computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(['a']), false, false),
    )
      .map((k) => {
        const [x, z] = k.split(',').map(Number);
        return { x, z };
      })
      .filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          !initialReachable.some((r) => r.x === c.x && r.z === c.z) &&
          Math.hypot(c.x - doorAPos.x, c.z - doorAPos.z) >= 1.5,
      );

    const poolB =
      afterA.length > 0 ? afterA : initialReachable.filter((c) => grid[c.z][c.x] === '.');
    const switchBCoord = poolB[Math.floor(rng() * poolB.length)] || { x: cols - 2, z: midTop };
    grid[switchBCoord.z][switchBCoord.x] = 'b';
  }

  // Place Violet Switch 'v' in North Hall East (reachable after 'a' & 'b', before 'V')
  if (useViolet) {
    const afterAB = Array.from(
      computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(['a', 'b']), false, false),
    )
      .map((k) => {
        const [x, z] = k.split(',').map(Number);
        return { x, z };
      })
      .filter(
        (c) =>
          grid[c.z][c.x] === '.' &&
          !isSanctumTile(c.x, c.z) &&
          c.z <= northHallZ &&
          c.x > sanctumDoorX + 1,
      );

    const fallbackAB = Array.from(
      computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(['a', 'b']), false, false),
    )
      .map((k) => {
        const [x, z] = k.split(',').map(Number);
        return { x, z };
      })
      .filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z) && c.z <= northHallZ + 1);

    const poolV = afterAB.length > 0 ? afterAB : fallbackAB;
    const switchVCoord = poolV[Math.floor(rng() * poolV.length)] || { x: bGateX, z: northHallZ };
    grid[switchVCoord.z][switchVCoord.x] = 'v';
  }

  // Verify tile right outside Trophy Door F is reachable before F unlocks, and T is reachable once F unlocks
  const preTrophyReachable = computeReachable(
    grid,
    { x: spawnX, z: spawnZ },
    new Set(['a', 'b', 'v']),
    true,
    false,
  );
  if (!preTrophyReachable.has(`${sanctumDoorX},${northHallZ}`)) {
    carveCorridor(grid, { x: bGateX, z: northHallZ }, { x: sanctumDoorX, z: northHallZ }, true);
    grid[sanctumGateZ][sanctumDoorX] = 'F';
  }

  // Collect all safely reachable empty tiles OUTSIDE the sealed Sanctum for Crates, Bots, Coins
  const finalReachable = Array.from(
    computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(['a', 'b', 'v']), true, false),
  )
    .map((k) => {
      const [x, z] = k.split(',').map(Number);
      return { x, z };
    })
    .filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z));

  // Shuffle reachable tiles deterministically
  for (let i = finalReachable.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [finalReachable[i], finalReachable[j]] = [finalReachable[j], finalReachable[i]];
  }

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

  // Place tactical Crates 'C' (without blocking any tile, switch, corridor, or doorway)
  const baselineReachCount = computeReachable(
    grid,
    { x: spawnX, z: spawnZ },
    new Set(['a', 'b', 'v']),
    true,
    false,
  ).size;
  const crateTarget = Math.min(10, 3 + Math.floor(levelId / 3));
  let cratesPlaced = 0;
  for (const c of finalReachable) {
    if (cratesPlaced >= crateTarget) break;
    if (c.z <= 2) continue;
    if (Math.hypot(c.x - spawnX, c.z - spawnZ) < 1.8) continue;
    if (isDoorNeighbor(c)) continue;
    grid[c.z][c.x] = 'C';
    const check = computeReachable(
      grid,
      { x: spawnX, z: spawnZ },
      new Set(['a', 'b', 'v']),
      true,
      false,
    );
    const stillValid =
      check.has(`${sanctumDoorX},${northHallZ}`) &&
      check.size === baselineReachCount - cratesPlaced - 1;
    if (stillValid) {
      cratesPlaced++;
    } else {
      grid[c.z][c.x] = '.';
    }
  }

  // Recompute available '.' tiles outside the Sanctum after crates
  const beforeBountyTiles = computeReachable(
    grid,
    { x: spawnX, z: spawnZ },
    new Set(['a', 'b', 'v']),
    false,
    false,
  );
  const openTiles = Array.from(
    computeReachable(grid, { x: spawnX, z: spawnZ }, new Set(['a', 'b', 'v']), true, false),
  )
    .map((k) => {
      const [x, z] = k.split(',').map(Number);
      return { x, z };
    })
    .filter((c) => grid[c.z][c.x] === '.' && !isSanctumTile(c.x, c.z));

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

  // Place Bots '1' strictly OUTSIDE Sector 0 (player start area), far from spawn, with no direct spawn LOS.
  // Also ensure at least bountyKillsRequired bots are reachable before Bounty Door K opens.
  let botsPlaced = 0;
  for (let b = 0; b < botCount; b++) {
    const mustBeBeforeBounty = b < bountyKillsRequired;
    const t =
      takeFilteredTile(
        (c) =>
          c.z < gateRow &&
          Math.hypot(c.x - spawnX, c.z - spawnZ) >= 4.2 &&
          !hasGridLineOfSight(grid, spawnX, spawnZ, c.x, c.z) &&
          (!mustBeBeforeBounty || beforeBountyTiles.has(`${c.x},${c.z}`)),
      ) ||
      takeFilteredTile(
        (c) =>
          c.z < s0z1 &&
          Math.hypot(c.x - spawnX, c.z - spawnZ) >= 3.8 &&
          (!mustBeBeforeBounty || beforeBountyTiles.has(`${c.x},${c.z}`)),
      ) ||
      takeFilteredTile((c) => c.z < s0z1 && Math.hypot(c.x - spawnX, c.z - spawnZ) >= 3.2);

    if (t) {
      grid[t.z][t.x] = '1';
      botsPlaced++;
    }
  }

  // Place Gold Coins 'O' outside the immediate spawn tile and strictly outside the Sanctum
  let coinsPlaced = 0;
  for (let c = 0; c < totalCoins; c++) {
    const t =
      takeFilteredTile((pt) => Math.hypot(pt.x - spawnX, pt.z - spawnZ) >= 1.8) ||
      takeFilteredTile((pt) => Math.hypot(pt.x - spawnX, pt.z - spawnZ) >= 1.0);
    if (t) {
      grid[t.z][t.x] = 'O';
      coinsPlaced++;
    }
  }

  const packsPlaced = packCount;

  const biome = BIOMES[(levelId - 1) % BIOMES.length];
  const name = LEVEL_NAMES[levelId - 1];
  const jewelleryName = JEWELLERY_NAMES[levelId - 1];

  const lockList: string[] = ['Amber Switch'];
  if (useCyan) lockList.push('Cyan Switch');
  if (useViolet) lockList.push('Violet Switch');
  if (bountyKillsRequired > 0) lockList.push(`${bountyKillsRequired}-Bot Bounty`);
  lockList.push('Final Trophy Seal');

  const theme: LevelTheme = {
    id: levelId,
    name,
    subtitle: `${lockList.join(' · ')}`,
    jewelleryName,
    description: `Collect all ${coinsPlaced} Gold Coins and defeat all ${botsPlaced} Sentinel Bots to unlock the Final Trophy Door and claim the ${jewelleryName}.`,
    ...biome,
  };

  return {
    id: levelId,
    theme,
    grid: grid.map((row) => row.join('')),
    bountyKillsRequired: Math.min(bountyKillsRequired, botsPlaced),
    startYaw: 0,
    parTimeSeconds: 55 + levelId * 6,
    difficultyLabel: getDifficultyLabel(levelId),
    totalCoins: coinsPlaced,
    botCount: botsPlaced,
    packCount: packsPlaced,
    gunPickupCount,
  };
}

export const LEVELS: LevelDefinition[] = Array.from({ length: 30 }, (_, idx) =>
  generateUniqueLevel(idx + 1),
);
