import * as THREE from 'three';
import { BotStyle, SwitchColor, WeaponKind } from './types';

export const SWITCH_COLORS: Record<SwitchColor, number> = {
  amber: 0xf59e0b,
  cyan: 0x06b6d4,
  violet: 0xa855f7,
};

export const SWITCH_HEX: Record<SwitchColor, string> = {
  amber: '#f59e0b',
  cyan: '#06b6d4',
  violet: '#a855f7',
};

export interface BotRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftShutter: THREE.Mesh;
  rightShutter: THREE.Mesh;
  cannonCore: THREE.Mesh;
  visor: THREE.Mesh;
  hoverRing: THREE.Mesh;
  hpBarBg: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  armorMeshes: THREE.Mesh[];
  muzzlePoint: THREE.Object3D;
}

export function getBotStyleForLevel(levelId: number): BotStyle {
  if (levelId >= 25) return 'dreadnought';
  if (levelId >= 18) return 'enforcer';
  return 'sentinel';
}

export function createBotModel(
  levelId: number,
  contactShadowTex: THREE.Texture,
): BotRig {
  const group = new THREE.Group();
  const style = getBotStyleForLevel(levelId);

  const hullColor =
    style === 'dreadnought'
      ? 0x1e1b4b
      : style === 'enforcer'
        ? 0x7f1d1d
        : levelId >= 11
          ? 0xe11d48
          : 0x0284c7;
  const accentColor =
    style === 'dreadnought'
      ? 0xfacc15
      : style === 'enforcer'
        ? 0xf97316
        : levelId >= 11
          ? 0xfb923c
          : 0x38bdf8;
  const trimDarkColor = style === 'dreadnought' ? 0x0f172a : 0x1e293b;

  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColor,
    roughness: style === 'sentinel' ? 0.32 : 0.24,
    metalness: style === 'sentinel' ? 0.58 : 0.78,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: trimDarkColor,
    roughness: 0.52,
    metalness: 0.55,
  });
  const shutterMat = new THREE.MeshStandardMaterial({
    color: style === 'dreadnought' ? 0x312e81 : style === 'enforcer' ? 0x451a03 : 0x334155,
    roughness: 0.28,
    metalness: 0.82,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.22,
    metalness: 0.88,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: style === 'dreadnought' ? 0xf43f5e : style === 'enforcer' ? 0xfb923c : 0x38bdf8,
    emissive: style === 'dreadnought' ? 0xe11d48 : style === 'enforcer' ? 0xf97316 : 0x0ea5e9,
    emissiveIntensity: style === 'sentinel' ? 1.4 : 1.9,
    roughness: 0.15,
    metalness: 0.2,
  });

  // Grounded contact shadow disc
  const shadowSize = style === 'sentinel' ? 1.4 : 1.75;
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(shadowSize, shadowSize),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    }),
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const armorMeshes: THREE.Mesh[] = [];

  if (style === 'sentinel') {
    // Classic Sentinel Hover-Tread Pedestal
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.54, 0.28, 10),
      chassisMat,
    );
    basePlate.position.y = 0.16;
    basePlate.castShadow = true;
    bodyGroup.add(basePlate);

    const hoverRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.045, 8, 24),
      new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.1,
        roughness: 0.25,
        metalness: 0.6,
      }),
    );
    hoverRing.rotation.x = Math.PI / 2;
    hoverRing.position.y = 0.28;
    bodyGroup.add(hoverRing);

    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.32, 8), chassisMat);
    waist.position.y = 0.46;
    bodyGroup.add(waist);

    const backChassis = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.44), hullMat);
    backChassis.position.set(0, 1.04, -0.06);
    backChassis.castShadow = true;
    bodyGroup.add(backChassis);

    const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.48), accentMat);
    leftPod.position.set(-0.5, 1.08, 0.04);
    leftPod.castShadow = true;
    const rightPod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.48), accentMat);
    rightPod.position.set(0.5, 1.08, 0.04);
    rightPod.castShadow = true;
    bodyGroup.add(leftPod, rightPod);

    const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.16), chassisMat);
    cavity.position.set(0, 1.04, 0.14);
    bodyGroup.add(cavity);

    const cannonCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.17, 0.34, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.4,
      }),
    );
    cannonCore.rotation.x = Math.PI / 2;
    cannonCore.position.set(0, 1.04, 0.16);
    bodyGroup.add(cannonCore);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 1.04, 0.38);
    bodyGroup.add(muzzlePoint);

    const leftShutter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.56, 0.09), shutterMat);
    leftShutter.position.set(-0.165, 1.04, 0.28);
    leftShutter.castShadow = true;

    const rightShutter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.56, 0.09), shutterMat);
    rightShutter.position.set(0.165, 1.04, 0.28);
    rightShutter.castShadow = true;
    bodyGroup.add(leftShutter, rightShutter);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.42), hullMat);
    head.position.set(0, 1.66, 0);
    head.castShadow = true;
    bodyGroup.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), visorMat);
    visor.position.set(0, 1.67, 0.21);
    bodyGroup.add(visor);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.22, 6), accentMat);
    antenna.position.set(0, 1.93, 0);
    bodyGroup.add(antenna);

    armorMeshes.push(backChassis, head, leftPod, rightPod, leftShutter, rightShutter);

    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.11),
      new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide }),
    );
    hpBarBg.position.set(0, 2.24, 0);
    group.add(hpBarBg);

    const hpBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.07),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }),
    );
    hpBarFill.position.set(0, 2.24, 0.01);
    group.add(hpBarFill);

    return {
      group,
      bodyGroup,
      leftShutter,
      rightShutter,
      cannonCore,
      visor,
      hoverRing,
      hpBarBg,
      hpBarFill,
      armorMeshes,
      muzzlePoint,
    };
  }

  // HEAVY ARMORED ENEMIES FOR LEVELS 18-30 ('enforcer' & 'dreadnought')
  const isDread = style === 'dreadnought';

  // Heavy Hexagonal Armored Hover-Skirt Base
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.68, 0.32, 6),
    chassisMat,
  );
  basePlate.position.y = 0.17;
  basePlate.castShadow = true;
  bodyGroup.add(basePlate);

  const hoverRing = new THREE.Mesh(
    new THREE.TorusGeometry(isDread ? 0.64 : 0.58, 0.055, 8, 6),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.7,
    }),
  );
  hoverRing.rotation.x = Math.PI / 2;
  hoverRing.position.y = 0.31;
  bodyGroup.add(hoverRing);

  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.36, 6), hullMat);
  waist.position.y = 0.5;
  bodyGroup.add(waist);

  // Broad Octagonal Armored Chest Chassis
  const backChassis = new THREE.Mesh(
    new THREE.CylinderGeometry(isDread ? 0.64 : 0.58, isDread ? 0.54 : 0.5, 0.94, 8),
    hullMat,
  );
  backChassis.position.set(0, 1.08, -0.04);
  backChassis.castShadow = true;
  bodyGroup.add(backChassis);

  // Heavy Angled Armor Pauldrons + Twin Shoulder Barrels
  const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.78, 0.58), accentMat);
  leftPod.position.set(-0.62, 1.18, 0.04);
  leftPod.rotation.z = 0.16;
  leftPod.castShadow = true;

  const rightPod = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.78, 0.58), accentMat);
  rightPod.position.set(0.62, 1.18, 0.04);
  rightPod.rotation.z = -0.16;
  rightPod.castShadow = true;
  bodyGroup.add(leftPod, rightPod);

  // Twin Shoulder Shield Blades / Rail Cannons
  const leftBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.075, 0.62, 8),
    chassisMat,
  );
  leftBarrel.rotation.x = Math.PI / 2;
  leftBarrel.position.set(-0.64, 1.44, 0.24);
  const rightBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.075, 0.62, 8),
    chassisMat,
  );
  rightBarrel.rotation.x = Math.PI / 2;
  rightBarrel.position.set(0.64, 1.44, 0.24);
  bodyGroup.add(leftBarrel, rightBarrel);

  if (isDread) {
    // Dreadnought Armored Wing Fins & Halo Reactor Crest
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.36), hullMat);
    leftWing.position.set(-0.82, 1.52, -0.1);
    leftWing.rotation.z = -0.35;
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.36), hullMat);
    rightWing.position.set(0.82, 1.52, -0.1);
    rightWing.rotation.z = 0.35;
    bodyGroup.add(leftWing, rightWing);
    armorMeshes.push(leftWing, rightWing);
  }

  // Deep Armored Cannon Bay & Glowing Plasma Reactor
  const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.56, 0.2), chassisMat);
  cavity.position.set(0, 1.06, 0.18);
  bodyGroup.add(cavity);

  const cannonCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.38, 8),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: isDread ? 0xf43f5e : 0xf97316,
      emissiveIntensity: 2.2,
      roughness: 0.16,
      metalness: 0.5,
    }),
  );
  cannonCore.rotation.x = Math.PI / 2;
  cannonCore.position.set(0, 1.06, 0.22);
  bodyGroup.add(cannonCore);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 1.06, 0.44);
  bodyGroup.add(muzzlePoint);

  // Heavy Reinforced Sliding Armor Chest Shutters
  const leftShutter = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.13), shutterMat);
  leftShutter.position.set(-0.175, 1.06, 0.34);
  leftShutter.castShadow = true;

  const rightShutter = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.13), shutterMat);
  rightShutter.position.set(0.175, 1.06, 0.34);
  rightShutter.castShadow = true;
  bodyGroup.add(leftShutter, rightShutter);

  // Angular Armored War-Helm & Horned Crest
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.42, 6), hullMat);
  head.position.set(0, 1.76, 0.02);
  head.castShadow = true;
  bodyGroup.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.13, 0.12), visorMat);
  visor.position.set(0, 1.77, 0.25);
  bodyGroup.add(visor);

  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 5), accentMat);
  leftHorn.position.set(-0.24, 2.04, 0.02);
  leftHorn.rotation.z = 0.32;
  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 5), accentMat);
  rightHorn.position.set(0.24, 2.04, 0.02);
  rightHorn.rotation.z = -0.32;
  bodyGroup.add(leftHorn, rightHorn);

  if (isDread) {
    const crownSpike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), accentMat);
    crownSpike.position.set(0, 2.12, 0.02);
    bodyGroup.add(crownSpike);
  }

  armorMeshes.push(backChassis, head, leftPod, rightPod, leftShutter, rightShutter, waist);

  // Slightly wider Armored Enemy Health Bar above horns
  const hpBarBg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide }),
  );
  hpBarBg.position.set(0, 2.44, 0);
  group.add(hpBarBg);

  const hpBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }),
  );
  hpBarFill.position.set(0, 2.44, 0.01);
  group.add(hpBarFill);

  return {
    group,
    bodyGroup,
    leftShutter,
    rightShutter,
    cannonCore,
    visor,
    hoverRing,
    hpBarBg,
    hpBarFill,
    armorMeshes,
    muzzlePoint,
  };
}

export interface SwitchRig {
  group: THREE.Group;
  orb: THREE.Mesh;
  ring: THREE.Mesh;
  beacon: THREE.PointLight;
}

export function createSwitchModel(
  color: SwitchColor,
  contactShadowTex: THREE.Texture,
): SwitchRig {
  const group = new THREE.Group();
  const hex = SWITCH_COLORS[color];

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.5,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.3,
    metalness: 0.7,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.25, 8), baseMat);
  base.position.y = 0.125;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.85, 8), baseMat);
  pillar.position.y = 0.65;
  pillar.castShadow = true;
  group.add(pillar);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.14, 8), trimMat);
  collar.position.y = 1.1;
  group.add(collar);

  const orbMat = new THREE.MeshStandardMaterial({
    color: hex,
    emissive: hex,
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.2,
  });
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), orbMat);
  orb.position.y = 1.56;
  group.add(orb);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    }),
  );
  ring.position.y = 1.56;
  group.add(ring);

  const beacon = new THREE.PointLight(hex, 2.2, 6);
  beacon.position.y = 1.65;
  group.add(beacon);

  return { group, orb, ring, beacon };
}

export interface DoorRig {
  group: THREE.Group;
  leftLeaf: THREE.Mesh;
  rightLeaf: THREE.Mesh;
  lockBadge: THREE.Mesh;
}

export function createDoorModel(
  tileSize: number,
  wallHeight: number,
  doorTex: THREE.Texture,
  accentHex: number,
): DoorRig {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.45,
    metalness: 0.65,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    map: doorTex,
    roughness: 0.38,
    metalness: 0.55,
  });

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(tileSize, 0.34, 0.54), frameMat);
  lintel.position.y = wallHeight - 0.17;
  group.add(lintel);

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, wallHeight, 0.54), frameMat);
  leftPillar.position.set(-tileSize / 2 + 0.12, wallHeight / 2, 0);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, wallHeight, 0.54), frameMat);
  rightPillar.position.set(tileSize / 2 - 0.12, wallHeight / 2, 0);
  group.add(leftPillar, rightPillar);

  const leafWidth = (tileSize - 0.44) / 2;
  const leafHeight = wallHeight - 0.34;
  const leafGeo = new THREE.BoxGeometry(leafWidth, leafHeight, 0.32);

  const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
  leftLeaf.position.set(-leafWidth / 2, leafHeight / 2, 0);
  leftLeaf.castShadow = true;

  const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
  rightLeaf.position.set(leafWidth / 2, leafHeight / 2, 0);
  rightLeaf.castShadow = true;

  group.add(leftLeaf, rightLeaf);

  const lockBadge = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.4,
    }),
  );
  lockBadge.position.set(0, wallHeight - 0.16, 0);
  group.add(lockBadge);

  return { group, leftLeaf, rightLeaf, lockBadge };
}

export interface TreasureRig {
  group: THREE.Group;
  relicGroup: THREE.Group;
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  beam: THREE.Mesh;
}

export function createTreasureModel(
  accentHex: string,
  contactShadowTex: THREE.Texture,
): TreasureRig {
  const group = new THREE.Group();
  const colorNum = new THREE.Color(accentHex).getHex();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.4,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.18,
    metalness: 0.92,
  });

  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.24, 8), stoneMat);
  step1.position.y = 0.12;
  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.82, 0.26, 8), goldMat);
  step2.position.y = 0.37;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.5, 8), stoneMat);
  plinth.position.y = 0.75;
  group.add(step1, step2, plinth);

  // Floating Final Jewellery Assembly (Tiara / Medallion Gem + Twin Gold Halos)
  const relicGroup = new THREE.Group();
  relicGroup.position.y = 1.65;

  const coreGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({
      color: colorNum,
      emissive: colorNum,
      emissiveIntensity: 1.25,
      roughness: 0.1,
      metalness: 0.35,
    }),
  );
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 20), goldMat);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = -0.22;
  relicGroup.add(coreGem, collarRing);

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.05, 10, 32), goldMat);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.04, 10, 28), goldMat);
  innerRing.rotation.x = Math.PI / 2;
  relicGroup.add(outerRing, innerRing);

  group.add(relicGroup);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.68, 3.2, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: colorNum,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beam.position.y = 1.65;
  group.add(beam);

  const light = new THREE.PointLight(colorNum, 4.5, 10);
  light.position.y = 1.8;
  group.add(light);

  return { group, relicGroup, outerRing, innerRing, beam };
}

export function createPickupModel(
  kind: 'medkit' | 'pack' | 'coin' | 'gun',
  contactShadowTex: THREE.Texture,
): THREE.Group {
  const group = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(kind === 'gun' ? 1.25 : 0.95, kind === 'gun' ? 1.25 : 0.95),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const meshGroup = new THREE.Group();
  meshGroup.position.y = kind === 'coin' || kind === 'gun' ? 0.92 : 0.68;
  meshGroup.name = 'spinGroup';

  if (kind === 'medkit') {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.42, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32, metalness: 0.14 }),
    );
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.05,
      roughness: 0.22,
    });
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), crossMat);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.4), crossMat);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.026, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.82 }),
    );
    halo.name = 'coinHalo';
    halo.rotation.x = Math.PI / 2.3;
    halo.position.y = 0.68;
    meshGroup.add(box, h, v);
    group.add(halo);
  } else if (kind === 'pack') {
    // 10-Bullet Pack Magazine Cartridge
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.38,
      metalness: 0.72,
    });
    const energyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.25,
      roughness: 0.2,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.28), caseMat);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.31), energyMat);
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.24), capMat);
    topCap.position.y = 0.26;
    meshGroup.add(body, band, topCap);
  } else if (kind === 'gun') {
    // Floating 3D Apex Heavy Railgun Pickup + Amber-Gold Halo Ring
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.82,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.88,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.7,
      roughness: 0.15,
    });

    const gunModel = new THREE.Group();
    gunModel.rotation.z = 0.22;
    gunModel.rotation.x = 0.18;

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.66), chassisMat);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.78), railMat);
    topRail.position.set(0, 0.11, -0.14);
    const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.72), railMat);
    bottomRail.position.set(0, -0.05, -0.14);
    const coreBeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.56), coreMat);
    coreBeam.position.set(0, 0.03, -0.16);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.14), chassisMat);
    grip.position.set(0, -0.18, 0.15);
    grip.rotation.x = 0.28;

    gunModel.add(receiver, topRail, bottomRail, coreBeam, grip);
    meshGroup.add(gunModel);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.032, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.88 }),
    );
    halo.name = 'coinHalo';
    halo.rotation.x = Math.PI / 2.2;
    halo.position.y = 0.92;
    group.add(halo);
  } else {
    // Rich Animated Gold Coin Disc + Embossed Crest + Orbiting Halo Ring
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.16,
      metalness: 0.92,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.95,
    });
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfacc15,
      emissiveIntensity: 1.4,
      roughness: 0.12,
      metalness: 0.5,
    });

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 20), goldMat);
    disc.rotation.x = Math.PI / 2;

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.048, 8, 24), rimMat);

    // Raised vertical & cross bars on both coin faces make rotation unmistakable
    const faceBar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.15), crestMat);
    const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), crestMat);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.025, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 }),
    );
    halo.name = 'coinHalo';
    halo.rotation.x = Math.PI / 2.4;

    meshGroup.add(disc, rim, faceBar, centerGem);
    group.add(halo);
    halo.position.y = 0.92;
  }

  group.add(meshGroup);
  return group;
}

export interface WeaponRig {
  group: THREE.Group;
  muzzleFlash: THREE.Mesh;
  flashLight: THREE.PointLight;
}

export function createWeaponModel(kind: WeaponKind = 'default'): WeaponRig {
  const group = new THREE.Group();

  if (kind === 'heavy') {
    // APEX HEAVY RAILGUN: Twin glowing amber-gold rails + dark titanium frame + plasma capacitor coils
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.86,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.72,
      metalness: 0.25,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.9,
    });
    const energyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.1,
      roughness: 0.14,
    });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.14, 0.46), bodyMat);
    receiver.position.set(0, -0.01, -0.1);
    group.add(receiver);

    // Twin Parallel Magnetic Rails
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.065, 0.46), railMat);
    leftRail.position.set(-0.048, 0.032, -0.42);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.065, 0.46), railMat);
    rightRail.position.set(0.048, 0.032, -0.42);
    group.add(leftRail, rightRail);

    // Glowing Plasma Core Between Rails
    const coreBeam = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.48), energyMat);
    coreBeam.position.set(0, 0.034, -0.4);
    group.add(coreBeam);

    // Dual Side Capacitor Coils
    const leftCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 8), energyMat);
    leftCoil.rotation.x = Math.PI / 2;
    leftCoil.position.set(-0.08, 0.02, -0.22);
    const rightCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 8), energyMat);
    rightCoil.rotation.x = Math.PI / 2;
    rightCoil.position.set(0.08, 0.02, -0.22);
    group.add(leftCoil, rightCoil);

    // Heavy Angled Muzzle Stabilizer
    const muzzleCollar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.07), railMat);
    muzzleCollar.position.set(0, 0.03, -0.62);
    group.add(muzzleCollar);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.19, 0.11), gripMat);
    grip.position.set(0, -0.12, 0.04);
    grip.rotation.x = 0.24;
    group.add(grip);

    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const muzzleFlash = new THREE.Mesh(new THREE.OctahedronGeometry(0.155, 0), flashMat);
    muzzleFlash.position.set(0, 0.032, -0.74);
    group.add(muzzleFlash);

    const flashLight = new THREE.PointLight(0xf59e0b, 0, 7);
    flashLight.position.set(0, 0.06, -0.72);
    group.add(flashLight);

    return { group, muzzleFlash, flashLight };
  }

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.8,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.75,
    metalness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.42), bodyMat);
  receiver.position.set(0, 0, -0.1);
  group.add(receiver);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), bodyMat);
  barrel.position.set(0, 0.025, -0.36);
  group.add(barrel);

  const coreStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.34), glowMat);
  coreStrip.position.set(0, 0.072, -0.2);
  group.add(coreStrip);

  const muzzleCollar = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.095, 0.06), goldMat);
  muzzleCollar.position.set(0, 0.025, -0.5);
  group.add(muzzleCollar);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.18, 0.1), gripMat);
  grip.position.set(0, -0.11, 0.03);
  grip.rotation.x = 0.24;
  group.add(grip);

  const vents = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.04, 0.16), goldMat);
  vents.position.set(0, 0.02, -0.25);
  group.add(vents);

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), flashMat);
  muzzleFlash.position.set(0, 0.025, -0.62);
  group.add(muzzleFlash);

  const flashLight = new THREE.PointLight(0x38bdf8, 0, 6);
  flashLight.position.set(0, 0.05, -0.6);
  group.add(flashLight);

  return { group, muzzleFlash, flashLight };
}
