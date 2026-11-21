import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundFX } from './audio';
import { LEVELS, TILE_SIZE, WALL_HEIGHT } from './levels';
import {
  BotRig,
  createBotModel,
  createDoorModel,
  createPickupModel,
  createSwitchModel,
  createTreasureModel,
  createWeaponModel,
  DoorRig,
  SWITCH_COLORS,
  SWITCH_HEX,
  SwitchRig,
  TreasureRig,
  WeaponRig,
} from './models';
import {
  createContactShadowTexture,
  createCrateTexture,
  createDoorTexture,
  createFloorTexture,
  createWallTexture,
} from './textures';
import {
  BotStyle,
  CoinCollectEvent,
  ControlInputState,
  DoorState,
  HudSnapshot,
  LevelDefinition,
  SwitchColor,
  SwitchState,
  WeaponKind,
} from './types';

type BotDoorPhase = 'cooldown' | 'opening' | 'firing' | 'closing';

interface BotEntity {
  id: string;
  style: BotStyle;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  speed: number;
  alive: boolean;
  alerted: boolean;
  doorPhase: BotDoorPhase;
  doorOpen: number; // 0 = closed, 1 = open
  regenSeconds: number;
  regenTimer: number;
  burstCount: number;
  burstInterval: number;
  bulletsLeftInBurst: number;
  burstShotTimer: number;
  hitFlash: number;
  knockbackX: number;
  knockbackZ: number;
  patrolAngle: number;
  patrolTimer: number;
  strafeSign: number;
  aiDecisionTimer: number;
  repathTimer: number;
  stuckTimer: number;
  lastCheckX: number;
  lastCheckZ: number;
  targetWx: number;
  targetWz: number;
  hasTargetWaypoint: boolean;
  rig: BotRig;
}

interface SwitchEntity {
  state: SwitchState;
  x: number;
  z: number;
  rig: SwitchRig;
}

interface DoorEntity {
  state: DoorState;
  x: number;
  z: number;
  rig: DoorRig;
}

interface PickupEntity {
  id: string;
  kind: 'medkit' | 'pack' | 'coin' | 'gun';
  x: number;
  z: number;
  collected: boolean;
  mesh: THREE.Group;
  spinGroup: THREE.Object3D | null;
  haloMesh: THREE.Object3D | null;
}

interface ProjectileEntity {
  fromPlayer: boolean;
  weaponKind?: WeaponKind;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  damage: number;
  life: number;
  mesh: THREE.Mesh;
}

interface ParticleEntity {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  mesh: THREE.Mesh;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onCoinCollected?: (event: CoinCollectEvent) => void;
  onLevelComplete: (summary: {
    levelId: number;
    score: number;
    elapsedSeconds: number;
    kills: number;
    totalBots: number;
    coinsCollected: number;
    totalCoins: number;
    accuracy: number;
  }) => void;
  onGameOver: (summary: { levelId: number; score: number; kills: number }) => void;
  onContextLost?: (lost: boolean) => void;
}

const EYE_HEIGHT = 1.62;
const PLAYER_RADIUS = 0.52;
const MAX_GUN_BULLETS = 10;
const MAX_SPECIAL_GUN_BULLETS = 10;
const MAX_BULLET_PACKS = 5;
const MAX_HEALTH_PACKS_PER_LEVEL = 5;
const BOT_REGEN_SECONDS = 2.0;
const BOT_BURST_COUNT = 5;
const BOT_BURST_INTERVAL = 0.16;
const MAX_PARTICLES = 90;
const DEATH_FADE_DURATION = 1.1;
const SLOW_MO_DURATION = 1.25;

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _vec3D = new THREE.Vector3();
const _probeCamPos = new THREE.Vector3();
const _probeFwd = new THREE.Vector3();
const _probeRight = new THREE.Vector3();
const _probeUp = new THREE.Vector3();
const _probePt = new THREE.Vector3();
const _probeQuat = new THREE.Quaternion();
const _probeEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _dummyObj = new THREE.Object3D();

function detectSoftwareWebGL(): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) || '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export class VaultGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envRT: THREE.WebGLRenderTarget;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  private levelGroup = new THREE.Group();
  private dynamicGroup = new THREE.Group();
  private weaponRig: WeaponRig;
  private heavyWeaponRig: WeaponRig;
  private contactShadowTex: THREE.Texture;

  private level: LevelDefinition = LEVELS[0];
  private gridCols = 0;
  private gridRows = 0;

  // Player state
  private playerX = 0;
  private playerZ = 0;
  private spawnGridX = 1;
  private spawnGridZ = 1;
  private playerYaw = 0;
  private playerPitch = 0;
  private playerKnockbackX = 0;
  private playerKnockbackZ = 0;
  private health = 100;
  private maxHealth = 100;

  // 10 bullets in default gun (+ up to 5 packs) OR temporary 10-bullet heavy pickup gun
  private activeWeapon: WeaponKind = 'default';
  private gunBullets = MAX_GUN_BULLETS;
  private specialGunBullets = 0;
  private weaponSwitchAnim = 0;
  private bulletPacks = 1;
  private packsCollectedThisLevel = 0;
  private medkitsSpawnedThisLevel = 0;
  private reloadTimer = 0;
  private reloading = false;

  private coinsCollected = 0;
  private totalCoins = 0;
  private coinEventSeq = 0;
  private score = 0;
  private kills = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private elapsedSeconds = 0;
  private paused = false;
  private finished = false;
  private dying = false;
  private deathFadeTimer = 0;
  private slowMoTimer = 0;
  private timeScale = 1;
  private needsPausedRender = true;
  private isCoarsePointer =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  private bobPhase = 0;
  private footstepTimer = 0.04;
  private footstepIndex = 0;
  private fireCooldown = 0;
  private weaponRecoil = 0;
  private wallTuck = 0;
  private weaponSwayX = 0;
  private weaponSwayY = 0;
  private cameraShake = 0;
  private muzzleTimer = 0;
  private damageFlash = 0;
  private healFlash = 0;
  private hitMarker = 0;
  private bannerMessage: string | null = null;
  private bannerTone: 'info' | 'unlock' | 'warning' | 'treasure' = 'info';
  private bannerTimer = 0;
  private noticeCooldown = 0;
  private hudSyncTimer = 0;
  private floorSpawnTimer = 0;
  private pickupSeq = 0;

  // Level entities
  private bots: BotEntity[] = [];
  private switches: SwitchEntity[] = [];
  private doors: DoorEntity[] = [];
  private doorGrid: Array<DoorEntity | null> = [];
  private pickups: PickupEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private treasureRig: TreasureRig | null = null;
  private treasurePos = { x: 0, z: 0, gridX: 0, gridZ: 0, collected: false };

  private levelDisposables: Array<{ dispose: () => void }> = [];
  private sharedBasicMats = new Map<number, THREE.MeshBasicMaterial>();
  private boltGeo = new THREE.SphereGeometry(0.11, 8, 8);
  private particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);

  public input: ControlInputState = {
    moveForward: 0,
    moveStrafe: 0,
    turnDelta: 0,
    aimDeltaX: 0,
    aimDeltaY: 0,
    firing: false,
  };

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !this.isCoarsePointer,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl
        ? 1
        : Math.min(window.devicePixelRatio || 1, this.isCoarsePointer ? 1.5 : 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && !this.isCoarsePointer;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || 800, container.clientHeight || 450);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const aspect = (container.clientWidth || 800) / (container.clientHeight || 450);
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.05, 95);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmremGenerator.dispose();

    this.contactShadowTex = createContactShadowTexture();

    this.weaponRig = createWeaponModel('default');
    this.weaponRig.group.position.set(0.24, -0.25, -0.45);
    this.camera.add(this.weaponRig.group);

    this.heavyWeaponRig = createWeaponModel('heavy');
    this.heavyWeaponRig.group.position.set(0.24, -0.25, -0.45);
    this.heavyWeaponRig.group.visible = false;
    this.camera.add(this.heavyWeaponRig.group);

    this.scene.add(this.levelGroup);
    this.scene.add(this.dynamicGroup);

    this.handleResize = this.handleResize.bind(this);
    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.visualViewport?.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.loadLevel(1);
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    this.clock.start();
    this.tick();
  }

  private handleContextLost(e: Event) {
    e.preventDefault();
    this.paused = true;
    this.callbacks.onContextLost?.(true);
  }

  private handleContextRestored() {
    this.callbacks.onContextLost?.(false);
    this.paused = false;
  }

  public handleResize() {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    // Widen vertical FOV automatically on portrait phones (iOS & Android) so horizontal view stays comfortable
    this.camera.fov =
      aspect < 1 ? THREE.MathUtils.clamp(70 / Math.pow(aspect, 0.45), 70, 94) : 70;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.needsPausedRender = true;
  }

  public setPaused(p: boolean) {
    this.paused = p;
    this.needsPausedRender = true;
    if (!p) {
      this.clock.getDelta();
    }
  }

  private getSharedBasicMat(colorHex: number): THREE.MeshBasicMaterial {
    let mat = this.sharedBasicMats.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color: colorHex });
      this.sharedBasicMats.set(colorHex, mat);
    }
    return mat;
  }

  private clearLevel() {
    while (this.levelGroup.children.length > 0) {
      this.levelGroup.remove(this.levelGroup.children[0]);
    }
    while (this.dynamicGroup.children.length > 0) {
      this.dynamicGroup.remove(this.dynamicGroup.children[0]);
    }
    for (const item of this.levelDisposables) {
      item.dispose();
    }
    this.levelDisposables = [];
    this.bots = [];
    this.switches = [];
    this.doors = [];
    this.doorGrid = [];
    this.pickups = [];
    this.projectiles = [];
    this.particles = [];
    this.treasureRig = null;
  }

  public loadLevel(levelId: number, carryScore = 0) {
    const def = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    this.level = def;
    this.clearLevel();

    const { theme, grid } = def;
    this.gridRows = grid.length;
    this.gridCols = grid[0].length;

    this.scene.background = new THREE.Color(theme.fogColor);
    this.scene.fog = new THREE.FogExp2(theme.fogColor, 0.024);

    const hemi = new THREE.HemisphereLight(theme.ambientSky, theme.ambientGround, 0.85);
    this.levelGroup.add(hemi);

    const keyLight = new THREE.DirectionalLight(theme.keyLightColor, 1.35);
    keyLight.position.set(22, 32, 20);
    if (this.renderer.shadowMap.enabled) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 80;
      const d = 34;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.levelGroup.add(keyLight);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const wallTex = createWallTexture(theme, maxAniso);
    const crateTex = createCrateTexture(maxAniso);
    const floorTex = createFloorTexture(theme, maxAniso, this.gridCols, this.gridRows);
    this.levelDisposables.push(wallTex, crateTex, floorTex);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.62,
      metalness: 0.18,
    });
    const crateMat = new THREE.MeshStandardMaterial({
      map: crateTex,
      roughness: 0.72,
      metalness: 0.12,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.78,
      metalness: 0.1,
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: theme.ceilingColor,
      roughness: 0.85,
      metalness: 0.1,
    });
    this.levelDisposables.push(wallMat, crateMat, floorMat, ceilingMat);

    const mapWidth = this.gridCols * TILE_SIZE;
    const mapDepth = this.gridRows * TILE_SIZE;

    const floorGeo = new THREE.PlaneGeometry(mapWidth, mapDepth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(mapWidth / 2, 0, mapDepth / 2);
    floorMesh.receiveShadow = this.renderer.shadowMap.enabled;
    this.levelGroup.add(floorMesh);

    const ceilingGeo = new THREE.PlaneGeometry(mapWidth, mapDepth);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(mapWidth / 2, WALL_HEIGHT, mapDepth / 2);
    this.levelGroup.add(ceilingMesh);

    const wallGeo = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const crateGeo = new THREE.BoxGeometry(TILE_SIZE * 0.66, TILE_SIZE * 0.66, TILE_SIZE * 0.66);
    const lampGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.levelDisposables.push(floorGeo, ceilingGeo, wallGeo, crateGeo, lampGeo, lampMat);

    const amberDoorTex = createDoorTexture(SWITCH_HEX.amber, 'AMBER LOCK', maxAniso);
    const cyanDoorTex = createDoorTexture(SWITCH_HEX.cyan, 'CYAN LOCK', maxAniso);
    const violetDoorTex = createDoorTexture(SWITCH_HEX.violet, 'VIOLET LOCK', maxAniso);
    const bountyDoorTex = createDoorTexture(
      '#f43f5e',
      `${def.bountyKillsRequired} BOTS`,
      maxAniso,
    );
    const trophyDoorTex = createDoorTexture('#facc15', 'TROPHY LOCK', maxAniso);
    this.levelDisposables.push(
      amberDoorTex,
      cyanDoorTex,
      violetDoorTex,
      bountyDoorTex,
      trophyDoorTex,
    );

    this.doorGrid = new Array<DoorEntity | null>(this.gridCols * this.gridRows).fill(null);

    // Reset player stats, weapon & bucket
    this.health = 100;
    this.maxHealth = 100;
    this.activeWeapon = 'default';
    this.gunBullets = def.startingGunBullets ?? MAX_GUN_BULLETS;
    this.specialGunBullets = 0;
    this.weaponSwitchAnim = 0;
    this.weaponRig.group.visible = true;
    this.heavyWeaponRig.group.visible = false;
    this.bulletPacks = def.startingBulletPacks ?? 1;
    this.packsCollectedThisLevel = 0;
    this.medkitsSpawnedThisLevel = 0;
    this.reloadTimer = 0;
    this.reloading = false;
    this.coinsCollected = 0;
    this.totalCoins = 0;
    this.score = carryScore;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.elapsedSeconds = 0;
    this.finished = false;
    this.dying = false;
    this.deathFadeTimer = 0;
    this.slowMoTimer = 0;
    this.timeScale = 1;
    this.paused = false;
    this.needsPausedRender = true;
    this.damageFlash = 0;
    this.healFlash = 0;
    this.hitMarker = 0;
    this.wallTuck = 0;
    this.weaponSwayX = 0;
    this.weaponSwayY = 0;
    this.cameraShake = 0;
    this.noticeCooldown = 0;
    this.floorSpawnTimer = 0;
    this.pickupSeq = 0;
    this.footstepTimer = 0.04;
    this.footstepIndex = 0;
    this.playerPitch = 0;
    this.playerYaw = def.startYaw;
    this.playerKnockbackX = 0;
    this.playerKnockbackZ = 0;

    const wallTransforms: THREE.Matrix4[] = [];
    const crateTransforms: THREE.Matrix4[] = [];
    const lampTransforms: THREE.Matrix4[] = [];

    for (let gz = 0; gz < this.gridRows; gz++) {
      const row = grid[gz];
      for (let gx = 0; gx < this.gridCols; gx++) {
        const ch = row[gx];
        const wx = (gx + 0.5) * TILE_SIZE;
        const wz = (gz + 0.5) * TILE_SIZE;

        if (ch === '#') {
          _dummyObj.position.set(wx, WALL_HEIGHT / 2, wz);
          _dummyObj.rotation.set(0, 0, 0);
          _dummyObj.scale.set(1, 1, 1);
          _dummyObj.updateMatrix();
          wallTransforms.push(_dummyObj.matrix.clone());
        } else if (ch === 'C') {
          const crateSize = TILE_SIZE * 0.66;
          _dummyObj.position.set(wx, crateSize / 2, wz);
          _dummyObj.rotation.set(0, 0, 0);
          _dummyObj.scale.set(1, 1, 1);
          _dummyObj.updateMatrix();
          crateTransforms.push(_dummyObj.matrix.clone());

          if ((gx + gz) % 2 === 0) {
            _dummyObj.position.set(wx, crateSize + crateSize * 0.275, wz);
            _dummyObj.rotation.set(0, 0.25, 0);
            _dummyObj.scale.setScalar(0.55);
            _dummyObj.updateMatrix();
            crateTransforms.push(_dummyObj.matrix.clone());
          }
        } else if (ch === 'S') {
          this.playerX = wx;
          this.playerZ = wz;
          this.spawnGridX = gx;
          this.spawnGridZ = gz;
        } else if (ch === 'T') {
          this.treasurePos = { x: wx, z: wz, gridX: gx, gridZ: gz, collected: false };
          this.treasureRig = createTreasureModel(theme.treasureColor, this.contactShadowTex);
          this.treasureRig.group.position.set(wx, 0, wz);
          this.levelGroup.add(this.treasureRig.group);
        } else if (ch === 'a' || ch === 'b' || ch === 'v') {
          const color: SwitchColor =
            ch === 'a' ? 'amber' : ch === 'b' ? 'cyan' : 'violet';
          const rig = createSwitchModel(color, this.contactShadowTex);
          rig.group.position.set(wx, 0, wz);
          this.levelGroup.add(rig.group);
          this.switches.push({
            state: {
              id: `sw_${gx}_${gz}`,
              gridX: gx,
              gridZ: gz,
              color,
              activated: false,
            },
            x: wx,
            z: wz,
            rig,
          });
        } else if (ch === 'A' || ch === 'B' || ch === 'V' || ch === 'K' || ch === 'F') {
          const isBounty = ch === 'K';
          const isTrophy = ch === 'F';
          const switchColor: SwitchColor | undefined =
            ch === 'A' ? 'amber' : ch === 'B' ? 'cyan' : ch === 'V' ? 'violet' : undefined;
          const tex =
            ch === 'A'
              ? amberDoorTex
              : ch === 'B'
                ? cyanDoorTex
                : ch === 'V'
                  ? violetDoorTex
                  : isTrophy
                    ? trophyDoorTex
                    : bountyDoorTex;
          const accent = switchColor ? SWITCH_COLORS[switchColor] : isTrophy ? 0xfacc15 : 0xf43f5e;
          const rig = createDoorModel(TILE_SIZE, WALL_HEIGHT, tex, accent);
          rig.group.position.set(wx, 0, wz);

          const leftWall = gx > 0 && grid[gz][gx - 1] === '#';
          const rightWall = gx < this.gridCols - 1 && grid[gz][gx + 1] === '#';
          if (!(leftWall && rightWall)) {
            rig.group.rotation.y = Math.PI / 2;
          }

          this.levelGroup.add(rig.group);
          const doorEntity: DoorEntity = {
            state: {
              id: `door_${gx}_${gz}`,
              gridX: gx,
              gridZ: gz,
              kind: isTrophy ? 'trophy' : isBounty ? 'bounty' : 'switch',
              switchColor,
              requiredKills: isBounty ? def.bountyKillsRequired : undefined,
              unlocked: false,
              openProgress: 0,
            },
            x: wx,
            z: wz,
            rig,
          };
          this.doors.push(doorEntity);
          this.doorGrid[gz * this.gridCols + gx] = doorEntity;
        } else if (ch === '1' || ch === '2' || ch === '3' || ch === '4') {
          const style: BotStyle =
            ch === '4'
              ? 'dreadnought'
              : ch === '3'
                ? 'enforcer'
                : ch === '2'
                  ? 'striker'
                  : 'sentinel';
          const rig = createBotModel(style, this.contactShadowTex, def.id);
          rig.group.position.set(wx, 0, wz);
          this.levelGroup.add(rig.group);
          const maxHp =
            style === 'dreadnought' ? 120 : style === 'striker' ? 75 : 100;
          const speed =
            style === 'striker'
              ? Math.min(3.85, 2.7 + def.id * 0.05)
              : style === 'dreadnought'
                ? Math.min(3.55, 2.55 + Math.max(0, def.id - 15) * 0.07)
                : style === 'enforcer'
                  ? Math.min(3.3, 2.25 + Math.max(0, def.id - 7) * 0.05)
                  : Math.min(2.9, 1.7 + def.id * 0.045);
          const burstCount =
            style === 'dreadnought'
              ? 7
              : style === 'enforcer'
                ? 6
                : style === 'striker'
                  ? 3
                  : BOT_BURST_COUNT;
          const burstInterval =
            style === 'dreadnought'
              ? 0.12
              : style === 'enforcer'
                ? 0.135
                : style === 'striker'
                  ? 0.11
                  : BOT_BURST_INTERVAL;
          const regenSeconds =
            style === 'striker'
              ? 1.25
              : style === 'dreadnought'
                ? 1.5
                : style === 'enforcer'
                  ? 1.7
                  : BOT_REGEN_SECONDS;

          this.bots.push({
            id: `bot_${gx}_${gz}`,
            style,
            x: wx,
            z: wz,
            yaw: Math.random() * Math.PI * 2,
            hp: maxHp,
            maxHp,
            speed,
            alive: true,
            alerted: false,
            doorPhase: 'cooldown',
            doorOpen: 0,
            regenSeconds,
            regenTimer: style === 'sentinel' ? 0.45 : style === 'striker' ? 0.2 : 0.3,
            burstCount,
            burstInterval,
            bulletsLeftInBurst: burstCount,
            burstShotTimer: 0,
            hitFlash: 0,
            knockbackX: 0,
            knockbackZ: 0,
            patrolAngle: Math.random() * Math.PI * 2,
            patrolTimer: 0.2 + Math.random() * 0.8,
            strafeSign: Math.random() < 0.5 ? -1 : 1,
            aiDecisionTimer: style === 'striker' ? 0.35 + Math.random() * 0.45 : 0.4 + Math.random() * 0.8,
            repathTimer: Math.random() * 0.3,
            stuckTimer: 0,
            lastCheckX: wx,
            lastCheckZ: wz,
            targetWx: wx,
            targetWz: wz,
            hasTargetWaypoint: false,
            rig,
          });
        } else if (ch === '+' || ch === 'E' || ch === 'O') {
          const kind = ch === '+' ? 'medkit' : ch === 'E' ? 'pack' : 'coin';
          if (kind === 'coin') this.totalCoins++;
          if (kind === 'medkit') this.medkitsSpawnedThisLevel++;
          const mesh = createPickupModel(kind, this.contactShadowTex);
          mesh.position.set(wx, 0, wz);
          this.levelGroup.add(mesh);
          this.pickups.push({
            id: `pk_${gx}_${gz}`,
            kind,
            x: wx,
            z: wz,
            collected: false,
            mesh,
            spinGroup: mesh.getObjectByName('spinGroup') || null,
            haloMesh: mesh.getObjectByName('coinHalo') || null,
          });
        }

        if (ch !== '#' && gx % 3 === 1 && gz % 3 === 1) {
          _dummyObj.position.set(wx, WALL_HEIGHT - 0.2, wz);
          _dummyObj.rotation.set(0, 0, 0);
          _dummyObj.scale.set(1, 1, 1);
          _dummyObj.updateMatrix();
          lampTransforms.push(_dummyObj.matrix.clone());
        }
      }
    }

    if (wallTransforms.length > 0) {
      const wallInst = new THREE.InstancedMesh(wallGeo, wallMat, wallTransforms.length);
      for (let i = 0; i < wallTransforms.length; i++) {
        wallInst.setMatrixAt(i, wallTransforms[i]);
      }
      wallInst.instanceMatrix.needsUpdate = true;
      wallInst.receiveShadow = this.renderer.shadowMap.enabled;
      this.levelGroup.add(wallInst);
    }

    if (crateTransforms.length > 0) {
      const crateInst = new THREE.InstancedMesh(crateGeo, crateMat, crateTransforms.length);
      for (let i = 0; i < crateTransforms.length; i++) {
        crateInst.setMatrixAt(i, crateTransforms[i]);
      }
      crateInst.instanceMatrix.needsUpdate = true;
      crateInst.castShadow = this.renderer.shadowMap.enabled;
      crateInst.receiveShadow = this.renderer.shadowMap.enabled;
      this.levelGroup.add(crateInst);
    }

    if (lampTransforms.length > 0) {
      const lampInst = new THREE.InstancedMesh(lampGeo, lampMat, lampTransforms.length);
      for (let i = 0; i < lampTransforms.length; i++) {
        lampInst.setMatrixAt(i, lampTransforms[i]);
      }
      lampInst.instanceMatrix.needsUpdate = true;
      this.levelGroup.add(lampInst);
    }

    // Randomly spawn Bullet Packs, Health Kits, and Heavy Railguns (skipped on Level 1 Coin Tutorial)
    if (def.tutorialMode !== 'coins') {
      const existingPacks = this.pickups.filter((p) => p.kind === 'pack').length;
      const packsToSpawn = Math.max(0, Math.max(3, def.packCount) - existingPacks);
      const frontPacks = Math.ceil(packsToSpawn * 0.55);
      for (let i = 0; i < frontPacks; i++) {
        this.spawnRandomFloorPickup('pack', true, 1.8);
      }
      for (let i = frontPacks; i < packsToSpawn; i++) {
        this.spawnRandomFloorPickup('pack', false, 2.2);
      }
      const medkitsToSpawn = Math.max(
        0,
        MAX_HEALTH_PACKS_PER_LEVEL - this.medkitsSpawnedThisLevel,
      );
      for (let i = 0; i < medkitsToSpawn; i++) {
        const preferUnlocked = i < 2;
        const spawned =
          this.spawnRandomFloorPickup('medkit', preferUnlocked, 2.2) ||
          (preferUnlocked && this.spawnRandomFloorPickup('medkit', false, 2.2));
        if (spawned) {
          this.medkitsSpawnedThisLevel++;
        }
      }
      for (let i = 0; i < def.gunPickupCount; i++) {
        this.spawnRandomFloorPickup('gun', i < 2, i === 0 ? 1.6 : 2.3);
      }
    }

    this.showBanner(
      `Level ${def.id}/30: ${def.theme.name} — Collect ${this.totalCoins} Coins & Defeat ${this.bots.length} Bots`,
      'info',
      3.5,
    );
    this.syncCamera(0);
    this.emitHud();
  }

  private getReachableFloorCells(onlyCurrentlyUnlocked: boolean): Array<{ gx: number; gz: number }> {
    const startGx = THREE.MathUtils.clamp(
      Math.floor(this.playerX / TILE_SIZE),
      1,
      Math.max(1, this.gridCols - 2),
    );
    const startGz = THREE.MathUtils.clamp(
      Math.floor(this.playerZ / TILE_SIZE),
      1,
      Math.max(1, this.gridRows - 2),
    );

    const visited = new Set<string>();
    const queue: Array<{ gx: number; gz: number }> = [{ gx: startGx, gz: startGz }];
    visited.add(`${startGx},${startGz}`);
    const results: Array<{ gx: number; gz: number }> = [];

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const [dx, dz] of dirs) {
        const nx = cur.gx + dx;
        const nz = cur.gz + dz;
        if (nx < 0 || nz < 0 || nx >= this.gridCols || nz >= this.gridRows) continue;
        const key = `${nx},${nz}`;
        if (visited.has(key)) continue;

        const ch = this.level.grid[nz]?.[nx] || '#';
        if (ch === '#' || ch === 'C' || ch === 'F') continue;
        if (onlyCurrentlyUnlocked) {
          const door = this.doorGrid[nz * this.gridCols + nx];
          if (door && !door.state.unlocked) continue;
        }

        visited.add(key);
        queue.push({ gx: nx, gz: nz });

        // Only place random floor items on clean floor cells (.)
        if (ch === '.') {
          const wx = (nx + 0.5) * TILE_SIZE;
          const wz = (nz + 0.5) * TILE_SIZE;
          const occupied =
            this.pickups.some((p) => !p.collected && Math.hypot(p.x - wx, p.z - wz) < 1.3) ||
            this.switches.some((s) => Math.hypot(s.x - wx, s.z - wz) < 1.3) ||
            this.bots.some((b) => b.alive && Math.hypot(b.x - wx, b.z - wz) < 1.4);
          if (!occupied) {
            results.push({ gx: nx, gz: nz });
          }
        }
      }
    }
    return results;
  }

  private spawnRandomFloorPickup(
    kind: 'pack' | 'medkit' | 'gun',
    onlyCurrentlyUnlocked: boolean,
    minPlayerDist = 2.2,
  ): boolean {
    const candidates = this.getReachableFloorCells(onlyCurrentlyUnlocked).filter((c) => {
      const wx = (c.gx + 0.5) * TILE_SIZE;
      const wz = (c.gz + 0.5) * TILE_SIZE;
      return Math.hypot(wx - this.playerX, wz - this.playerZ) >= minPlayerDist;
    });
    const pool =
      candidates.length > 0 ? candidates : this.getReachableFloorCells(onlyCurrentlyUnlocked);
    if (pool.length === 0) return false;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const wx = (chosen.gx + 0.5) * TILE_SIZE;
    const wz = (chosen.gz + 0.5) * TILE_SIZE;
    const mesh = createPickupModel(kind, this.contactShadowTex);
    mesh.position.set(wx, 0, wz);
    this.levelGroup.add(mesh);
    this.pickups.push({
      id: `pk_rand_${++this.pickupSeq}`,
      kind,
      x: wx,
      z: wz,
      collected: false,
      mesh,
      spinGroup: mesh.getObjectByName('spinGroup') || null,
      haloMesh: mesh.getObjectByName('coinHalo') || null,
    });
    return true;
  }

  private showBanner(
    _msg: string,
    _tone: 'info' | 'unlock' | 'warning' | 'treasure',
    _duration = 2.6,
  ) {
    // In-game popup banners disabled per user preference
    this.bannerMessage = null;
    this.bannerTimer = 0;
  }

  private projectWorldToScreenPercent(
    x: number,
    y: number,
    z: number,
  ): { startXPercent: number; startYPercent: number } {
    const projected = _vec3A.set(x, y, z).project(this.camera);
    const behind = projected.z > 1;
    const startXPercent = behind
      ? 50
      : THREE.MathUtils.clamp((projected.x * 0.5 + 0.5) * 100, 14, 86);
    const startYPercent = behind
      ? 76
      : THREE.MathUtils.clamp((-projected.y * 0.5 + 0.5) * 100, 18, 82);
    return { startXPercent, startYPercent };
  }

  private isCellBlocked(gx: number, gz: number): boolean {
    if (gx < 0 || gz < 0 || gx >= this.gridCols || gz >= this.gridRows) return true;
    const ch = this.level.grid[gz][gx];
    if (ch === '#' || ch === 'C') return true;
    const door = this.doorGrid[gz * this.gridCols + gx];
    if (door && door.state.openProgress < 0.78) return true;
    return false;
  }

  private isPointInsideObstacle(wx: number, wy: number, wz: number, margin: number): boolean {
    if (wy < -margin) return true;
    const cgx = Math.floor(wx / TILE_SIZE);
    const cgz = Math.floor(wz / TILE_SIZE);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cgx + dx;
        const gz = cgz + dz;
        if (gx < 0 || gz < 0 || gx >= this.gridCols || gz >= this.gridRows) {
          const minX = gx * TILE_SIZE - margin;
          const maxX = (gx + 1) * TILE_SIZE + margin;
          const minZ = gz * TILE_SIZE - margin;
          const maxZ = (gz + 1) * TILE_SIZE + margin;
          if (wx >= minX && wx <= maxX && wz >= minZ && wz <= maxZ) return true;
          continue;
        }

        const ch = this.level.grid[gz][gx];
        if (ch === '#') {
          const minX = gx * TILE_SIZE - margin;
          const maxX = (gx + 1) * TILE_SIZE + margin;
          const minZ = gz * TILE_SIZE - margin;
          const maxZ = (gz + 1) * TILE_SIZE + margin;
          if (
            wx >= minX &&
            wx <= maxX &&
            wz >= minZ &&
            wz <= maxZ &&
            wy <= WALL_HEIGHT + margin
          ) {
            return true;
          }
        } else if (ch === 'C') {
          const pad = TILE_SIZE * 0.17;
          const minX = gx * TILE_SIZE + pad - margin;
          const maxX = (gx + 1) * TILE_SIZE - pad + margin;
          const minZ = gz * TILE_SIZE + pad - margin;
          const maxZ = (gz + 1) * TILE_SIZE - pad + margin;
          const maxH = (gx + gz) % 2 === 0 ? WALL_HEIGHT : TILE_SIZE * 0.66;
          if (wx >= minX && wx <= maxX && wz >= minZ && wz <= maxZ && wy <= maxH + margin) {
            return true;
          }
        } else {
          const door = this.doorGrid[gz * this.gridCols + gx];
          if (door && door.state.openProgress < 0.85) {
            const minX = gx * TILE_SIZE - margin;
            const maxX = (gx + 1) * TILE_SIZE + margin;
            const minZ = gz * TILE_SIZE - margin;
            const maxZ = (gz + 1) * TILE_SIZE + margin;
            if (
              wx >= minX &&
              wx <= maxX &&
              wz >= minZ &&
              wz <= maxZ &&
              wy <= WALL_HEIGHT + margin
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private computeWeaponWallTuck(isHeavy: boolean): number {
    _probeEuler.set(this.playerPitch, this.playerYaw, 0, 'YXZ');
    _probeQuat.setFromEuler(_probeEuler);
    _probeCamPos.set(this.playerX, EYE_HEIGHT, this.playerZ);
    _probeFwd.set(0, 0, -1).applyQuaternion(_probeQuat);
    _probeRight.set(1, 0, 0).applyQuaternion(_probeQuat);
    _probeUp.set(0, 1, 0).applyQuaternion(_probeQuat);

    const maxReach = isHeavy ? 1.18 : 1.04;
    let maxTuck = 0;

    // Sample points from receiver to muzzle along both weapon axis and inner sightline
    for (let d = 0.36; d <= maxReach + 0.01; d += 0.14) {
      const dist = Math.min(d, maxReach);
      _probePt
        .copy(_probeCamPos)
        .addScaledVector(_probeRight, 0.21)
        .addScaledVector(_probeUp, -0.2)
        .addScaledVector(_probeFwd, dist);
      const hitOuter = this.isPointInsideObstacle(_probePt.x, _probePt.y, _probePt.z, 0.14);

      _probePt
        .copy(_probeCamPos)
        .addScaledVector(_probeRight, 0.06)
        .addScaledVector(_probeUp, -0.2)
        .addScaledVector(_probeFwd, dist);
      const hitInner = this.isPointInsideObstacle(_probePt.x, _probePt.y, _probePt.z, 0.11);

      if (hitOuter || hitInner) {
        const tuck = THREE.MathUtils.clamp(
          (maxReach - (dist - 0.14)) / (maxReach - 0.3),
          0.18,
          1,
        );
        if (tuck > maxTuck) maxTuck = tuck;
      }
    }

    // Also tuck slightly if right flank of weapon brushes against a right-side wall
    _probePt
      .copy(_probeCamPos)
      .addScaledVector(_probeRight, 0.3)
      .addScaledVector(_probeUp, -0.2)
      .addScaledVector(_probeFwd, 0.44);
    if (this.isPointInsideObstacle(_probePt.x, _probePt.y, _probePt.z, 0.08)) {
      maxTuck = Math.max(maxTuck, 0.45);
    }

    return maxTuck;
  }

  private resolveCircleGridCollision(
    x: number,
    z: number,
    radius: number,
  ): { x: number; z: number } {
    let rx = x;
    let rz = z;
    const cgx = Math.floor(rx / TILE_SIZE);
    const cgz = Math.floor(rz / TILE_SIZE);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cgx + dx;
        const gz = cgz + dz;
        if (!this.isCellBlocked(gx, gz)) continue;

        const minX = gx * TILE_SIZE;
        const maxX = (gx + 1) * TILE_SIZE;
        const minZ = gz * TILE_SIZE;
        const maxZ = (gz + 1) * TILE_SIZE;

        const ch =
          gx >= 0 && gz >= 0 && gx < this.gridCols && gz < this.gridRows
            ? this.level.grid[gz][gx]
            : '#';
        const pad = ch === 'C' ? TILE_SIZE * 0.17 : 0;

        const cMinX = minX + pad;
        const cMaxX = maxX - pad;
        const cMinZ = minZ + pad;
        const cMaxZ = maxZ - pad;

        const closestX = THREE.MathUtils.clamp(rx, cMinX, cMaxX);
        const closestZ = THREE.MathUtils.clamp(rz, cMinZ, cMaxZ);
        const distX = rx - closestX;
        const distZ = rz - closestZ;
        const distSq = distX * distX + distZ * distZ;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const overlap = radius - dist;
            rx += (distX / dist) * overlap;
            rz += (distZ / dist) * overlap;
          } else {
            rx += radius * 0.5;
          }
        }
      }
    }
    return { x: rx, z: rz };
  }

  private hasLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.01) return true;
    const steps = Math.ceil(dist / 0.45);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x1 + dx * t;
      const sz = z1 + dz * t;
      const gx = Math.floor(sx / TILE_SIZE);
      const gz = Math.floor(sz / TILE_SIZE);
      if (this.isCellBlocked(gx, gz)) return false;
    }
    return true;
  }

  private activateSwitch(sw: SwitchEntity) {
    if (sw.state.activated) return;
    sw.state.activated = true;

    const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(sw.x, 1.56, sw.z);
    const hexNum = parseInt(SWITCH_HEX[sw.state.color].replace('#', ''), 16);

    // Make collected door-opening trophy completely invisible in the world
    sw.rig.group.visible = false;
    sw.rig.beacon.intensity = 0;
    this.levelGroup.remove(sw.rig.group);

    for (const door of this.doors) {
      if (door.state.kind === 'switch' && door.state.switchColor === sw.state.color) {
        door.state.unlocked = true;
      }
    }

    soundFX.playSwitchUnlock();
    this.score += 120;
    this.spawnParticles(sw.x, 1.56, sw.z, hexNum, 16);
    this.callbacks.onCoinCollected?.({
      id: ++this.coinEventSeq,
      kind: 'trophy',
      startXPercent,
      startYPercent,
      points: 120,
      switchColor: sw.state.color,
    });
    this.hudSyncTimer = 0;
    this.emitHud();
  }

  private checkBountyDoors() {
    if (this.level.bountyKillsRequired <= 0) return;
    if (this.kills < this.level.bountyKillsRequired) return;

    let newlyUnlocked = false;
    for (const door of this.doors) {
      if (door.state.kind === 'bounty' && !door.state.unlocked) {
        door.state.unlocked = true;
        newlyUnlocked = true;
      }
    }
    if (newlyUnlocked) {
      soundFX.playSwitchUnlock();
      this.showBanner('Bounty Complete — Bot Seal Door Unlocked!', 'unlock', 2.8);
    }
  }

  private checkTrophyDoors() {
    if (this.coinsCollected < this.totalCoins) return;
    if (this.kills < this.bots.length) return;

    let newlyUnlocked = false;
    for (const door of this.doors) {
      if (door.state.kind === 'trophy' && !door.state.unlocked) {
        door.state.unlocked = true;
        newlyUnlocked = true;
      }
    }
    if (newlyUnlocked) {
      soundFX.playSwitchUnlock();
      this.bannerMessage = `All Tasks Complete! Reach the ${this.level.theme.jewelleryName}`;
      this.bannerTone = 'treasure';
      this.bannerTimer = 4.8;
      this.hudSyncTimer = 0;
      this.emitHud();
    }
  }

  private spawnParticles(x: number, y: number, z: number, colorHex: number, count: number) {
    const mat = this.getSharedBasicMat(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        const oldest = this.particles.shift();
        if (oldest) this.dynamicGroup.remove(oldest.mesh);
      }
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(x, y, z);
      this.dynamicGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 4.2;
      this.particles.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          1.4 + Math.random() * 3.4,
          Math.sin(angle) * speed,
        ),
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.65,
        mesh,
      });
    }
  }

  private spawnBolt(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    fromPlayer: boolean,
    damage: number,
    weaponKind: WeaponKind = 'default',
  ) {
    const boltColor = fromPlayer
      ? weaponKind === 'heavy'
        ? 0xf59e0b
        : 0x38bdf8
      : 0xf43f5e;
    const mat = this.getSharedBasicMat(boltColor);
    const mesh = new THREE.Mesh(this.boltGeo, mat);
    if (fromPlayer && weaponKind === 'heavy') {
      mesh.scale.setScalar(1.38);
    }
    mesh.position.copy(origin);
    this.dynamicGroup.add(mesh);

    const speed = fromPlayer
      ? weaponKind === 'heavy'
        ? 46
        : 36
      : 11.5 + Math.min(4.5, this.level.id * 0.14) + (this.level.id >= 18 ? 1.8 : 0);
    this.projectiles.push({
      fromPlayer,
      weaponKind: fromPlayer ? weaponKind : undefined,
      pos: origin.clone(),
      vel: dir.clone().normalize().multiplyScalar(speed),
      damage,
      life: fromPlayer ? 0.95 : 2.6,
      mesh,
    });
  }

  private triggerAutofillReload() {
    if (this.reloading || this.bulletPacks <= 0 || this.gunBullets >= MAX_GUN_BULLETS) return;
    this.reloading = true;
    this.reloadTimer = 0.28;
    soundFX.playReload();
  }

  private firePlayerWeapon() {
    if (this.fireCooldown > 0 || this.paused || this.finished) return;

    const usingHeavy = this.activeWeapon === 'heavy' && this.specialGunBullets > 0;
    if (!usingHeavy && this.reloading) return;

    let firedWeapon: WeaponKind = 'default';

    if (usingHeavy) {
      firedWeapon = 'heavy';
      this.specialGunBullets--;
      this.shotsFired++;
      this.fireCooldown = 0.21;
      this.weaponRecoil = 1.25;
      this.muzzleTimer = 0.09;
      soundFX.playHeavyShoot();

      // Revert cleanly to default gun once all 10 special bullets are spent
      if (this.specialGunBullets <= 0) {
        this.activeWeapon = 'default';
        this.specialGunBullets = 0;
        this.weaponSwitchAnim = 1;
        soundFX.playWeaponRevert();
        if (this.gunBullets === 0 && this.bulletPacks > 0) {
          this.triggerAutofillReload();
        }
      }
    } else {
      if (this.gunBullets <= 0) {
        if (this.bulletPacks > 0) {
          this.triggerAutofillReload();
        } else {
          this.fireCooldown = 0.28;
          soundFX.playEmptyClick();
        }
        return;
      }

      this.gunBullets--;
      this.shotsFired++;
      this.fireCooldown = 0.19;
      this.weaponRecoil = 1;
      this.muzzleTimer = 0.08;
      soundFX.playShoot();

      // Autofill immediately from bucket when the 10th bullet is spent
      if (this.gunBullets === 0 && this.bulletPacks > 0) {
        this.triggerAutofillReload();
      }
    }

    let targetDist = 18;
    const camForward = _vec3A.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const aimDir = _vec3C.copy(camForward);

    let bestDot = 0.974;
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      _vec3B.set(bot.x - this.playerX, 1.12 - EYE_HEIGHT, bot.z - this.playerZ);
      const dist = _vec3B.length();
      if (dist > 28) continue;
      _vec3B.normalize();
      const dot = camForward.dot(_vec3B);
      if (dot > bestDot && this.hasLineOfSight(this.playerX, this.playerZ, bot.x, bot.z)) {
        bestDot = dot;
        aimDir.copy(_vec3B);
        targetDist = dist;
      }
    }

    for (const sw of this.switches) {
      if (sw.state.activated) continue;
      _vec3B.set(sw.x - this.playerX, 1.56 - EYE_HEIGHT, sw.z - this.playerZ);
      const dist = _vec3B.length();
      if (dist > 22) continue;
      _vec3B.normalize();
      const dot = camForward.dot(_vec3B);
      if (dot > bestDot && this.hasLineOfSight(this.playerX, this.playerZ, sw.x, sw.z)) {
        bestDot = dot;
        aimDir.copy(_vec3B);
        targetDist = dist;
      }
    }

    // Spawn bolt from visible gun muzzle converging onto exact crosshair target point,
    // pulling the spawn origin safely inside player clearance when tucked near a wall
    _vec3D
      .set(this.playerX, EYE_HEIGHT, this.playerZ)
      .addScaledVector(aimDir, Math.max(2.5, targetDist));
    const spawnX = THREE.MathUtils.lerp(0.16, 0.02, this.wallTuck);
    const spawnY = THREE.MathUtils.lerp(-0.18, -0.14, this.wallTuck);
    const spawnZ = THREE.MathUtils.lerp(-0.56, -0.2, this.wallTuck);
    _vec3B.set(spawnX, spawnY, spawnZ).applyMatrix4(this.camera.matrixWorld);
    if (this.isPointInsideObstacle(_vec3B.x, _vec3B.y, _vec3B.z, 0.05)) {
      _vec3B.set(this.playerX, EYE_HEIGHT - 0.1, this.playerZ).addScaledVector(aimDir, 0.18);
    }
    const boltDir = _vec3D.sub(_vec3B).normalize();

    this.cameraShake = Math.max(this.cameraShake, firedWeapon === 'heavy' ? 0.02 : 0.007);
    const baseDamage = firedWeapon === 'heavy' ? 25 : 10;
    this.spawnBolt(_vec3B, boltDir, true, baseDamage, firedWeapon);
    this.hudSyncTimer = 0;
    this.emitHud();
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      let remove = p.life <= 0;

      if (!remove && this.isPointInsideObstacle(p.pos.x, p.pos.y, p.pos.z, 0.06)) {
        const sparkColor = p.fromPlayer
          ? p.weaponKind === 'heavy'
            ? 0xf59e0b
            : 0x38bdf8
          : 0xf43f5e;
        this.spawnParticles(p.pos.x, p.pos.y, p.pos.z, sparkColor, 5);
        if (p.fromPlayer) {
          soundFX.playWallHit();
        }
        remove = true;
      }

      if (!remove && p.fromPlayer) {
        const hitWeapon = p.weaponKind || 'default';
        for (const bot of this.bots) {
          if (!bot.alive) continue;
          const distXZ = Math.hypot(p.pos.x - bot.x, p.pos.z - bot.z);
          if (distXZ < 0.86 && p.pos.y > 0.08 && p.pos.y < 2.35) {
            const vLen = Math.hypot(p.vel.x, p.vel.z) || 1;
            const kbScale = hitWeapon === 'heavy' ? 8.2 : 6.4;
            const kx = (p.vel.x / vLen) * kbScale;
            const kz = (p.vel.z / vLen) * kbScale;
            bot.knockbackX = THREE.MathUtils.clamp(bot.knockbackX + kx, -9.5, 9.5);
            bot.knockbackZ = THREE.MathUtils.clamp(bot.knockbackZ + kz, -9.5, 9.5);

            this.damageBot(bot, p.damage, hitWeapon);
            this.shotsHit++;
            this.hitMarker = 1;
            this.spawnParticles(
              p.pos.x,
              p.pos.y,
              p.pos.z,
              hitWeapon === 'heavy' ? 0xf59e0b : 0xfbbf24,
              hitWeapon === 'heavy' ? 11 : 7,
            );
            remove = true;
            break;
          }
        }

        if (!remove) {
          for (const sw of this.switches) {
            if (sw.state.activated) continue;
            const distXZ = Math.hypot(p.pos.x - sw.x, p.pos.z - sw.z);
            if (distXZ < 0.72 && p.pos.y > 0.75 && p.pos.y < 2.25) {
              this.activateSwitch(sw);
              this.shotsHit++;
              this.hitMarker = 1;
              this.spawnParticles(sw.x, 1.56, sw.z, 0x22c55e, 12);
              remove = true;
              break;
            }
          }
        }
      } else if (!remove && !p.fromPlayer) {
        const distXZ = Math.hypot(p.pos.x - this.playerX, p.pos.z - this.playerZ);
        if (distXZ < PLAYER_RADIUS + 0.14) {
          // Knock player backwards horizontally along enemy bullet direction without throwing off crosshair pitch
          const vLen = Math.hypot(p.vel.x, p.vel.z) || 1;
          const kx = (p.vel.x / vLen) * 5.2;
          const kz = (p.vel.z / vLen) * 5.2;
          this.playerKnockbackX = THREE.MathUtils.clamp(this.playerKnockbackX + kx, -7.5, 7.5);
          this.playerKnockbackZ = THREE.MathUtils.clamp(this.playerKnockbackZ + kz, -7.5, 7.5);

          this.damagePlayer(p.damage);
          remove = true;
        }
      }

      if (remove) {
        this.dynamicGroup.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private damageBot(bot: BotEntity, amount: number, weaponKind: WeaponKind = 'default') {
    // Armored Enforcers & Dreadnoughts resist default pulse bolts,
    // while the picked-up Heavy Railgun pierces armor for full high-impact damage.
    const isArmored = bot.style === 'enforcer' || bot.style === 'dreadnought';
    const actualDamage =
      weaponKind === 'heavy'
        ? Math.max(amount, 25)
        : bot.style === 'dreadnought'
          ? 4
          : bot.style === 'enforcer'
            ? 5
            : amount;

    bot.hp = Math.max(0, bot.hp - actualDamage);
    bot.alerted = true;
    bot.hitFlash = 0.15;
    soundFX.playEnemyHit();
    if (weaponKind === 'default' && isArmored) {
      soundFX.playArmorDeflect();
    }

    if (bot.hp <= 0) {
      bot.alive = false;
      bot.rig.group.visible = false;
      this.kills++;
      this.score +=
        bot.style === 'dreadnought'
          ? 300
          : bot.style === 'enforcer'
            ? 240
            : bot.style === 'striker'
              ? 180
              : 150;
      soundFX.playEnemyDefeat();
      this.spawnParticles(bot.x, 1.1, bot.z, 0xfbbf24, 18);
      this.checkBountyDoors();
      this.checkTrophyDoors();
      if (this.bots.length > 0 && this.kills >= this.bots.length) {
        this.slowMoTimer = SLOW_MO_DURATION;
        this.hudSyncTimer = 0;
        this.emitHud();
      }
    } else {
      const ratio = bot.hp / bot.maxHp;
      const halfBarWidth =
        bot.style === 'striker' ? 0.36 : bot.style === 'sentinel' ? 0.39 : 0.45;
      bot.rig.hpBarFill.scale.x = Math.max(0.01, ratio);
      bot.rig.hpBarFill.position.x = -(1 - ratio) * halfBarWidth;
      const barMat = bot.rig.hpBarFill.material as THREE.MeshBasicMaterial;
      barMat.color.setHex(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf59e0b : 0xef4444);
    }
  }

  private damagePlayer(amount: number) {
    if (this.finished || this.dying) return;
    this.health = Math.max(0, this.health - amount);
    this.damageFlash = 1;
    this.cameraShake = Math.max(this.cameraShake, 0.032);

    if (this.health <= 0) {
      this.dying = true;
      this.deathFadeTimer = DEATH_FADE_DURATION;
      this.slowMoTimer = 0;
      this.timeScale = 0.35;
      this.input.firing = false;
      this.input.moveForward = 0;
      this.input.moveStrafe = 0;
      this.input.turnDelta = 0;
      soundFX.playPlayerDefeat();
      this.hudSyncTimer = 0;
      this.emitHud();
    } else {
      soundFX.playPlayerHurt();
    }
  }

  private pickRandomNeighborCell(
    gx: number,
    gz: number,
    prevAngle: number,
    avoidSouthStart: boolean,
  ): { wx: number; wz: number; angle: number } | null {
    const dirs = [
      { dx: 1, dz: 0, angle: Math.PI * 0.5 },
      { dx: -1, dz: 0, angle: -Math.PI * 0.5 },
      { dx: 0, dz: 1, angle: 0 },
      { dx: 0, dz: -1, angle: Math.PI },
    ];
    const valid: Array<{ nx: number; nz: number; angle: number; isReverse: boolean }> = [];
    for (const d of dirs) {
      const nx = gx + d.dx;
      const nz = gz + d.dz;
      if (this.isCellBlocked(nx, nz)) continue;
      if (avoidSouthStart && Math.hypot(nx - this.spawnGridX, nz - this.spawnGridZ) < 2.6) continue;
      const diff = Math.abs(Math.atan2(Math.sin(d.angle - prevAngle), Math.cos(d.angle - prevAngle)));
      valid.push({ nx, nz, angle: d.angle, isReverse: diff > 2.4 });
    }
    if (valid.length === 0 && avoidSouthStart) {
      return this.pickRandomNeighborCell(gx, gz, prevAngle, false);
    }
    if (valid.length === 0) return null;
    const nonReverse = valid.filter((v) => !v.isReverse);
    const pool = nonReverse.length > 0 ? nonReverse : valid;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
      wx: (pick.nx + 0.5) * TILE_SIZE,
      wz: (pick.nz + 0.5) * TILE_SIZE,
      angle: pick.angle,
    };
  }

  private findNextPathStep(
    startGx: number,
    startGz: number,
    goalGx: number,
    goalGz: number,
  ): { wx: number; wz: number } | null {
    if (startGx === goalGx && startGz === goalGz) return null;
    const totalCells = this.gridCols * this.gridRows;
    const visited = new Uint8Array(totalCells);
    const parent = new Int16Array(totalCells).fill(-1);
    const queue: number[] = [];

    const startIdx = startGz * this.gridCols + startGx;
    const goalIdx = goalGz * this.gridCols + goalGx;
    visited[startIdx] = 1;
    queue.push(startIdx);

    const dirs = [1, -1, this.gridCols, -this.gridCols];
    let head = 0;
    let found = false;
    let iterations = 0;

    while (head < queue.length && iterations < 160) {
      iterations++;
      const cur = queue[head++];
      if (cur === goalIdx) {
        found = true;
        break;
      }
      const cx = cur % this.gridCols;
      const cz = Math.floor(cur / this.gridCols);

      for (let i = 0; i < 4; i++) {
        const nx = i === 0 ? cx + 1 : i === 1 ? cx - 1 : cx;
        const nz = i === 2 ? cz + 1 : i === 3 ? cz - 1 : cz;
        if (nx < 0 || nz < 0 || nx >= this.gridCols || nz >= this.gridRows) continue;
        const nIdx = cur + dirs[i];
        if (visited[nIdx]) continue;
        if (this.isCellBlocked(nx, nz)) continue;
        visited[nIdx] = 1;
        parent[nIdx] = cur;
        queue.push(nIdx);
      }
    }

    if (!found) return null;
    let step = goalIdx;
    while (parent[step] !== -1 && parent[step] !== startIdx) {
      step = parent[step];
    }
    const sx = step % this.gridCols;
    const sz = Math.floor(step / this.gridCols);
    return { wx: (sx + 0.5) * TILE_SIZE, wz: (sz + 0.5) * TILE_SIZE };
  }

  private updateBots(dt: number, elapsed: number) {
    const playerGx = THREE.MathUtils.clamp(
      Math.floor(this.playerX / TILE_SIZE),
      1,
      Math.max(1, this.gridCols - 2),
    );
    const playerGz = THREE.MathUtils.clamp(
      Math.floor(this.playerZ / TILE_SIZE),
      1,
      Math.max(1, this.gridRows - 2),
    );

    for (const bot of this.bots) {
      if (!bot.alive) continue;

      if (bot.hitFlash > 0) {
        bot.hitFlash = Math.max(0, bot.hitFlash - dt);
        const emissiveIntensity = bot.hitFlash > 0 ? 0.85 : 0;
        for (const m of bot.rig.armorMeshes) {
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = emissiveIntensity;
        }
      }

      bot.rig.hpBarBg.lookAt(this.camera.position);
      bot.rig.hpBarFill.lookAt(this.camera.position);
      bot.rig.hoverRing.rotation.z += dt * 2.2;

      const dx = this.playerX - bot.x;
      const dz = this.playerZ - bot.z;
      const dist = Math.hypot(dx, dz);
      const canSee = dist < 24 && this.hasLineOfSight(bot.x, bot.z, this.playerX, this.playerZ);

      if (canSee) {
        bot.alerted = true;
      }

      if (Math.abs(bot.knockbackX) > 0.01 || Math.abs(bot.knockbackZ) > 0.01) {
        const kbRes = this.resolveCircleGridCollision(
          bot.x + bot.knockbackX * dt,
          bot.z + bot.knockbackZ * dt,
          0.56,
        );
        bot.x = kbRes.x;
        bot.z = kbRes.z;
        bot.knockbackX = THREE.MathUtils.damp(bot.knockbackX, 0, 10, dt);
        bot.knockbackZ = THREE.MathUtils.damp(bot.knockbackZ, 0, 10, dt);
      }

      // Gentle bot-to-bot separation so bots flank instead of stacking
      let sepX = 0;
      let sepZ = 0;
      for (const other of this.bots) {
        if (other === bot || !other.alive) continue;
        const ox = bot.x - other.x;
        const oz = bot.z - other.z;
        const oDist = Math.hypot(ox, oz);
        if (oDist > 0.001 && oDist < 1.45) {
          const push = (1.45 - oDist) * 1.8;
          sepX += (ox / oDist) * push;
          sepZ += (oz / oDist) * push;
        }
      }

      const botGx = THREE.MathUtils.clamp(
        Math.floor(bot.x / TILE_SIZE),
        1,
        Math.max(1, this.gridCols - 2),
      );
      const botGz = THREE.MathUtils.clamp(
        Math.floor(bot.z / TILE_SIZE),
        1,
        Math.max(1, this.gridRows - 2),
      );

      let moveVx = 0;
      let moveVz = 0;
      let desiredYaw = bot.yaw;

      if (bot.alerted && canSee) {
        // Smart unpredictable combat strafing & tactical spacing
        desiredYaw = Math.atan2(dx, dz);
        bot.aiDecisionTimer -= dt;
        if (bot.aiDecisionTimer <= 0) {
          bot.aiDecisionTimer = 0.65 + Math.random() * 0.85;
          if (Math.random() < 0.6) {
            bot.strafeSign *= -1;
          }
        }

        const dirX = dist > 0.01 ? dx / dist : 0;
        const dirZ = dist > 0.01 ? dz / dist : 1;
        const perpX = -dirZ * bot.strafeSign;
        const perpZ = dirX * bot.strafeSign;

        let forwardFactor = 0.15;
        if (dist < 4.8) forwardFactor = -0.55;
        else if (dist > 10.5) forwardFactor = 0.82;
        else if (bot.doorPhase !== 'cooldown') forwardFactor = 0.0;

        const strafeWeight =
          bot.style === 'striker'
            ? bot.doorPhase === 'cooldown'
              ? 1.15
              : 0.8
            : bot.doorPhase === 'cooldown'
              ? 0.92
              : 0.62;
        const rawX = dirX * forwardFactor + perpX * strafeWeight;
        const rawZ = dirZ * forwardFactor + perpZ * strafeWeight;
        const rawLen = Math.hypot(rawX, rawZ) || 1;
        const speedScale = bot.doorPhase === 'cooldown' ? 1.0 : bot.style === 'striker' ? 0.72 : 0.56;
        moveVx = (rawX / rawLen) * bot.speed * speedScale;
        moveVz = (rawZ / rawLen) * bot.speed * speedScale;
      } else if (bot.alerted && !canSee) {
        // Smart wall-avoiding pathfinding toward player, or random roaming if behind locked door
        bot.repathTimer -= dt;
        if (
          bot.repathTimer <= 0 ||
          !bot.hasTargetWaypoint ||
          Math.hypot(bot.targetWx - bot.x, bot.targetWz - bot.z) < 0.38
        ) {
          bot.repathTimer = 0.38 + Math.random() * 0.18;
          const step = this.findNextPathStep(botGx, botGz, playerGx, playerGz);
          if (step) {
            bot.targetWx = step.wx;
            bot.targetWz = step.wz;
            bot.hasTargetWaypoint = true;
          } else {
            const rnd = this.pickRandomNeighborCell(botGx, botGz, bot.patrolAngle, false);
            if (rnd) {
              bot.targetWx = rnd.wx;
              bot.targetWz = rnd.wz;
              bot.patrolAngle = rnd.angle;
              bot.hasTargetWaypoint = true;
            }
          }
        }

        if (bot.hasTargetWaypoint) {
          const tx = bot.targetWx - bot.x;
          const tz = bot.targetWz - bot.z;
          const tDist = Math.hypot(tx, tz);
          if (tDist > 0.05) {
            moveVx = (tx / tDist) * bot.speed * 0.88;
            moveVz = (tz / tDist) * bot.speed * 0.88;
            desiredYaw = Math.atan2(tx, tz);
          }
        }
      } else {
        // Unalerted: smart corridor-aware random exploration outside Sector 0
        bot.patrolTimer -= dt;
        if (
          !bot.hasTargetWaypoint ||
          bot.patrolTimer <= 0 ||
          Math.hypot(bot.targetWx - bot.x, bot.targetWz - bot.z) < 0.34
        ) {
          bot.patrolTimer = 1.4 + Math.random() * 1.4;
          const rnd = this.pickRandomNeighborCell(botGx, botGz, bot.patrolAngle, true);
          if (rnd) {
            bot.targetWx = rnd.wx;
            bot.targetWz = rnd.wz;
            bot.patrolAngle = rnd.angle;
            bot.hasTargetWaypoint = true;
          }
        }

        if (bot.hasTargetWaypoint) {
          const tx = bot.targetWx - bot.x;
          const tz = bot.targetWz - bot.z;
          const tDist = Math.hypot(tx, tz);
          if (tDist > 0.05) {
            moveVx = (tx / tDist) * bot.speed * 0.65;
            moveVz = (tz / tDist) * bot.speed * 0.65;
            desiredYaw = Math.atan2(tx, tz);
          }
        }
      }

      // Smoothly rotate yaw toward desired facing
      let yawDiff = desiredYaw - bot.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      bot.yaw += yawDiff * Math.min(1, dt * (bot.alerted ? 7.5 : 4.5));

      // Apply movement + wall collision + stuck/obstacle bounce recovery
      const totalVx = moveVx + sepX;
      const totalVz = moveVz + sepZ;
      if (Math.abs(totalVx) > 0.01 || Math.abs(totalVz) > 0.01) {
        const res = this.resolveCircleGridCollision(
          bot.x + totalVx * dt,
          bot.z + totalVz * dt,
          0.56,
        );
        const moved = Math.hypot(res.x - bot.x, res.z - bot.z);
        const expected = Math.hypot(totalVx, totalVz) * dt;
        bot.x = res.x;
        bot.z = res.z;

        if (expected > 0.008 && moved < expected * 0.28) {
          bot.strafeSign *= -1;
          bot.aiDecisionTimer = Math.min(bot.aiDecisionTimer, 0.25);
          if (!canSee) {
            bot.hasTargetWaypoint = false;
            bot.repathTimer = 0;
          }
        }
      }

      // Periodic stuck recovery check
      bot.stuckTimer += dt;
      if (bot.stuckTimer >= 0.5) {
        bot.stuckTimer = 0;
        const progressDist = Math.hypot(bot.x - bot.lastCheckX, bot.z - bot.lastCheckZ);
        bot.lastCheckX = bot.x;
        bot.lastCheckZ = bot.z;
        if (progressDist < 0.1 && (Math.abs(moveVx) > 0.1 || Math.abs(moveVz) > 0.1)) {
          bot.strafeSign *= -1;
          bot.hasTargetWaypoint = false;
          bot.repathTimer = 0;
        }
      }

      // BOT CENTER SHUTTER DOOR + 5-BULLET CONTINUOUS BURST + 2s REGENERATION STATE MACHINE
      const visorMat = bot.rig.visor.material as THREE.MeshStandardMaterial;

      if (bot.doorPhase === 'cooldown') {
        bot.doorOpen = THREE.MathUtils.clamp(bot.doorOpen - dt * 4.0, 0, 1);
        bot.regenTimer = Math.max(0, bot.regenTimer - dt);
        visorMat.color.setHex(0x38bdf8);
        visorMat.emissive.setHex(0x0ea5e9);

        if (bot.regenTimer <= 0 && canSee) {
          bot.doorPhase = 'opening';
          bot.bulletsLeftInBurst = bot.burstCount;
          bot.burstShotTimer = 0;
          soundFX.playBotDoorOpen();
        }
      } else if (bot.doorPhase === 'opening') {
        bot.doorOpen = Math.min(1, bot.doorOpen + dt * 3.8);
        visorMat.color.setHex(0xf43f5e);
        visorMat.emissive.setHex(0xf43f5e);
        if (bot.doorOpen >= 0.98) {
          bot.doorOpen = 1;
          bot.doorPhase = 'firing';
          bot.burstShotTimer = 0;
        }
      } else if (bot.doorPhase === 'firing') {
        visorMat.color.setHex(0xf43f5e);
        visorMat.emissive.setHex(0xf43f5e);
        bot.burstShotTimer -= dt;

        if (bot.burstShotTimer <= 0 && bot.bulletsLeftInBurst > 0) {
          bot.bulletsLeftInBurst--;
          bot.burstShotTimer = bot.burstInterval;

          // Release bullet directly from center chest cannon
          _vec3A.set(
            bot.x + Math.sin(bot.yaw) * 0.42,
            1.04,
            bot.z + Math.cos(bot.yaw) * 0.42,
          );
          _vec3B
            .set(this.playerX - _vec3A.x, EYE_HEIGHT - 1.15, this.playerZ - _vec3A.z)
            .normalize();
          const dmg =
            bot.style === 'dreadnought'
              ? 11
              : bot.style === 'enforcer'
                ? 9
                : bot.style === 'striker'
                  ? 5 + Math.min(3, Math.floor(this.level.id / 10))
                  : 5 + Math.min(4, Math.floor(this.level.id / 7));
          this.spawnBolt(_vec3A, _vec3B, false, dmg);
          soundFX.playEnemyFire();

          // Immediately close door after the last bullet in burst is released
          if (bot.bulletsLeftInBurst <= 0) {
            bot.doorPhase = 'closing';
          }
        }
      } else if (bot.doorPhase === 'closing') {
        bot.doorOpen = Math.max(0, bot.doorOpen - dt * 4.2);
        visorMat.color.setHex(0xf59e0b);
        visorMat.emissive.setHex(0xf59e0b);
        if (bot.doorOpen <= 0.02) {
          bot.doorOpen = 0;
          bot.doorPhase = 'cooldown';
          bot.regenTimer = bot.regenSeconds;
        }
      }

      // Animate Center Chest Shutter Door slides & cannon glow
      const slide = bot.doorOpen * 0.25;
      bot.rig.leftShutter.position.x = -0.165 - slide;
      bot.rig.rightShutter.position.x = 0.165 + slide;
      const coreMat = bot.rig.cannonCore.material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = bot.doorPhase === 'firing' ? 2.6 : 0.8 + bot.doorOpen * 1.2;

      bot.rig.bodyGroup.position.y = Math.sin(elapsed * 3.4 + bot.patrolAngle) * 0.035;
      bot.rig.bodyGroup.rotation.x = -bot.hitFlash * 0.9;
      bot.rig.group.position.set(bot.x, 0, bot.z);
      bot.rig.group.rotation.y = bot.yaw;
    }
  }

  private updateDoorsAndProps(dt: number, elapsed: number) {
    for (const door of this.doors) {
      if (door.state.unlocked && door.state.openProgress < 1) {
        door.state.openProgress = Math.min(1, door.state.openProgress + dt * 1.7);
      }
      const slideOffset = door.state.openProgress * (TILE_SIZE * 0.48);
      const leafWidth = (TILE_SIZE - 0.44) / 2;
      door.rig.leftLeaf.position.x = -leafWidth / 2 - slideOffset;
      door.rig.rightLeaf.position.x = leafWidth / 2 + slideOffset;
      door.rig.lockBadge.rotation.y += dt * 2.2;
      if (door.state.unlocked) {
        const mat = door.rig.lockBadge.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0x22c55e);
        mat.emissive.setHex(0x22c55e);
      } else if (door.state.kind === 'trophy' && this.noticeCooldown <= 0) {
        const dDist = Math.hypot(this.playerX - door.x, this.playerZ - door.z);
        if (dDist < 2.25) {
          this.noticeCooldown = 1.8;
          soundFX.playJewelleryBlocked();
          const remCoins = Math.max(0, this.totalCoins - this.coinsCollected);
          const remBots = Math.max(0, this.bots.length - this.kills);
          const parts: string[] = [];
          if (remCoins > 0) parts.push(`${remCoins} Coin${remCoins > 1 ? 's' : ''}`);
          if (remBots > 0) parts.push(`${remBots} Bot${remBots > 1 ? 's' : ''}`);
          this.showBanner(
            `Trophy Door Locked — Need ${parts.join(' & ')}`,
            'warning',
            2.2,
          );
        }
      }
    }

    for (const sw of this.switches) {
      if (sw.state.activated) continue;
      sw.rig.orb.rotation.y += dt * 1.8;
      sw.rig.orb.position.y = 1.56 + Math.sin(elapsed * 3) * 0.08;
      sw.rig.ring.rotation.x = Math.sin(elapsed * 1.5) * 0.45;
      sw.rig.ring.rotation.y -= dt * 2.1;

      const dist = Math.hypot(this.playerX - sw.x, this.playerZ - sw.z);
      if (dist < 1.65) {
        this.activateSwitch(sw);
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      if (pk.collected) continue;
      const phase = pk.x * 0.7 + pk.z * 0.5;
      const spin = pk.spinGroup;
      if (spin) {
        if (pk.kind === 'coin' || pk.kind === 'gun') {
          spin.rotation.y += dt * (pk.kind === 'gun' ? 2.4 : 3.8);
          spin.rotation.z = Math.sin(elapsed * 2.6 + phase) * 0.14;
          spin.position.y = 0.92 + Math.sin(elapsed * 3.6 + phase) * 0.16;
        } else {
          spin.rotation.y += dt * 2.4;
          spin.position.y = 0.68 + Math.sin(elapsed * 3.2 + phase) * 0.1;
        }
      }
      const halo = pk.haloMesh;
      if (halo) {
        const baseY = pk.kind === 'coin' || pk.kind === 'gun' ? 0.92 : 0.68;
        const bobAmp = pk.kind === 'coin' || pk.kind === 'gun' ? 0.16 : 0.1;
        const bobSpeed = pk.kind === 'coin' || pk.kind === 'gun' ? 3.6 : 3.2;
        halo.rotation.z -= dt * 2.8;
        halo.rotation.y += dt * 1.4;
        halo.position.y = baseY + Math.sin(elapsed * bobSpeed + phase) * bobAmp;
        const pulse = 1 + Math.sin(elapsed * 5 + phase) * 0.1;
        halo.scale.setScalar(pulse);
      }

      const dist = Math.hypot(this.playerX - pk.x, this.playerZ - pk.z);
      if (dist < 1.55) {
        if (pk.kind === 'medkit') {
          if (this.health >= this.maxHealth) continue;
          const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(
            pk.x,
            0.68,
            pk.z,
          );
          const healed = Math.min(35, this.maxHealth - this.health);
          pk.collected = true;
          pk.mesh.visible = false;
          this.levelGroup.remove(pk.mesh);
          this.pickups.splice(i, 1);
          soundFX.playHealthPickup();
          this.health = Math.min(this.maxHealth, this.health + 35);
          this.healFlash = 1;
          this.spawnParticles(pk.x, 0.72, pk.z, 0xef4444, 14);
          this.callbacks.onCoinCollected?.({
            id: ++this.coinEventSeq,
            kind: 'medkit',
            startXPercent,
            startYPercent,
            points: healed,
          });
          this.hudSyncTimer = 0;
          this.emitHud();
        } else if (pk.kind === 'gun') {
          const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(
            pk.x,
            0.92,
            pk.z,
          );
          pk.collected = true;
          pk.mesh.visible = false;
          this.levelGroup.remove(pk.mesh);
          this.pickups.splice(i, 1);
          this.activeWeapon = 'heavy';
          this.specialGunBullets = MAX_SPECIAL_GUN_BULLETS;
          this.reloading = false;
          this.weaponSwitchAnim = 1;
          soundFX.playWeaponEquip();
          this.spawnParticles(pk.x, 0.92, pk.z, 0xf59e0b, 14);
          this.callbacks.onCoinCollected?.({
            id: ++this.coinEventSeq,
            kind: 'gun',
            startXPercent,
            startYPercent,
            points: 0,
          });
          this.hudSyncTimer = 0;
          this.emitHud();
        } else if (pk.kind === 'pack') {
          if (this.gunBullets === 0 && this.bulletPacks === 0) {
            const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(
              pk.x,
              0.72,
              pk.z,
            );
            pk.collected = true;
            pk.mesh.visible = false;
            this.levelGroup.remove(pk.mesh);
            this.pickups.splice(i, 1);
            this.gunBullets = MAX_GUN_BULLETS;
            this.packsCollectedThisLevel++;
            soundFX.playReload();
            this.spawnParticles(pk.x, 0.72, pk.z, 0x38bdf8, 8);
            this.callbacks.onCoinCollected?.({
              id: ++this.coinEventSeq,
              kind: 'pack',
              startXPercent,
              startYPercent,
              points: 0,
            });
            this.hudSyncTimer = 0;
            this.emitHud();
          } else if (this.bulletPacks < MAX_BULLET_PACKS) {
            const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(
              pk.x,
              0.72,
              pk.z,
            );
            pk.collected = true;
            pk.mesh.visible = false;
            this.levelGroup.remove(pk.mesh);
            this.pickups.splice(i, 1);
            this.bulletPacks++;
            this.packsCollectedThisLevel++;
            soundFX.playPickup();
            this.spawnParticles(pk.x, 0.72, pk.z, 0x38bdf8, 8);
            this.callbacks.onCoinCollected?.({
              id: ++this.coinEventSeq,
              kind: 'pack',
              startXPercent,
              startYPercent,
              points: 0,
            });
            this.hudSyncTimer = 0;
            this.emitHud();
          }
        } else {
          const { startXPercent, startYPercent } = this.projectWorldToScreenPercent(
            pk.x,
            0.92,
            pk.z,
          );

          pk.collected = true;
          pk.mesh.visible = false;
          this.levelGroup.remove(pk.mesh);
          this.pickups.splice(i, 1);
          this.coinsCollected++;
          this.score += 100;
          soundFX.playCoin();
          this.spawnParticles(pk.x, 0.95, pk.z, 0xfacc15, 10);
          this.callbacks.onCoinCollected?.({
            id: ++this.coinEventSeq,
            kind: 'coin',
            startXPercent,
            startYPercent,
            points: 100,
          });
          this.hudSyncTimer = 0;
          this.emitHud();
          this.checkTrophyDoors();
        }
      }
    }

    // Final Jewellery Relic
    if (this.treasureRig && !this.treasurePos.collected) {
      this.treasureRig.relicGroup.rotation.y += dt * 1.4;
      this.treasureRig.relicGroup.position.y = 1.65 + Math.sin(elapsed * 2.6) * 0.14;
      this.treasureRig.outerRing.rotation.x += dt * 1.1;
      this.treasureRig.innerRing.rotation.y += dt * 1.8;

      const dist = Math.hypot(
        this.playerX - this.treasurePos.x,
        this.playerZ - this.treasurePos.z,
      );
      if (dist < 1.75) {
        if (this.coinsCollected < this.totalCoins || this.kills < this.bots.length) {
          if (this.noticeCooldown <= 0) {
            this.noticeCooldown = 1.8;
            soundFX.playJewelleryBlocked();
            const remCoins = Math.max(0, this.totalCoins - this.coinsCollected);
            const remBots = Math.max(0, this.bots.length - this.kills);
            const parts: string[] = [];
            if (remCoins > 0) parts.push(`${remCoins} Coin${remCoins > 1 ? 's' : ''}`);
            if (remBots > 0) parts.push(`${remBots} Bot${remBots > 1 ? 's' : ''}`);
            this.showBanner(
              `Collect/Defeat ${parts.join(' & ')} to claim the ${this.level.theme.jewelleryName}!`,
              'warning',
              2.4,
            );
          }
        } else {
          this.treasurePos.collected = true;
          this.treasureRig.relicGroup.visible = false;
          this.treasureRig.beam.visible = false;
          this.finished = true;
          this.needsPausedRender = true;
          this.score +=
            500 + Math.max(0, Math.round((this.level.parTimeSeconds - this.elapsedSeconds) * 5));
          soundFX.playTreasureVictory(this.level.id >= LEVELS.length);
          this.spawnParticles(this.treasurePos.x, 1.5, this.treasurePos.z, 0xfacc15, 24);
          this.showBanner(`Claimed ${this.level.theme.jewelleryName}!`, 'treasure', 3.0);
          this.emitHud();
          const accuracy =
            this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100;
          this.callbacks.onLevelComplete({
            levelId: this.level.id,
            score: this.score,
            elapsedSeconds: this.elapsedSeconds,
            kills: this.kills,
            totalBots: this.bots.length,
            coinsCollected: this.coinsCollected,
            totalCoins: this.totalCoins,
            accuracy,
          });
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vel.y -= 9.5 * dt;
      pt.pos.addScaledVector(pt.vel, dt);
      pt.pos.y = Math.max(0.06, pt.pos.y);
      pt.mesh.position.copy(pt.pos);
      const scale = Math.max(0.01, pt.life / pt.maxLife);
      pt.mesh.scale.setScalar(scale);

      if (pt.life <= 0) {
        this.dynamicGroup.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private syncCamera(dt: number) {
    const isMoving =
      !this.dying &&
      (Math.abs(this.input.moveForward) > 0.08 || Math.abs(this.input.moveStrafe) > 0.08);
    if (isMoving && dt > 0) {
      this.bobPhase += dt * 10.5;
    } else if (dt > 0) {
      this.bobPhase = THREE.MathUtils.damp(this.bobPhase, 0, 6, dt);
    }

    const bobY = isMoving ? Math.sin(this.bobPhase) * 0.045 : 0;
    const bobX = isMoving ? Math.cos(this.bobPhase * 0.5) * 0.025 : 0;
    const shakeX = !this.dying && this.cameraShake > 0.0005 ? (Math.random() - 0.5) * this.cameraShake : 0;
    const shakeY = !this.dying && this.cameraShake > 0.0005 ? (Math.random() - 0.5) * this.cameraShake : 0;

    const deathProgress = this.dying
      ? THREE.MathUtils.clamp(1 - this.deathFadeTimer / DEATH_FADE_DURATION, 0, 1)
      : this.finished && this.health <= 0
        ? 1
        : 0;

    this.camera.position.set(
      this.playerX + shakeX,
      EYE_HEIGHT + bobY - deathProgress * 0.72 + shakeY,
      this.playerZ,
    );
    this.camera.rotation.y = this.playerYaw;
    this.camera.rotation.x = this.playerPitch - deathProgress * 0.18;
    this.camera.rotation.z = deathProgress * 0.14;

    const isHeavy = this.activeWeapon === 'heavy' && this.specialGunBullets > 0;
    this.weaponRig.group.visible = !isHeavy;
    this.heavyWeaponRig.group.visible = isHeavy;
    const activeRig = isHeavy ? this.heavyWeaponRig : this.weaponRig;
    const inactiveRig = isHeavy ? this.weaponRig : this.heavyWeaponRig;

    const inactiveFlashMat = inactiveRig.muzzleFlash.material as THREE.MeshBasicMaterial;
    inactiveFlashMat.opacity = 0;
    inactiveRig.flashLight.intensity = 0;

    // Prevent gun barrel from penetrating into walls, crates, or closed doors
    const targetTuck = this.dying ? 0 : this.computeWeaponWallTuck(isHeavy);
    if (dt > 0) {
      if (targetTuck > this.wallTuck) {
        this.wallTuck = Math.max(
          targetTuck * 0.9,
          THREE.MathUtils.damp(this.wallTuck, targetTuck, 34, dt),
        );
      } else {
        this.wallTuck = THREE.MathUtils.damp(this.wallTuck, targetTuck, 14, dt);
      }
      this.weaponSwayX = THREE.MathUtils.damp(this.weaponSwayX, 0, 12, dt);
      this.weaponSwayY = THREE.MathUtils.damp(this.weaponSwayY, 0, 12, dt);
    } else {
      this.wallTuck = targetTuck;
    }

    const tuck = this.wallTuck;
    const reloadDip = this.reloading && !isHeavy ? -0.11 : 0;
    const switchDip = this.weaponSwitchAnim * -0.13;
    const recoilZ = this.weaponRecoil * 0.085;
    const recoilRot =
      this.weaponRecoil * 0.22 - (this.reloading && !isHeavy ? 0.3 : 0) - this.weaponSwitchAnim * 0.28;
    // Slight inward toe-in aligns the 3D barrel straight toward the center crosshair target,
    // while dynamic wall-tuck pulls & cants the weapon smoothly when close to any wall or door.
    activeRig.group.position.set(
      0.21 + bobX * 0.45 + this.weaponSwayX - 0.09 * tuck,
      -0.22 + bobY * 0.45 + reloadDip + switchDip + this.weaponSwayY + 0.04 * tuck,
      -0.44 + recoilZ * (1 - 0.55 * tuck) + 0.28 * tuck,
    );
    activeRig.group.rotation.set(
      0.016 + recoilRot * (1 - 0.5 * tuck) + 0.65 * tuck,
      0.018 + 0.92 * tuck + this.weaponSwayX * 0.55,
      -0.18 * tuck,
    );

    const flashMat = activeRig.muzzleFlash.material as THREE.MeshBasicMaterial;
    if (this.muzzleTimer > 0) {
      flashMat.opacity = 0.92 * (1 - 0.35 * tuck);
      activeRig.muzzleFlash.rotation.z += 0.5;
      activeRig.muzzleFlash.scale.setScalar(1 - 0.45 * tuck);
      activeRig.flashLight.intensity = isHeavy ? 4.5 : 3.5;
    } else {
      flashMat.opacity = 0;
      activeRig.flashLight.intensity = 0;
    }
  }

  private getTargetHighlight(): 'none' | 'enemy' | 'switch' | 'treasure' {
    const camForward = _vec3A.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      const toB = _vec3B
        .set(bot.x - this.playerX, 1.12 - EYE_HEIGHT, bot.z - this.playerZ)
        .normalize();
      if (
        camForward.dot(toB) > 0.974 &&
        this.hasLineOfSight(this.playerX, this.playerZ, bot.x, bot.z)
      ) {
        return 'enemy';
      }
    }
    for (const sw of this.switches) {
      if (sw.state.activated) continue;
      const toS = _vec3B
        .set(sw.x - this.playerX, 1.56 - EYE_HEIGHT, sw.z - this.playerZ)
        .normalize();
      if (
        camForward.dot(toS) > 0.974 &&
        this.hasLineOfSight(this.playerX, this.playerZ, sw.x, sw.z)
      ) {
        return 'switch';
      }
    }
    if (!this.treasurePos.collected) {
      const toT = _vec3B
        .set(
          this.treasurePos.x - this.playerX,
          1.6 - EYE_HEIGHT,
          this.treasurePos.z - this.playerZ,
        )
        .normalize();
      if (
        camForward.dot(toT) > 0.978 &&
        this.hasLineOfSight(this.playerX, this.playerZ, this.treasurePos.x, this.treasurePos.z)
      ) {
        return 'treasure';
      }
    }
    return 'none';
  }

  private computeTrophyNavigation(): {
    trophyDistance: number;
    trophyBearingDeg: number;
    trophyPath: Array<{ x: number; z: number }>;
  } {
    const dxTotal = this.treasurePos.x - this.playerX;
    const dzTotal = this.treasurePos.z - this.playerZ;
    const trophyDistance = Math.max(0, Math.round(Math.hypot(dxTotal, dzTotal)));

    const startGx = THREE.MathUtils.clamp(
      Math.floor(this.playerX / TILE_SIZE),
      1,
      Math.max(1, this.gridCols - 2),
    );
    const startGz = THREE.MathUtils.clamp(
      Math.floor(this.playerZ / TILE_SIZE),
      1,
      Math.max(1, this.gridRows - 2),
    );
    const goalGx = this.treasurePos.gridX;
    const goalGz = this.treasurePos.gridZ;

    const totalCells = this.gridCols * this.gridRows;
    const nextToGoal = new Int32Array(totalCells).fill(-1);
    const visited = new Uint8Array(totalCells);
    const goalIdx = goalGz * this.gridCols + goalGx;
    const startIdx = startGz * this.gridCols + startGx;
    const queue: number[] = [goalIdx];
    visited[goalIdx] = 1;

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (let head = 0; head < queue.length; head++) {
      const curIdx = queue[head];
      if (curIdx === startIdx) break;
      const cx = curIdx % this.gridCols;
      const cz = Math.floor(curIdx / this.gridCols);

      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= this.gridCols || nz >= this.gridRows) continue;
        const nIdx = nz * this.gridCols + nx;
        if (visited[nIdx]) continue;
        const ch = this.level.grid[nz]?.[nx] || '#';
        if (ch === '#' || ch === 'C') continue;
        const door = this.doorGrid[nIdx];
        if (door && !door.state.unlocked) continue;
        visited[nIdx] = 1;
        nextToGoal[nIdx] = curIdx;
        queue.push(nIdx);
      }
    }

    const trophyPath: Array<{ x: number; z: number }> = [];
    if (visited[startIdx]) {
      let cur = startIdx;
      let guard = 0;
      while (cur !== -1 && guard < 120) {
        const gx = cur % this.gridCols;
        const gz = Math.floor(cur / this.gridCols);
        trophyPath.push({ x: gx + 0.5, z: gz + 0.5 });
        if (cur === goalIdx) break;
        cur = nextToGoal[cur];
        guard++;
      }
    }

    let targetX = this.treasurePos.x;
    let targetZ = this.treasurePos.z;
    const directLOS = this.hasLineOfSight(
      this.playerX,
      this.playerZ,
      this.treasurePos.x,
      this.treasurePos.z,
    );
    if (!directLOS && trophyPath.length >= 2) {
      const lookAhead = trophyPath[Math.min(2, trophyPath.length - 1)];
      targetX = lookAhead.x * TILE_SIZE;
      targetZ = lookAhead.z * TILE_SIZE;
    }

    const tx = targetX - this.playerX;
    const tz = targetZ - this.playerZ;
    const fwdX = -Math.sin(this.playerYaw);
    const fwdZ = -Math.cos(this.playerYaw);
    const rightX = Math.cos(this.playerYaw);
    const rightZ = -Math.sin(this.playerYaw);
    const fwdDot = tx * fwdX + tz * fwdZ;
    const rightDot = tx * rightX + tz * rightZ;
    const trophyBearingDeg = Math.round((Math.atan2(rightDot, fwdDot) * 180) / Math.PI);

    return { trophyDistance, trophyBearingDeg, trophyPath };
  }

  private emitHud() {
    const switchesTotal = Array.from(new Set(this.switches.map((s) => s.state.color)));
    const switchesActivated = Array.from(
      new Set(this.switches.filter((s) => s.state.activated).map((s) => s.state.color)),
    );
    const bountyUnlocked =
      this.level.bountyKillsRequired === 0 || this.kills >= this.level.bountyKillsRequired;
    const trophyDoorUnlocked =
      this.coinsCollected >= this.totalCoins && this.kills >= this.bots.length;
    const trophyNav =
      trophyDoorUnlocked && !this.treasurePos.collected
        ? this.computeTrophyNavigation()
        : { trophyDistance: 0, trophyBearingDeg: 0, trophyPath: undefined };

    let tutorialHint: string | null = null;
    let tutorialAccent: 'coin' | 'ammo' | 'combat' | null = null;
    if (!trophyDoorUnlocked && !this.finished) {
      if (this.level.tutorialMode === 'coins') {
        const remCoins = Math.max(0, this.totalCoins - this.coinsCollected);
        const switchOpen = switchesTotal.length === 0 || switchesActivated.length >= switchesTotal.length;
        if (!switchOpen && this.coinsCollected === 0) {
          tutorialHint = 'Coin Tutorial: Move & walk over Gold Coins to collect them!';
          tutorialAccent = 'coin';
        } else if (!switchOpen) {
          tutorialHint = 'Nice! Shoot the glowing Amber Switch to unlock the next room for more coins.';
          tutorialAccent = 'coin';
        } else {
          tutorialHint = `Gate Open! Collect the remaining ${remCoins} Gold Coin${remCoins === 1 ? '' : 's'} to unlock the Trophy Door.`;
          tutorialAccent = 'coin';
        }
      } else if (this.level.tutorialMode === 'combat_ammo') {
        const remCoins = Math.max(0, this.totalCoins - this.coinsCollected);
        if (this.kills < this.bots.length) {
          if (this.gunBullets <= 2 && this.bulletPacks === 0) {
            tutorialHint = 'Out of Ammo! Walk over a glowing Blue Bullet Pack to reload +10 bullets!';
            tutorialAccent = 'ammo';
          } else if (this.packsCollectedThisLevel === 0) {
            tutorialHint = 'Enemy Ahead! Collect glowing Blue Bullet Packs first — each pack reloads +10 bullets.';
            tutorialAccent = 'ammo';
          } else {
            tutorialHint = 'Ammo Loaded! Shoot the Amber Switch, aim at the Sentinel Bot & hold Shoot to defeat it.';
            tutorialAccent = 'combat';
          }
        } else {
          tutorialHint = `Sentinel Defeated! Collect the remaining ${remCoins} Gold Coin${remCoins === 1 ? '' : 's'} to unlock the Trophy.`;
          tutorialAccent = 'coin';
        }
      }
    }

    this.callbacks.onHudUpdate({
      levelId: this.level.id,
      totalLevels: LEVELS.length,
      levelName: this.level.theme.name,
      jewelleryName: this.level.theme.jewelleryName,
      health: Math.round(this.health),
      maxHealth: this.maxHealth,
      activeWeapon: this.activeWeapon,
      gunBullets: this.gunBullets,
      maxGunBullets: MAX_GUN_BULLETS,
      specialGunBullets: this.specialGunBullets,
      maxSpecialGunBullets: MAX_SPECIAL_GUN_BULLETS,
      bulletPacks: this.bulletPacks,
      maxBulletPacks: MAX_BULLET_PACKS,
      reloading: this.reloading,
      coinsCollected: this.coinsCollected,
      totalCoins: this.totalCoins,
      score: this.score,
      kills: this.kills,
      totalBots: this.bots.length,
      bountyKillsRequired: this.level.bountyKillsRequired,
      bountyUnlocked,
      trophyDoorUnlocked,
      switchesActivated,
      switchesTotal,
      elapsedSeconds: this.elapsedSeconds,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      targetHighlight: this.getTargetHighlight(),
      damageFlash: this.damageFlash,
      healFlash: this.healFlash,
      hitMarker: this.hitMarker,
      deathFade: this.dying
        ? THREE.MathUtils.clamp(1 - this.deathFadeTimer / DEATH_FADE_DURATION, 0, 1)
        : this.finished && this.health <= 0
          ? 1
          : 0,
      slowMoActive: this.slowMoTimer > 0 && !this.dying,
      bannerMessage: this.bannerTimer > 0 ? this.bannerMessage : null,
      bannerTone: this.bannerTone,
      tutorialHint,
      tutorialAccent,
      trophyDistance: trophyNav.trophyDistance,
      trophyBearingDeg: trophyNav.trophyBearingDeg,
      minimap: {
        cols: this.gridCols,
        rows: this.gridRows,
        grid: this.level.grid,
        playerX: this.playerX / TILE_SIZE,
        playerZ: this.playerZ / TILE_SIZE,
        playerYaw: this.playerYaw,
        doors: this.doors.map((d) => ({
          x: d.state.gridX + 0.5,
          z: d.state.gridZ + 0.5,
          unlocked: d.state.unlocked,
          kind: d.state.kind,
          color: d.state.switchColor,
        })),
        switches: this.switches.map((s) => ({
          x: s.state.gridX + 0.5,
          z: s.state.gridZ + 0.5,
          activated: s.state.activated,
          color: s.state.color,
        })),
        enemies: [],
        coins: this.pickups
          .filter((p) => p.kind === 'coin')
          .map((p) => ({
            x: p.x / TILE_SIZE,
            z: p.z / TILE_SIZE,
            collected: p.collected,
          })),
        packs: this.pickups
          .filter((p) => p.kind === 'pack')
          .map((p) => ({
            x: p.x / TILE_SIZE,
            z: p.z / TILE_SIZE,
            collected: p.collected,
          })),
        medkits: this.pickups
          .filter((p) => p.kind === 'medkit')
          .map((p) => ({
            x: p.x / TILE_SIZE,
            z: p.z / TILE_SIZE,
            collected: p.collected,
          })),
        guns: this.pickups
          .filter((p) => p.kind === 'gun')
          .map((p) => ({
            x: p.x / TILE_SIZE,
            z: p.z / TILE_SIZE,
            collected: p.collected,
          })),
        treasure: {
          x: this.treasurePos.gridX + 0.5,
          z: this.treasurePos.gridZ + 0.5,
          collected: this.treasurePos.collected,
        },
        trophyPath: trophyNav.trophyPath,
      },
    });
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = this.clock.elapsedTime;

    if (!this.paused && !this.finished) {
      if (this.dying) {
        this.deathFadeTimer = Math.max(0, this.deathFadeTimer - dt);
        const simDt = dt * 0.35;

        this.input.aimDeltaX = 0;
        this.input.aimDeltaY = 0;
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);
        this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
        this.weaponRecoil = THREE.MathUtils.damp(this.weaponRecoil, 0, 14, dt);
        this.damageFlash = Math.max(0, this.damageFlash - dt * 1.4);
        this.hitMarker = Math.max(0, this.hitMarker - dt * 4.5);

        this.updateProjectiles(simDt);
        this.updateBots(simDt, elapsed);
        this.updateDoorsAndProps(simDt, elapsed);
        this.updateParticles(simDt);
        this.syncCamera(dt);

        this.emitHud();
        this.renderer.render(this.scene, this.camera);

        if (this.deathFadeTimer <= 0) {
          this.dying = false;
          this.finished = true;
          this.needsPausedRender = true;
          this.emitHud();
          this.callbacks.onGameOver({
            levelId: this.level.id,
            score: this.score,
            kills: this.kills,
          });
        }
      } else {
        if (this.slowMoTimer > 0) {
          this.slowMoTimer = Math.max(0, this.slowMoTimer - dt);
          if (this.slowMoTimer > 0.4) {
            this.timeScale = 0.32;
          } else {
            const ramp = 1 - this.slowMoTimer / 0.4;
            this.timeScale = 0.32 + (1 - 0.32) * ramp;
          }
          if (this.slowMoTimer <= 0) {
            this.timeScale = 1;
            this.hudSyncTimer = 0.1;
          }
        } else {
          this.timeScale = 1;
        }

        const simDt = dt * this.timeScale;
        const playerMoveDt = dt * (0.55 + 0.45 * this.timeScale);
        this.elapsedSeconds += simDt;

        this.playerYaw -= this.input.turnDelta * 2.15 * dt;
        this.playerYaw -= this.input.aimDeltaX * 0.0044;
        this.playerPitch = THREE.MathUtils.clamp(
          this.playerPitch - this.input.aimDeltaY * 0.0032,
          -0.48,
          0.48,
        );
        this.weaponSwayX = THREE.MathUtils.clamp(
          this.weaponSwayX - (this.input.aimDeltaX * 0.00045 + this.input.turnDelta * 0.002),
          -0.028,
          0.028,
        );
        this.weaponSwayY = THREE.MathUtils.clamp(
          this.weaponSwayY + this.input.aimDeltaY * 0.00035,
          -0.02,
          0.02,
        );
        this.input.aimDeltaX = 0;
        this.input.aimDeltaY = 0;

        const moveSpeed = 5.8;
        const fwdX = -Math.sin(this.playerYaw);
        const fwdZ = -Math.cos(this.playerYaw);
        const rightX = Math.cos(this.playerYaw);
        const rightZ = -Math.sin(this.playerYaw);

        const moveX =
          (fwdX * this.input.moveForward + rightX * this.input.moveStrafe) *
            moveSpeed *
            playerMoveDt +
          this.playerKnockbackX * simDt;
        const moveZ =
          (fwdZ * this.input.moveForward + rightZ * this.input.moveStrafe) *
            moveSpeed *
            playerMoveDt +
          this.playerKnockbackZ * simDt;

        const prevPlayerX = this.playerX;
        const prevPlayerZ = this.playerZ;
        if (Math.abs(moveX) > 0.0001 || Math.abs(moveZ) > 0.0001) {
          const res = this.resolveCircleGridCollision(
            this.playerX + moveX,
            this.playerZ + moveZ,
            PLAYER_RADIUS,
          );
          this.playerX = res.x;
          this.playerZ = res.z;
        }

        const movedDist = Math.hypot(this.playerX - prevPlayerX, this.playerZ - prevPlayerZ);
        const wantsMove =
          Math.abs(this.input.moveForward) > 0.08 || Math.abs(this.input.moveStrafe) > 0.08;
        if (wantsMove && movedDist > 0.004) {
          this.footstepTimer -= playerMoveDt;
          if (this.footstepTimer <= 0) {
            soundFX.playFootstep(this.footstepIndex++);
            this.footstepTimer = 0.34;
          }
        } else {
          this.footstepTimer = 0.04;
        }

        if (Math.abs(this.playerKnockbackX) > 0.01 || Math.abs(this.playerKnockbackZ) > 0.01) {
          this.playerKnockbackX = THREE.MathUtils.damp(this.playerKnockbackX, 0, 10, simDt);
          this.playerKnockbackZ = THREE.MathUtils.damp(this.playerKnockbackZ, 0, 10, simDt);
        }

        // Autofill gun from Bullet Pack bucket
        if (this.reloading) {
          this.reloadTimer -= dt;
          if (this.reloadTimer <= 0) {
            this.reloading = false;
            if (this.bulletPacks > 0) {
              this.bulletPacks--;
              this.gunBullets = MAX_GUN_BULLETS;
              this.showBanner(
                `Autofilled +10 Bullets (${this.bulletPacks}/${MAX_BULLET_PACKS} Packs Left)`,
                'info',
                1.4,
              );
            }
            this.hudSyncTimer = 0;
            this.emitHud();
          }
        }

        this.fireCooldown = Math.max(0, this.fireCooldown - dt);
        this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
        this.noticeCooldown = Math.max(0, this.noticeCooldown - dt);
        this.weaponSwitchAnim = Math.max(0, this.weaponSwitchAnim - dt * 5.2);
        this.weaponRecoil = THREE.MathUtils.damp(this.weaponRecoil, 0, 14, dt);
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 18, dt);
        this.damageFlash = Math.max(0, this.damageFlash - dt * 2.5);
        this.healFlash = Math.max(0, this.healFlash - dt * 2.1);
        this.hitMarker = Math.max(0, this.hitMarker - dt * 4.5);
        if (this.bannerTimer > 0) {
          this.bannerTimer = Math.max(0, this.bannerTimer - dt);
        }

        if (this.input.firing) {
          this.firePlayerWeapon();
        }

        this.updateProjectiles(simDt);
        this.updateBots(simDt, elapsed);
        this.updateDoorsAndProps(simDt, elapsed);
        this.updateParticles(simDt);
        this.syncCamera(dt);

        // Periodically spawn random Bullet Packs, Medkits & Heavy Guns on reachable floor tiles
        if (this.level.tutorialMode !== 'coins') {
          this.floorSpawnTimer += simDt;
          if (this.floorSpawnTimer >= 8.5) {
            this.floorSpawnTimer = 0;
            let activePacks = 0;
            let activeMedkits = 0;
            let activeGuns = 0;
            for (const p of this.pickups) {
              if (p.collected) continue;
              if (p.kind === 'pack') activePacks++;
              else if (p.kind === 'medkit') activeMedkits++;
              else if (p.kind === 'gun') activeGuns++;
            }
            if (activePacks < 3) {
              this.spawnRandomFloorPickup('pack', true, 2.8);
            }
            if (
              this.medkitsSpawnedThisLevel < MAX_HEALTH_PACKS_PER_LEVEL &&
              activeMedkits < MAX_HEALTH_PACKS_PER_LEVEL
            ) {
              if (this.spawnRandomFloorPickup('medkit', true, 2.8)) {
                this.medkitsSpawnedThisLevel++;
              }
            }
            if (this.level.gunPickupCount > 0 && activeGuns < 2 && this.kills < this.bots.length) {
              this.spawnRandomFloorPickup('gun', true, 2.8);
            }
          }
        }

        const trophyReady =
          this.coinsCollected >= this.totalCoins && this.kills >= this.bots.length;
        this.hudSyncTimer += dt;
        if (this.hudSyncTimer >= (trophyReady ? 0.05 : 0.1)) {
          this.hudSyncTimer = 0;
          this.emitHud();
        }

        this.renderer.render(this.scene, this.camera);
      }
    } else if (this.needsPausedRender) {
      this.needsPausedRender = false;
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    window.visualViewport?.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.clearLevel();
    for (const mat of this.sharedBasicMats.values()) {
      mat.dispose();
    }
    this.sharedBasicMats.clear();
    this.boltGeo.dispose();
    this.particleGeo.dispose();
    this.contactShadowTex.dispose();
    this.envRT.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
