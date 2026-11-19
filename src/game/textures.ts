import * as THREE from 'three';
import { LevelTheme } from './types';

function configureTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

export function createWallTexture(theme: LevelTheme, maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, theme.wallPrimary);
  grad.addColorStop(1, theme.wallSecondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Stylized beveled stone / architectural wall panels
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, size - 24, size - 24);

  // Subtle brick/panel seams
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(0, 82, size, 3);
  ctx.fillRect(0, 174, size, 3);
  ctx.fillRect(size / 2 - 2, 12, 3, 70);
  ctx.fillRect(size / 4 - 2, 85, 3, 89);
  ctx.fillRect((size * 3) / 4 - 2, 85, 3, 89);

  // Stylized glowing accent trim band near top & bottom
  ctx.fillStyle = theme.wallAccent;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(16, 26, size - 32, 6);
  ctx.globalAlpha = 0.45;
  ctx.fillRect(16, size - 28, size - 32, 4);
  ctx.globalAlpha = 1;

  // Center diamond architectural motif
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = theme.wallAccent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 3;
  ctx.strokeRect(-22, -22, 44, 44);
  ctx.restore();

  return configureTexture(canvas, maxAnisotropy);
}

export function createCrateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm stylized honey-oak crate base (homage to reference crates in vibrant style)
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, size, size);

  // Inner wood planks
  ctx.fillStyle = '#d97706';
  ctx.fillRect(18, 18, size - 36, size - 36);

  // Plank grain lines
  ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
  for (let y = 36; y < size - 24; y += 28) {
    ctx.fillRect(20, y, size - 40, 3);
  }

  // Diagonal reinforced brace
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(22, size - 22);
  ctx.lineTo(size - 22, 22);
  ctx.stroke();

  // Outer beveled frame & metallic corner brackets
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  ctx.fillStyle = '#475569';
  const b = 26;
  ctx.fillRect(0, 0, b, b);
  ctx.fillRect(size - b, 0, b, b);
  ctx.fillRect(0, size - b, b, b);
  ctx.fillRect(size - b, size - b, b, b);

  // Bright amber center emblem
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.stroke();

  return configureTexture(canvas, maxAnisotropy);
}

export function createFloorTexture(
  theme: LevelTheme,
  maxAnisotropy: number,
  cols: number,
  rows: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = theme.floorPrimary;
  ctx.fillRect(0, 0, size, size);

  // 2x2 stylized vault tiles per cell
  ctx.fillStyle = theme.floorSecondary;
  ctx.fillRect(0, 0, size / 2, size / 2);
  ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

  // Crisp grout lines & subtle bevel highlight
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size / 2 - 8, size / 2 - 8);
  ctx.strokeRect(size / 2 + 4, size / 2 + 4, size / 2 - 8, size / 2 - 8);

  return configureTexture(canvas, maxAnisotropy, cols, rows);
}

export function createDoorTexture(
  accentColor: string,
  label: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, size, size);

  // Diagonal hazard accent border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  // Inner recessed armor panel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(28, 28, size - 56, size - 56);

  // Center lock ring
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2 - 10, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Text glyph
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 28px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size / 2, size / 2 + 64);

  return configureTexture(canvas, maxAnisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    6,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
