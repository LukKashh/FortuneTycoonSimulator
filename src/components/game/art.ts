// Capitalfortune High-Fidelity Vector & Local Asset Library
// Guarantees 100% resilient rendering without broken image icons or missing asset boxes.

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ------------------------------------------------------------ Vector Asset Generators

const SVG_ASSETS: Record<string, string> = {
  // Avatars & Characters
  avatar: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f1f2e"/>
          <stop offset="100%" stop-color="#0b0b12"/>
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="16" fill="url(#bg)"/>
      <rect x="2" y="2" width="116" height="116" rx="14" fill="none" stroke="url(#glow)" stroke-width="2" opacity="0.6"/>
      <circle cx="60" cy="45" r="22" fill="#262638" stroke="url(#glow)" stroke-width="2"/>
      <path d="M 30 100 C 30 72, 90 72, 90 100 Z" fill="url(#glow)" opacity="0.8"/>
      <!-- Crown emblem -->
      <path d="M 50 32 L 54 42 L 60 35 L 66 42 L 70 32 L 68 46 L 52 46 Z" fill="url(#gold)"/>
    </svg>
  `),

  // City Skyline Backdrop
  skyline: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f0926"/>
          <stop offset="60%" stop-color="#1a0b36"/>
          <stop offset="100%" stop-color="#0b0b12"/>
        </linearGradient>
        <linearGradient id="bldg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2d1b4e"/>
          <stop offset="100%" stop-color="#120c24"/>
        </linearGradient>
        <linearGradient id="bldg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="cyan-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <rect width="800" height="240" fill="url(#sky)"/>
      <!-- Stars -->
      <circle cx="100" cy="30" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="250" cy="50" r="1.5" fill="#a78bfa" opacity="0.9"/>
      <circle cx="450" cy="20" r="1" fill="#fff" opacity="0.7"/>
      <circle cx="680" cy="40" r="1.2" fill="#06b6d4" opacity="0.9"/>
      <!-- Background Skyscrapers -->
      <rect x="40" y="80" width="60" height="160" fill="url(#bldg1)"/>
      <rect x="120" y="50" width="80" height="190" fill="url(#bldg2)"/>
      <rect x="220" y="100" width="50" height="140" fill="url(#bldg1)"/>
      <rect x="290" y="40" width="90" height="200" fill="url(#bldg2)"/>
      <rect x="400" y="90" width="70" height="150" fill="url(#bldg1)"/>
      <rect x="490" y="30" width="100" height="210" fill="url(#bldg2)"/>
      <rect x="610" y="70" width="75" height="170" fill="url(#bldg1)"/>
      <rect x="700" y="110" width="60" height="130" fill="url(#bldg2)"/>
      <!-- Neon Spire & Windows -->
      <line x1="335" y1="10" x2="335" y2="40" stroke="#06b6d4" stroke-width="3"/>
      <circle cx="335" cy="10" r="3" fill="#06b6d4"/>
      <line x1="540" y1="5" x2="540" y2="30" stroke="#a78bfa" stroke-width="3"/>
      <circle cx="540" cy="5" r="3" fill="#a78bfa"/>
      <!-- Window Grids -->
      <g fill="#facc15" opacity="0.75">
        <rect x="135" y="70" width="10" height="6" rx="1"/>
        <rect x="155" y="70" width="10" height="6" rx="1"/>
        <rect x="135" y="90" width="10" height="6" rx="1"/>
        <rect x="175" y="90" width="10" height="6" rx="1"/>
        <rect x="310" y="60" width="12" height="8" rx="1" fill="#06b6d4"/>
        <rect x="340" y="60" width="12" height="8" rx="1" fill="#a78bfa"/>
        <rect x="310" y="80" width="12" height="8" rx="1" fill="#a78bfa"/>
        <rect x="340" y="100" width="12" height="8" rx="1" fill="#06b6d4"/>
        <rect x="510" y="50" width="14" height="8" rx="1"/>
        <rect x="540" y="50" width="14" height="8" rx="1"/>
        <rect x="510" y="75" width="14" height="8" rx="1" fill="#06b6d4"/>
        <rect x="550" y="100" width="14" height="8" rx="1"/>
      </g>
      <!-- Bottom Ambient Fade -->
      <rect y="180" width="800" height="60" fill="url(#sky)" opacity="0.6"/>
    </svg>
  `),

  // Business Buildings
  lemon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 40 70 L 100 35 L 160 70 Z" fill="#facc15"/>
      <rect x="50" y="70" width="100" height="70" fill="#1f1f2e" stroke="#facc15" stroke-width="2"/>
      <circle cx="100" cy="95" r="18" fill="#fef08a"/>
      <text x="100" y="101" font-family="sans-serif" font-weight="bold" font-size="20" fill="#854d0e" text-anchor="middle">🍋</text>
    </svg>
  `),

  cafe: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="35" y="45" width="130" height="95" rx="6" fill="#1f1f2e" stroke="#a78bfa" stroke-width="2"/>
      <path d="M 30 45 L 170 45 L 160 65 L 40 65 Z" fill="#8b5cf6"/>
      <rect x="75" y="80" width="50" height="60" fill="#3b82f6" opacity="0.6"/>
      <text x="100" y="35" font-family="sans-serif" font-weight="bold" font-size="14" fill="#a78bfa" text-anchor="middle">☕ CAFÉ</text>
    </svg>
  `),

  retail: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="30" y="40" width="140" height="100" rx="8" fill="#1f1f2e" stroke="#3b82f6" stroke-width="2"/>
      <rect x="45" y="60" width="110" height="50" rx="4" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/>
      <text x="100" y="90" font-family="sans-serif" font-weight="bold" font-size="16" fill="#93c5fd" text-anchor="middle">🛍️ BOUTIQUE</text>
    </svg>
  `),

  supermarket: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="25" y="40" width="150" height="100" rx="6" fill="#1f1f2e" stroke="#22c55e" stroke-width="2"/>
      <rect x="35" y="25" width="130" height="20" rx="4" fill="#15803d"/>
      <text x="100" y="40" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff" text-anchor="middle">SUPERMARKET</text>
      <text x="100" y="95" font-family="sans-serif" font-size="32" text-anchor="middle">🛒</text>
    </svg>
  `),

  office: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="55" y="25" width="90" height="120" rx="4" fill="#1f1f2e" stroke="#8b5cf6" stroke-width="2"/>
      <g fill="#06b6d4" opacity="0.8">
        <rect x="65" y="35" width="20" height="14" rx="2"/>
        <rect x="90" y="35" width="20" height="14" rx="2"/>
        <rect x="115" y="35" width="20" height="14" rx="2"/>
        <rect x="65" y="55" width="20" height="14" rx="2"/>
        <rect x="90" y="55" width="20" height="14" rx="2"/>
        <rect x="115" y="55" width="20" height="14" rx="2"/>
        <rect x="65" y="75" width="20" height="14" rx="2"/>
        <rect x="90" y="75" width="20" height="14" rx="2"/>
        <rect x="115" y="75" width="20" height="14" rx="2"/>
      </g>
    </svg>
  `),

  factory: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 30 130 L 30 70 L 65 90 L 65 70 L 100 90 L 100 70 L 135 90 L 135 130 Z" fill="#1f1f2e" stroke="#f97316" stroke-width="2"/>
      <rect x="145" y="40" width="20" height="90" fill="#334155" stroke="#f97316" stroke-width="1.5"/>
      <circle cx="155" cy="25" r="10" fill="#94a3b8" opacity="0.4"/>
      <circle cx="165" cy="15" r="14" fill="#94a3b8" opacity="0.2"/>
    </svg>
  `),

  warehouse: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 25 65 L 100 35 L 175 65 L 175 135 L 25 135 Z" fill="#1f1f2e" stroke="#06b6d4" stroke-width="2"/>
      <rect x="75" y="80" width="50" height="55" fill="#0284c7"/>
      <text x="100" y="115" font-family="sans-serif" font-size="24" text-anchor="middle">📦</text>
    </svg>
  `),

  refinery: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="40" y="45" width="40" height="90" rx="20" fill="#1f1f2e" stroke="#eab308" stroke-width="2"/>
      <rect x="95" y="35" width="40" height="100" rx="20" fill="#1f1f2e" stroke="#eab308" stroke-width="2"/>
      <line x1="80" y1="70" x2="95" y2="70" stroke="#facc15" stroke-width="4"/>
      <text x="115" y="90" font-family="sans-serif" font-size="24" text-anchor="middle">⚡</text>
    </svg>
  `),

  mine: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 20 140 Q 100 40 180 140 Z" fill="#1e1b4b" stroke="#a78bfa" stroke-width="2"/>
      <path d="M 75 140 C 75 100, 125 100, 125 140 Z" fill="#0b0b12"/>
      <text x="100" y="90" font-family="sans-serif" font-size="28" text-anchor="middle">💎</text>
    </svg>
  `),

  farm: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 40 80 L 100 45 L 160 80 L 160 135 L 40 135 Z" fill="#1f1f2e" stroke="#22c55e" stroke-width="2"/>
      <rect x="80" y="85" width="40" height="50" fill="#166534"/>
      <text x="100" y="70" font-family="sans-serif" font-size="26" text-anchor="middle">🌾</text>
    </svg>
  `),

  // Real Estate Properties
  house: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <path d="M 80 130 L 200 50 L 320 130 Z" fill="#1f1f2e" stroke="#a78bfa" stroke-width="3"/>
      <rect x="100" y="130" width="200" height="90" fill="#1f1f2e" stroke="#a78bfa" stroke-width="2"/>
      <rect x="175" y="160" width="50" height="60" fill="#8b5cf6"/>
      <circle cx="215" cy="190" r="3" fill="#facc15"/>
      <rect x="120" y="150" width="35" height="35" rx="4" fill="#38bdf8" opacity="0.8"/>
      <rect x="245" y="150" width="35" height="35" rx="4" fill="#38bdf8" opacity="0.8"/>
    </svg>
  `),

  apartment: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="120" y="30" width="160" height="190" rx="8" fill="#1f1f2e" stroke="#3b82f6" stroke-width="3"/>
      <g fill="#60a5fa" opacity="0.85">
        <rect x="140" y="50" width="30" height="25" rx="3"/>
        <rect x="185" y="50" width="30" height="25" rx="3"/>
        <rect x="230" y="50" width="30" height="25" rx="3"/>
        <rect x="140" y="90" width="30" height="25" rx="3"/>
        <rect x="185" y="90" width="30" height="25" rx="3"/>
        <rect x="230" y="90" width="30" height="25" rx="3"/>
        <rect x="140" y="130" width="30" height="25" rx="3"/>
        <rect x="185" y="130" width="30" height="25" rx="3"/>
        <rect x="230" y="130" width="30" height="25" rx="3"/>
      </g>
    </svg>
  `),

  commercial: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="90" y="40" width="220" height="170" rx="10" fill="#1f1f2e" stroke="#06b6d4" stroke-width="3"/>
      <rect x="110" y="60" width="180" height="110" rx="6" fill="#0891b2" opacity="0.4"/>
      <text x="200" y="125" font-family="sans-serif" font-weight="bold" font-size="20" fill="#cffafe" text-anchor="middle">COMMERCIAL PLAZA</text>
    </svg>
  `),

  mall: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="60" y="60" width="280" height="140" rx="12" fill="#1f1f2e" stroke="#ec4899" stroke-width="3"/>
      <path d="M 60 90 L 200 40 L 340 90 Z" fill="#be185d" opacity="0.6"/>
      <text x="200" y="140" font-family="sans-serif" font-weight="bold" font-size="22" fill="#fbcfe8" text-anchor="middle">SHOPPING MALL</text>
    </svg>
  `),

  hotel: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="110" y="25" width="180" height="195" rx="10" fill="#1f1f2e" stroke="#facc15" stroke-width="3"/>
      <text x="200" y="65" font-family="sans-serif" font-weight="bold" font-size="18" fill="#fef08a" text-anchor="middle">GRAND HOTEL</text>
      <text x="200" y="140" font-family="sans-serif" font-size="48" text-anchor="middle">🏨</text>
    </svg>
  `),

  // Achievements Ranks
  bronze: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#78350f" stroke="#b45309" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fef08a"/>
    </svg>
  `),

  silver: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#334155" stroke="#94a3b8" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#f8fafc"/>
    </svg>
  `),

  gold: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#713f12" stroke="#facc15" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fef08a"/>
    </svg>
  `),

  master: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#581c87" stroke="#a78bfa" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#e9d5ff"/>
    </svg>
  `),

  elite: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#831843" stroke="#f472b6" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fce7f3"/>
    </svg>
  `),

  // Collectibles
  car: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🏎️</text>
    </svg>
  `),

  watch: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">⌚</text>
    </svg>
  `),

  art: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🖼️</text>
    </svg>
  `),

  diamond: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">💎</text>
    </svg>
  `),

  goldbars: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🪙</text>
    </svg>
  `),
};

// ------------------------------------------------------------ Local PNG File Paths

const LOCAL_ART_MAP: Record<string, string> = {
  car: "/assets/aistudio/file_000000002ac48246976a6431e00dba05_6e171ce7.png",
  watch: "/assets/aistudio/file_0000000041f48246b5da8b69d26a1b63_29c44a09.png",
  art: "/assets/aistudio/file_00000000b628824698b8fdbdb82e878d_a12dd038.png",
  diamond: "/assets/aistudio/file_000000001ccc82469b04d9f9243507e3_35141442.png",
  goldbars: "/assets/aistudio/file_000000009874824685d1bea8dfb105ee_fc40623f.png",
  jet: "/assets/aistudio/file_00000000ab0482468fdd77da7ddc513c_5401a87a.png",
  yacht: "/assets/aistudio/file_00000000db8482468f31df135f15804a_43eabf95.png",
  house: "/assets/aistudio/file_000000004afc82469e0b67e49b5950fd_e71386b3.png",
  office: "/assets/aistudio/file_000000005eac824697477ed3c842d657_304e6144.png",
};

export function art(name: string): string {
  // Always preference valid local PNG path if available, or fallback to SVG Data URI
  if (LOCAL_ART_MAP[name]) {
    return LOCAL_ART_MAP[name];
  }
  if (SVG_ASSETS[name]) {
    return SVG_ASSETS[name];
  }
  return SVG_ASSETS.house || SVG_ASSETS.office;
}

export function svgFallback(name: string): string {
  return SVG_ASSETS[name] || SVG_ASSETS.house || SVG_ASSETS.office;
}

import { getAssetForBusiness, getAssetForProperty } from "@/game/buildingAssets";
import { getBuildingSpriteSync } from "@/lib/buildingCatalogue";

export function companyImage(id: string): string {
  const asset = getAssetForBusiness(id);
  const sprite = getBuildingSpriteSync(asset.id);
  return sprite.spriteUrl;
}

export function propertyImage(category: string, name?: string): string {
  const asset = getAssetForProperty(category, name);
  const sprite = getBuildingSpriteSync(asset.id);
  return sprite.spriteUrl;
}

export function rankArt(tier: string): string {
  return art(
    (
      {
        Beginner: "bronze",
        Intermediate: "silver",
        Advanced: "gold",
        Expert: "master",
        Master: "elite",
      } as Record<string, string>
    )[tier] ?? "bronze",
  );
}

import { COLLECTIBLE_BY_ID, resolveCollectibleId } from "@/game/collectibles";

// ------------------------------------------------------------ Stock & Crypto Circular Zoomed Logo Textures

type BrandTheme = {
  bg1: string;
  bg2: string;
  ring: string;
  fg: string;
  accent: string;
  glyph?: string;
  motif?:
    | "chip"
    | "orbit"
    | "shield"
    | "bolt"
    | "cross"
    | "gear"
    | "crown"
    | "cart"
    | "wing"
    | "tower"
    | "gem"
    | "play"
    | "grid";
};

const SECTOR_DEFAULT_THEME: Record<string, BrandTheme> = {
  Technology: {
    bg1: "#0f172a",
    bg2: "#1e1b4b",
    ring: "#38bdf8",
    fg: "#f8fafc",
    accent: "#38bdf8",
    motif: "chip",
  },
  Finance: {
    bg1: "#0a192f",
    bg2: "#172554",
    ring: "#fbbf24",
    fg: "#f8fafc",
    accent: "#fbbf24",
    motif: "shield",
  },
  Energy: {
    bg1: "#1c1917",
    bg2: "#451a03",
    ring: "#f97316",
    fg: "#fffbeb",
    accent: "#facc15",
    motif: "bolt",
  },
  Healthcare: {
    bg1: "#042f2e",
    bg2: "#0f172a",
    ring: "#2dd4bf",
    fg: "#f0fdfa",
    accent: "#38bdf8",
    motif: "cross",
  },
  Manufacturing: {
    bg1: "#18181b",
    bg2: "#27272a",
    ring: "#f59e0b",
    fg: "#fafafa",
    accent: "#fbbf24",
    motif: "gear",
  },
  "Consumer Goods": {
    bg1: "#2e1065",
    bg2: "#1e1b4b",
    ring: "#f472b6",
    fg: "#fdf2f8",
    accent: "#facc15",
    motif: "crown",
  },
  Retail: {
    bg1: "#1e1b4b",
    bg2: "#31102f",
    ring: "#fb923c",
    fg: "#fff7ed",
    accent: "#facc15",
    motif: "cart",
  },
  Transportation: {
    bg1: "#0f172a",
    bg2: "#1e293b",
    ring: "#ef4444",
    fg: "#f8fafc",
    accent: "#38bdf8",
    motif: "wing",
  },
  "Real Estate": {
    bg1: "#064e3b",
    bg2: "#0f172a",
    ring: "#34d399",
    fg: "#ecfdf5",
    accent: "#fbbf24",
    motif: "tower",
  },
  Mining: {
    bg1: "#27170a",
    bg2: "#1c1917",
    ring: "#d97706",
    fg: "#fef3c7",
    accent: "#f59e0b",
    motif: "gem",
  },
  Entertainment: {
    bg1: "#2a0815",
    bg2: "#09090b",
    ring: "#e11d48",
    fg: "#fff1f2",
    accent: "#38bdf8",
    motif: "play",
  },
  Utilities: {
    bg1: "#0c4a6e",
    bg2: "#0f172a",
    ring: "#38bdf8",
    fg: "#f0f9ff",
    accent: "#4ade80",
    motif: "grid",
  },
};

const STOCK_BRAND_THEMES: Record<string, Partial<BrandTheme> & { svgCenter?: string }> = {
  // Technology
  NVDA: {
    bg1: "#0b1a06",
    bg2: "#111827",
    ring: "#76b900",
    accent: "#a3e635",
    svgCenter: `<path d="M28 52 C34 34, 62 32, 70 48 C62 62, 38 64, 32 52 C38 42, 56 42, 60 50 C55 56, 43 56, 40 50" fill="none" stroke="#76b900" stroke-width="4.5" stroke-linecap="round"/><circle cx="51" cy="50" r="4.5" fill="#a3e635"/>`,
  },
  MSFT: {
    bg1: "#0f172a",
    bg2: "#1e293b",
    ring: "#38bdf8",
    accent: "#f25022",
    svgCenter: `<rect x="33" y="33" width="15" height="15" rx="2" fill="#f25022"/><rect x="52" y="33" width="15" height="15" rx="2" fill="#7fba00"/><rect x="33" y="52" width="15" height="15" rx="2" fill="#00a4ef"/><rect x="52" y="52" width="15" height="15" rx="2" fill="#ffb900"/>`,
  },
  AAPL: {
    bg1: "#18181b",
    bg2: "#09090b",
    ring: "#e4e4e7",
    accent: "#a1a1aa",
    svgCenter: `<path d="M50 37 C44 37, 36 42, 36 52 C36 62, 43 69, 48 69 C50 69, 51 67, 53 67 C55 67, 56 69, 58 69 C63 69, 67 61, 67 55 C62 53, 61 46, 66 43 C63 39, 59 37, 55 37 C52 37, 51 38, 50 37 Z" fill="#f4f4f5"/><path d="M52 28 C56 28, 59 31, 58 35 C54 35, 51 32, 52 28 Z" fill="#a1a1aa"/>`,
  },
  META: {
    bg1: "#061b3a",
    bg2: "#0f172a",
    ring: "#0668E1",
    accent: "#38bdf8",
    svgCenter: `<path d="M31 55 C31 42, 41 38, 50 49 C59 60, 69 56, 69 45 C69 36, 59 36, 50 49 C41 62, 31 64, 31 55 Z" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>`,
  },
  GOOGL: {
    bg1: "#0f172a",
    bg2: "#1e293b",
    ring: "#4285F4",
    accent: "#FBBC05",
    svgCenter: `<path d="M65 50 H50 V56 H59 C57 61, 52 64, 47 63 C39 62, 35 55, 37 47 C38 40, 45 36, 52 38 C55 39, 57 40, 59 42 L64 37 C60 33, 55 31, 49 31 C38 31, 30 39, 30 50 C30 61, 38 69, 49 69 C59 69, 67 62, 67 50 Z" fill="#f8fafc"/><circle cx="35" cy="38" r="3" fill="#EA4335"/><circle cx="35" cy="62" r="3" fill="#FBBC05"/><circle cx="63" cy="62" r="3" fill="#34A853"/>`,
  },
  AVGO: {
    bg1: "#2a070f",
    bg2: "#111827",
    ring: "#CC092F",
    accent: "#fb7185",
    svgCenter: `<path d="M29 54 Q40 54 44 42 Q50 26 56 42 Q60 54 71 54" fill="none" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="59" r="4" fill="#CC092F"/>`,
  },
  CRM: {
    bg1: "#04283e",
    bg2: "#0f172a",
    ring: "#00A1E0",
    accent: "#7dd3fc",
    svgCenter: `<path d="M35 58 C29 58, 26 53, 29 48 C30 42, 36 39, 41 41 C45 35, 55 35, 59 41 C65 40, 71 45, 70 51 C73 55, 69 60, 63 60 H35 Z" fill="#00A1E0"/><text x="50" y="54" font-family="sans-serif" font-weight="900" font-size="11" fill="#fff" text-anchor="middle">CRM</text>`,
  },
  ORCL: {
    bg1: "#2e0906",
    bg2: "#18181b",
    ring: "#C74634",
    accent: "#f87171",
    svgCenter: `<rect x="30" y="39" width="40" height="22" rx="11" fill="none" stroke="#ef4444" stroke-width="5.5"/>`,
  },
  AMD: {
    bg1: "#091914",
    bg2: "#09090b",
    ring: "#10b981",
    accent: "#34d399",
    svgCenter: `<path d="M34 34 H66 V66 L56 56 V44 H44 Z" fill="#10b981"/><polygon points="34,47 45,58 34,66" fill="#34d399"/>`,
  },
  INTC: {
    bg1: "#061e3e",
    bg2: "#0f172a",
    ring: "#0068B5",
    accent: "#38bdf8",
    svgCenter: `<ellipse cx="50" cy="50" rx="22" ry="13" transform="rotate(-22 50 50)" fill="none" stroke="#38bdf8" stroke-width="3.5"/><rect x="43" y="43" width="14" height="14" rx="2" fill="#0068B5" stroke="#bae6fd" stroke-width="1.5"/>`,
  },

  // Finance
  BRK: { bg1: "#0c1938", bg2: "#090d16", ring: "#f59e0b", accent: "#fde68a", glyph: "BRK" },
  BLK: { bg1: "#09090b", bg2: "#18181b", ring: "#a1a1aa", accent: "#f4f4f5", glyph: "BLK" },
  MA: {
    bg1: "#1c1018",
    bg2: "#0f172a",
    ring: "#F79E1B",
    accent: "#EB001B",
    svgCenter: `<circle cx="43" cy="50" r="14" fill="#EB001B" opacity="0.9"/><circle cx="57" cy="50" r="14" fill="#F79E1B" opacity="0.88"/>`,
  },
  GS: { bg1: "#0d2238", bg2: "#0a1424", ring: "#7399C6", accent: "#bae6fd", glyph: "GS" },
  V: {
    bg1: "#0f1547",
    bg2: "#090d26",
    ring: "#fbbf24",
    accent: "#38bdf8",
    svgCenter: `<path d="M32 38 L44 64 L53 64 L66 38 H58 L49 56 L42 38 Z" fill="#f8fafc"/><path d="M30 38 H41 L43 44 L30 40 Z" fill="#fbbf24"/>`,
  },
  JPM: {
    bg1: "#081c33",
    bg2: "#0f172a",
    ring: "#38bdf8",
    accent: "#93c5fd",
    svgCenter: `<polygon points="50,29 65,37 65,63 50,71 35,63 35,37" fill="none" stroke="#60a5fa" stroke-width="3.5"/><text x="50" y="54" font-family="sans-serif" font-weight="900" font-size="13" fill="#f8fafc" text-anchor="middle">JPM</text>`,
  },
  MS: { bg1: "#0b1e36", bg2: "#090d16", ring: "#38bdf8", accent: "#e2e8f0", glyph: "MS" },
  BAC: {
    bg1: "#0a1936",
    bg2: "#240a12",
    ring: "#ef4444",
    accent: "#60a5fa",
    svgCenter: `<path d="M32 42 Q50 34 68 42 M32 50 Q50 42 68 50 M32 58 Q50 50 68 58" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/><path d="M32 46 Q46 39 58 45" fill="none" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>`,
  },

  // Energy
  FSLR: { bg1: "#291504", bg2: "#0f172a", ring: "#facc15", accent: "#fb923c", glyph: "FSLR" },
  CVX: {
    bg1: "#081d38",
    bg2: "#260810",
    ring: "#38bdf8",
    accent: "#ef4444",
    svgCenter: `<polyline points="34,40 50,51 66,40" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><polyline points="34,53 50,64 66,53" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  XOM: { bg1: "#2d070c", bg2: "#111827", ring: "#ef4444", accent: "#fca5a5", glyph: "XOM" },
  COP: { bg1: "#240a0a", bg2: "#0f172a", ring: "#f97316", accent: "#fef08a", glyph: "COP" },
  SHEL: {
    bg1: "#331a00",
    bg2: "#2b0707",
    ring: "#facc15",
    accent: "#ef4444",
    svgCenter: `<path d="M32 58 C30 42, 40 31, 50 31 C60 31, 70 42, 68 58 L58 65 H42 Z" fill="#facc15" stroke="#ef4444" stroke-width="3.5"/><line x1="50" y1="33" x2="50" y2="63" stroke="#ef4444" stroke-width="2"/><line x1="41" y1="36" x2="45" y2="63" stroke="#ef4444" stroke-width="2"/><line x1="59" y1="36" x2="55" y2="63" stroke="#ef4444" stroke-width="2"/>`,
  },
  TTE: { bg1: "#1e1b4b", bg2: "#2b0912", ring: "#fb7185", accent: "#facc15", glyph: "TTE" },

  // Healthcare
  LLY: { bg1: "#2d080a", bg2: "#111827", ring: "#ef4444", accent: "#fecdd3", glyph: "LLY" },
  UNH: { bg1: "#07193d", bg2: "#0f172a", ring: "#3b82f6", accent: "#93c5fd", glyph: "UNH" },
  ABBV: { bg1: "#071d49", bg2: "#090d16", ring: "#38bdf8", accent: "#bae6fd", glyph: "ABBV" },
  JNJ: { bg1: "#2b0707", bg2: "#18181b", ring: "#ef4444", accent: "#fca5a5", glyph: "JNJ" },
  MRK: { bg1: "#042f2e", bg2: "#0f172a", ring: "#14b8a6", accent: "#99f6e4", glyph: "MRK" },
  PFE: { bg1: "#071952", bg2: "#0f172a", ring: "#38bdf8", accent: "#e0f2fe", glyph: "PFE" },

  // Manufacturing
  LMT: { bg1: "#071c38", bg2: "#090d16", ring: "#38bdf8", accent: "#f8fafc", glyph: "LMT" },
  DE: { bg1: "#0f2e15", bg2: "#141e12", ring: "#facc15", accent: "#4ade80", glyph: "DE" },
  CAT: {
    bg1: "#18181b",
    bg2: "#09090b",
    ring: "#FFCD11",
    accent: "#FFCD11",
    svgCenter: `<polygon points="50,50 37,65 63,65" fill="#FFCD11"/><text x="50" y="55" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">CAT</text>`,
  },
  HON: { bg1: "#290707", bg2: "#18181b", ring: "#ef4444", accent: "#fca5a5", glyph: "HON" },
  GE: { bg1: "#08203e", bg2: "#0f172a", ring: "#38bdf8", accent: "#f8fafc", glyph: "GE" },
  BA: { bg1: "#071e40", bg2: "#0f172a", ring: "#60a5fa", accent: "#f8fafc", glyph: "BA" },

  // Consumer Goods
  MC: { bg1: "#23190d", bg2: "#0c0a09", ring: "#d4af37", accent: "#fef08a", glyph: "LVMH" },
  PEP: { bg1: "#082047", bg2: "#260812", ring: "#ef4444", accent: "#38bdf8", glyph: "PEP" },
  PG: { bg1: "#071b47", bg2: "#0f172a", ring: "#60a5fa", accent: "#fde047", glyph: "P&G" },
  NKE: {
    bg1: "#18181b",
    bg2: "#09090b",
    ring: "#f97316",
    accent: "#ffffff",
    svgCenter: `<path d="M36 44 C31 53, 36 60, 46 56 L70 43 C54 58, 39 66, 32 58 C28 53, 31 46, 36 44 Z" fill="#ffffff"/>`,
  },
  KO: { bg1: "#330508", bg2: "#180406", ring: "#f43f5e", accent: "#ffffff", glyph: "KO" },
  UL: { bg1: "#0a1c4e", bg2: "#0f172a", ring: "#38bdf8", accent: "#bae6fd", glyph: "UL" },

  // Retail
  COST: { bg1: "#290810", bg2: "#081c38", ring: "#ef4444", accent: "#60a5fa", glyph: "COST" },
  HD: { bg1: "#331404", bg2: "#1c0d06", ring: "#f97316", accent: "#fed7aa", glyph: "HD" },
  MCD: {
    bg1: "#2e0608",
    bg2: "#1c0506",
    ring: "#facc15",
    accent: "#ef4444",
    svgCenter: `<path d="M33 63 V46 C33 36, 46 36, 48 48 V60 M52 60 V48 C54 36, 67 36, 67 46 V63" fill="none" stroke="#facc15" stroke-width="5.5" stroke-linecap="round"/>`,
  },
  AMZN: {
    bg1: "#131921",
    bg2: "#090d14",
    ring: "#FF9900",
    accent: "#FF9900",
    svgCenter: `<text x="50" y="51" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">a</text><path d="M33 58 Q50 67 66 57 M62 54 L67 57 L64 62" fill="none" stroke="#FF9900" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  TGT: {
    bg1: "#2e0507",
    bg2: "#180405",
    ring: "#ef4444",
    accent: "#ffffff",
    svgCenter: `<circle cx="50" cy="50" r="16" fill="none" stroke="#ef4444" stroke-width="5"/><circle cx="50" cy="50" r="6" fill="#ef4444"/>`,
  },
  WMT: {
    bg1: "#042347",
    bg2: "#08162b",
    ring: "#FFC220",
    accent: "#38bdf8",
    svgCenter: `<g stroke="#FFC220" stroke-width="4.5" stroke-linecap="round"><line x1="50" y1="30" x2="50" y2="39"/><line x1="50" y1="61" x2="50" y2="70"/><line x1="33" y1="40" x2="41" y2="45"/><line x1="59" y1="55" x2="67" y2="60"/><line x1="67" y1="40" x2="59" y2="45"/><line x1="41" y1="55" x2="33" y2="60"/></g>`,
  },

  // Transportation
  TSLA: {
    bg1: "#2b0609",
    bg2: "#0f172a",
    ring: "#E82127",
    accent: "#f8fafc",
    svgCenter: `<path d="M32 36 Q50 31 68 36 M35 41 Q50 37 65 41 L54 44 L50 66 L46 44 Z" fill="#f8fafc" stroke="#E82127" stroke-width="1"/>`,
  },
  UNP: { bg1: "#081c3d", bg2: "#26080c", ring: "#ef4444", accent: "#facc15", glyph: "UNP" },
  UPS: { bg1: "#261509", bg2: "#140b05", ring: "#facc15", accent: "#fde047", glyph: "UPS" },
  UBER: { bg1: "#09090b", bg2: "#18181b", ring: "#e4e4e7", accent: "#38bdf8", glyph: "UBER" },
  DAL: {
    bg1: "#071833",
    bg2: "#1e0810",
    ring: "#E01933",
    accent: "#38bdf8",
    svgCenter: `<polygon points="50,31 68,63 50,55 32,63" fill="#E01933"/><polygon points="50,39 61,59 50,54" fill="#991b1b"/>`,
  },

  // Real Estate
  AMT: { bg1: "#071f40", bg2: "#0f172a", ring: "#38bdf8", accent: "#93c5fd", glyph: "AMT" },
  SPG: { bg1: "#2b0918", bg2: "#0f172a", ring: "#f43f5e", accent: "#fde047", glyph: "SPG" },
  PLD: { bg1: "#042f2e", bg2: "#09191c", ring: "#2dd4bf", accent: "#a7f3d0", glyph: "PLD" },

  // Mining
  RIO: { bg1: "#2b080a", bg2: "#18181b", ring: "#ef4444", accent: "#fca5a5", glyph: "RIO" },
  BHP: { bg1: "#2e1205", bg2: "#18181b", ring: "#f97316", accent: "#fdba74", glyph: "BHP" },
  NEM: { bg1: "#241c06", bg2: "#0f172a", ring: "#facc15", accent: "#fef08a", glyph: "NEM" },

  // Entertainment
  NFLX: {
    bg1: "#140406",
    bg2: "#09090b",
    ring: "#E50914",
    accent: "#f87171",
    svgCenter: `<path d="M39 33 V67 M61 33 V67 M39 33 L61 67" fill="none" stroke="#E50914" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  DIS: { bg1: "#061c47", bg2: "#0f172a", ring: "#38bdf8", accent: "#fde047", glyph: "DIS" },
  SONY: { bg1: "#090d16", bg2: "#1e1b4b", ring: "#818cf8", accent: "#f8fafc", glyph: "SONY" },

  // Utilities
  DUK: { bg1: "#06263d", bg2: "#0f172a", ring: "#38bdf8", accent: "#4ade80", glyph: "DUK" },
  SO: { bg1: "#091c38", bg2: "#1e080c", ring: "#ef4444", accent: "#60a5fa", glyph: "SO" },
  NEE: { bg1: "#052e2b", bg2: "#0c2540", ring: "#34d399", accent: "#38bdf8", glyph: "NEE" },
};

const STOCK_LOGO_CACHE: Record<string, string> = {};

/**
 * Generates a custom SVG company logo texture designed specifically for circular zoomed display frames.
 * Center coordinates (50,50) within r <= 34 fill the circular lens cleanly at 1.25x-1.3x zoom.
 */
export function stockLogo(ticker: string, sector = "Technology"): string {
  const key = `${ticker}:${sector}`;
  if (STOCK_LOGO_CACHE[key]) return STOCK_LOGO_CACHE[key]!;

  const base = SECTOR_DEFAULT_THEME[sector] ?? SECTOR_DEFAULT_THEME.Technology!;
  const custom = STOCK_BRAND_THEMES[ticker] ?? {};
  const bg1 = custom.bg1 ?? base.bg1;
  const bg2 = custom.bg2 ?? base.bg2;
  const ring = custom.ring ?? base.ring;
  const fg = custom.fg ?? base.fg;
  const accent = custom.accent ?? base.accent;
  const label = custom.glyph ?? ticker.slice(0, 4);
  const fontSize = label.length >= 4 ? 12.5 : label.length === 3 ? 14.5 : 17;

  const centerMarkup =
    custom.svgCenter ??
    `<circle cx="50" cy="50" r="22" fill="${bg2}" stroke="${accent}" stroke-width="1.8" opacity="0.9"/>
     <text x="50" y="${50 + fontSize * 0.35}" font-family="sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="0.5" fill="${fg}" text-anchor="middle">${label}</text>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="sbg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </radialGradient>
        <linearGradient id="sring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${ring}"/>
          <stop offset="100%" stop-color="${accent}"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#sbg)"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="url(#sring)" stroke-width="2.5" opacity="0.55"/>
      <circle cx="50" cy="50" r="30" fill="${bg1}" stroke="${ring}" stroke-width="1.5" opacity="0.85"/>
      <path d="M 26 38 A 28 28 0 0 1 74 38" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.18"/>
      ${centerMarkup}
    </svg>
  `;
  const encoded = encodeSvg(svg);
  STOCK_LOGO_CACHE[key] = encoded;
  return encoded;
}

export function stockIcon(sectorOrTicker: string, sector?: string): string {
  if (STOCK_BRAND_THEMES[sectorOrTicker] || /^[A-Z]{1,5}$/.test(sectorOrTicker)) {
    return stockLogo(sectorOrTicker, sector ?? "Technology");
  }
  return stockLogo(sectorOrTicker.slice(0, 4).toUpperCase(), sectorOrTicker);
}

// ------------------------------------------------------------ 45 Real-Life Cryptocurrency Circular Zoomed Logos

const CRYPTO_THEMES: Record<
  string,
  { bg1: string; bg2: string; ring: string; accent: string; svgCenter?: string }
> = {
  BTC: {
    bg1: "#f7931a",
    bg2: "#b45309",
    ring: "#fde68a",
    accent: "#ffffff",
    svgCenter: `<text x="50" y="58" transform="rotate(10 50 50)" font-family="sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">₿</text>`,
  },
  ETH: {
    bg1: "#312e81",
    bg2: "#1e1b4b",
    ring: "#818cf8",
    accent: "#c7d2fe",
    svgCenter: `<polygon points="50,28 63,50 50,57 37,50" fill="#c7d2fe"/><polygon points="50,28 63,50 50,57" fill="#818cf8"/><polygon points="50,60 63,53 50,72 37,53" fill="#a5b4fc"/>`,
  },
  MKR: {
    bg1: "#0f3d39",
    bg2: "#042f2e",
    ring: "#1aab9b",
    accent: "#5eead4",
    svgCenter: `<path d="M33 61 V39 L46 49 V61 M67 61 V39 L54 49 V61" fill="none" stroke="#5eead4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  BNB: {
    bg1: "#291d06",
    bg2: "#09090b",
    ring: "#F3BA2F",
    accent: "#fde047",
    svgCenter: `<polygon points="50,31 59,40 55,44 50,39 45,44 41,40" fill="#F3BA2F"/><polygon points="50,69 59,60 55,56 50,61 45,56 41,60" fill="#F3BA2F"/><rect x="46.5" y="46.5" width="7" height="7" transform="rotate(45 50 50)" fill="#F3BA2F"/><rect x="35" y="46.5" width="6" height="6" transform="rotate(45 38 49.5)" fill="#F3BA2F"/><rect x="59" y="46.5" width="6" height="6" transform="rotate(45 62 49.5)" fill="#F3BA2F"/>`,
  },
  TAO: {
    bg1: "#18181b",
    bg2: "#09090b",
    ring: "#e4e4e7",
    accent: "#a1a1aa",
    svgCenter: `<text x="50" y="58" font-family="serif" font-weight="900" font-size="28" fill="#f4f4f5" text-anchor="middle">τ</text>`,
  },
  BCH: {
    bg1: "#064e3b",
    bg2: "#052e16",
    ring: "#0AC18E",
    accent: "#6ee7b7",
    svgCenter: `<text x="50" y="58" transform="rotate(-8 50 50)" font-family="sans-serif" font-weight="900" font-size="25" fill="#ffffff" text-anchor="middle">₿</text>`,
  },
  XMR: {
    bg1: "#ff6600",
    bg2: "#1f2937",
    ring: "#fdba74",
    accent: "#ffffff",
    svgCenter: `<path d="M31 58 H39 V43 L50 54 L61 43 V58 H69" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linejoin="round"/>`,
  },
  SOL: {
    bg1: "#1e1b4b",
    bg2: "#09090b",
    ring: "#14F195",
    accent: "#9945FF",
    svgCenter: `<polygon points="35,37 68,37 63,43 30,43" fill="#14F195"/><polygon points="30,47 63,47 68,53 35,53" fill="#38bdf8"/><polygon points="35,57 68,57 63,63 30,63" fill="#9945FF"/>`,
  },
  AAVE: { bg1: "#2e1065", bg2: "#0c4a6e", ring: "#2EBAC6", accent: "#B6509E" },
  LTC: {
    bg1: "#1e3a8a",
    bg2: "#0f172a",
    ring: "#93c5fd",
    accent: "#ffffff",
    svgCenter: `<path d="M46 34 L41 62 H61 M36 50 L54 45" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  QNT: { bg1: "#090d16", bg2: "#1e293b", ring: "#38bdf8", accent: "#f43f5e" },
  COMP: { bg1: "#022c22", bg2: "#090d16", ring: "#00D395", accent: "#6ee7b7" },
  EGLD: { bg1: "#042f2e", bg2: "#09090b", ring: "#23F7DD", accent: "#ccfbf1" },
  AVAX: {
    bg1: "#991b1b",
    bg2: "#450a0a",
    ring: "#f87171",
    accent: "#ffffff",
    svgCenter: `<polygon points="48,32 33,61 43,61 53,42" fill="#ffffff"/><polygon points="58,48 51,61 65,61" fill="#ffffff"/>`,
  },
  INJ: { bg1: "#083344", bg2: "#0f172a", ring: "#00F2FE", accent: "#38bdf8" },
  LINK: {
    bg1: "#172554",
    bg2: "#0f172a",
    ring: "#3b82f6",
    accent: "#93c5fd",
    svgCenter: `<polygon points="50,31 66,40 66,60 50,69 34,60 34,40" fill="none" stroke="#60a5fa" stroke-width="5.5"/>`,
  },
  ICP: { bg1: "#1e1b4b", bg2: "#31102f", ring: "#f43f5e", accent: "#38bdf8" },
  UNI: { bg1: "#500724", bg2: "#1f0514", ring: "#FF007A", accent: "#f472b6" },
  RNDR: { bg1: "#3b0718", bg2: "#09090b", ring: "#E91E63", accent: "#fb7185" },
  FIL: { bg1: "#032b44", bg2: "#0f172a", ring: "#0090FF", accent: "#7dd3fc" },
  NEAR: { bg1: "#09090b", bg2: "#18181b", ring: "#34d399", accent: "#ffffff" },
  ATOM: {
    bg1: "#1e1b4b",
    bg2: "#09090b",
    ring: "#818cf8",
    accent: "#e0e7ff",
    svgCenter: `<ellipse cx="50" cy="50" rx="21" ry="8" transform="rotate(30 50 50)" fill="none" stroke="#a5b4fc" stroke-width="2"/><ellipse cx="50" cy="50" rx="21" ry="8" transform="rotate(-30 50 50)" fill="none" stroke="#a5b4fc" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#e0e7ff"/>`,
  },
  TON: {
    bg1: "#032b44",
    bg2: "#082f49",
    ring: "#0098EA",
    accent: "#ffffff",
    svgCenter: `<polygon points="33,36 67,36 50,67" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linejoin="round"/><line x1="50" y1="36" x2="50" y2="66" stroke="#38bdf8" stroke-width="3.5"/>`,
  },
  DOT: {
    bg1: "#3b0722",
    bg2: "#09090b",
    ring: "#E6007A",
    accent: "#f472b6",
    svgCenter: `<circle cx="50" cy="33" r="4.5" fill="#E6007A"/><circle cx="50" cy="67" r="4.5" fill="#E6007A"/><circle cx="35" cy="41" r="4.5" fill="#E6007A"/><circle cx="65" cy="41" r="4.5" fill="#E6007A"/><circle cx="35" cy="59" r="4.5" fill="#E6007A"/><circle cx="65" cy="59" r="4.5" fill="#E6007A"/>`,
  },
  SUI: { bg1: "#082f49", bg2: "#0f172a", ring: "#4DA2FF", accent: "#bae6fd" },
  APT: { bg1: "#09090b", bg2: "#18181b", ring: "#2dd4bf", accent: "#f8fafc" },
  OP: { bg1: "#450a0a", bg2: "#180405", ring: "#FF0420", accent: "#ffffff" },
  XRP: {
    bg1: "#090d16",
    bg2: "#1e293b",
    ring: "#38bdf8",
    accent: "#f8fafc",
    svgCenter: `<path d="M34 35 L46 47 Q50 51 54 47 L66 35 M34 65 L46 53 Q50 49 54 53 L66 65" fill="none" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round"/>`,
  },
  XTZ: { bg1: "#0d2558", bg2: "#090d16", ring: "#2C7DF7", accent: "#93c5fd" },
  USDT: {
    bg1: "#064e3b",
    bg2: "#022c22",
    ring: "#26A17B",
    accent: "#ffffff",
    svgCenter: `<path d="M35 37 H65 M50 37 V66" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><ellipse cx="50" cy="48" rx="18" ry="5" fill="none" stroke="#6ee7b7" stroke-width="2.5"/>`,
  },
  STX: { bg1: "#1e1b4b", bg2: "#09090b", ring: "#5546FF", accent: "#a5b4fc" },
  ARB: { bg1: "#08203e", bg2: "#0f172a", ring: "#28A0F0", accent: "#ffffff" },
  WLD: { bg1: "#09090b", bg2: "#18181b", ring: "#e4e4e7", accent: "#38bdf8" },
  ADA: {
    bg1: "#071c4d",
    bg2: "#090d16",
    ring: "#3b82f6",
    accent: "#93c5fd",
    svgCenter: `<circle cx="50" cy="50" r="5" fill="#60a5fa"/><circle cx="50" cy="34" r="3" fill="#93c5fd"/><circle cx="50" cy="66" r="3" fill="#93c5fd"/><circle cx="36" cy="42" r="3" fill="#93c5fd"/><circle cx="64" cy="42" r="3" fill="#93c5fd"/><circle cx="36" cy="58" r="3" fill="#93c5fd"/><circle cx="64" cy="58" r="3" fill="#93c5fd"/>`,
  },
  POL: { bg1: "#2e1065", bg2: "#0f172a", ring: "#8247E5", accent: "#c4b5fd" },
  XLM: { bg1: "#09152b", bg2: "#09090b", ring: "#38bdf8", accent: "#f8fafc" },
  ALGO: { bg1: "#09090b", bg2: "#042f2e", ring: "#2dd4bf", accent: "#f8fafc" },
  TRX: { bg1: "#3b0509", bg2: "#09090b", ring: "#FF0013", accent: "#fca5a5" },
  DOGE: {
    bg1: "#713f12",
    bg2: "#3f2209",
    ring: "#facc15",
    accent: "#fef08a",
    svgCenter: `<text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="25" fill="#fef08a" text-anchor="middle">Ð</text>`,
  },
  GRT: { bg1: "#1e1b4b", bg2: "#09090b", ring: "#6747ED", accent: "#a5b4fc" },
  HBAR: {
    bg1: "#09090b",
    bg2: "#18181b",
    ring: "#e4e4e7",
    accent: "#a1a1aa",
    svgCenter: `<path d="M38 33 V67 M62 33 V67 M38 45 H62 M38 55 H62" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>`,
  },
  VET: { bg1: "#08203e", bg2: "#1e1b4b", ring: "#38bdf8", accent: "#a78bfa" },
  GALA: { bg1: "#18181b", bg2: "#09090b", ring: "#f59e0b", accent: "#fde68a" },
  BONK: { bg1: "#451a03", bg2: "#1c0a00", ring: "#f97316", accent: "#fde047" },
  SHIB: {
    bg1: "#450a0a",
    bg2: "#2a0800",
    ring: "#f97316",
    accent: "#facc15",
    svgCenter: `<polygon points="34,34 43,40 50,36 57,40 66,34 63,56 50,67 37,56" fill="#f97316" stroke="#fde047" stroke-width="2"/><circle cx="44" cy="49" r="2.2" fill="#fff"/><circle cx="56" cy="49" r="2.2" fill="#fff"/>`,
  },
};

const CRYPTO_LOGO_CACHE: Record<string, string> = {};

/**
 * Generates a custom SVG cryptocurrency token texture designed for circular zoomed display frames.
 */
export function cryptoLogo(symbol: string): string {
  const sym = symbol.toUpperCase();
  if (CRYPTO_LOGO_CACHE[sym]) return CRYPTO_LOGO_CACHE[sym]!;

  const theme = CRYPTO_THEMES[sym] ?? {
    bg1: "#1e1b4b",
    bg2: "#0f172a",
    ring: "#a78bfa",
    accent: "#38bdf8",
  };
  const label = sym.slice(0, 4);
  const fontSize = label.length >= 4 ? 12.5 : label.length === 3 ? 14.5 : 17;

  const centerMarkup =
    theme.svgCenter ??
    `<polygon points="50,28 69,39 69,61 50,72 31,61 31,39" fill="${theme.bg2}" stroke="${theme.accent}" stroke-width="1.8" opacity="0.9"/>
     <text x="50" y="${50 + fontSize * 0.35}" font-family="sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff" text-anchor="middle">${label}</text>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="cbg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${theme.bg1}"/>
          <stop offset="100%" stop-color="${theme.bg2}"/>
        </radialGradient>
        <linearGradient id="cring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.ring}"/>
          <stop offset="100%" stop-color="${theme.accent}"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cbg)"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="url(#cring)" stroke-width="3" stroke-dasharray="6 3" opacity="0.7"/>
      <circle cx="50" cy="50" r="30" fill="${theme.bg1}" stroke="${theme.ring}" stroke-width="2" opacity="0.92"/>
      <path d="M 27 37 A 27 27 0 0 1 73 37" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.22"/>
      ${centerMarkup}
    </svg>
  `;
  const encoded = encodeSvg(svg);
  CRYPTO_LOGO_CACHE[sym] = encoded;
  return encoded;
}

// ------------------------------------------------------------ Custom Collectible Category & 120 Item Textures

const ITEM_LIVERY_PALETTES: [primary: string, secondary: string, glow: string, bg: string][] = [
  ["#ef4444", "#fca5a5", "#f87171", "#1f090d"],
  ["#3b82f6", "#93c5fd", "#60a5fa", "#08162b"],
  ["#10b981", "#6ee7b7", "#34d399", "#052018"],
  ["#f59e0b", "#fde68a", "#fbbf24", "#241705"],
  ["#8b5cf6", "#ddd6fe", "#a78bfa", "#170d2b"],
  ["#ec4899", "#fbcfe8", "#f472b6", "#26081a"],
  ["#06b6d4", "#a5f3fc", "#22d3ee", "#062028"],
  ["#eab308", "#fef08a", "#facc15", "#211c05"],
  ["#f97316", "#fed7aa", "#fb923c", "#261105"],
  ["#14b8a6", "#99f6e4", "#2dd4bf", "#042220"],
  ["#6366f1", "#c7d2fe", "#818cf8", "#0e102e"],
  ["#e11d48", "#fecdd3", "#fb7185", "#290610"],
  ["#84cc16", "#d9f99d", "#a3e635", "#142105"],
  ["#a855f7", "#f3e8ff", "#c084fc", "#1f0933"],
  ["#0ea5e9", "#bae6fd", "#38bdf8", "#071c2c"],
  ["#d4af37", "#fef9c3", "#fde047", "#1f1907"],
];

function renderCollectibleSubject(
  category: string,
  sub: string,
  p1: string,
  p2: string,
  glow: string,
  idx: number,
): string {
  switch (category) {
    case "vehicles": {
      if (sub === "Classic") {
        return `
          <path d="M16 64 Q22 48 34 48 L46 38 H66 L76 48 Q86 50 86 64 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <path d="M46 40 H64 L71 48 H40 Z" fill="#0f172a" opacity="0.8"/>
          <circle cx="30" cy="64" r="9" fill="#18181b" stroke="#f8fafc" stroke-width="3"/>
          <circle cx="72" cy="64" r="9" fill="#18181b" stroke="#f8fafc" stroke-width="3"/>
          <circle cx="30" cy="64" r="3.5" fill="${p2}"/>
          <circle cx="72" cy="64" r="3.5" fill="${p2}"/>
        `;
      }
      if (sub === "SUV") {
        return `
          <rect x="24" y="34" width="44" height="3" rx="1.5" fill="${p2}"/>
          <path d="M16 62 V46 L26 37 H70 L82 47 V62 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <rect x="29" y="40" width="17" height="10" rx="2" fill="#0f172a"/>
          <rect x="50" y="40" width="18" height="10" rx="2" fill="#0f172a"/>
          <circle cx="30" cy="64" r="9.5" fill="#09090b" stroke="${p2}" stroke-width="2.5"/>
          <circle cx="70" cy="64" r="9.5" fill="#09090b" stroke="${p2}" stroke-width="2.5"/>
        `;
      }
      if (sub === "Supercar") {
        return `
          <path d="M12 61 L26 44 L52 38 L86 51 L88 61 Z" fill="${p1}" stroke="${glow}" stroke-width="2"/>
          <polygon points="32,45 52,40 68,48 38,49" fill="#090d16"/>
          <path d="M12 46 L20 46 L18 53" fill="none" stroke="${p2}" stroke-width="2.5"/>
          <circle cx="29" cy="62" r="8.5" fill="#09090b" stroke="${p2}" stroke-width="2.5"/>
          <circle cx="73" cy="62" r="8.5" fill="#09090b" stroke="${p2}" stroke-width="2.5"/>
        `;
      }
      // Sports car
      return `
        <path d="M14 61 L24 47 L42 39 H64 L84 50 L86 61 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
        <path d="M38 42 H61 L72 49 H31 Z" fill="#0f172a"/>
        <line x1="20" y1="54" x2="80" y2="54" stroke="${p2}" stroke-width="2" opacity="0.8"/>
        <circle cx="29" cy="62" r="8.5" fill="#18181b" stroke="${p2}" stroke-width="2.5"/>
        <circle cx="72" cy="62" r="8.5" fill="#18181b" stroke="${p2}" stroke-width="2.5"/>
      `;
    }
    case "watches": {
      const isChrono = sub === "Chronograph";
      const isTourb = sub === "Tourbillon";
      const isDiver = sub === "Diver";
      return `
        <rect x="41" y="12" width="18" height="76" rx="4" fill="${isDiver ? "#334155" : "#451a03"}" stroke="${p2}" stroke-width="1.5"/>
        <circle cx="50" cy="50" r="24" fill="#090d16" stroke="${p1}" stroke-width="${isDiver ? 5 : 3.5}"/>
        <circle cx="50" cy="50" r="19" fill="none" stroke="${p2}" stroke-width="1" stroke-dasharray="2 4"/>
        ${isChrono ? `<circle cx="42" cy="50" r="4.5" fill="none" stroke="${p2}" stroke-width="1.5"/><circle cx="58" cy="50" r="4.5" fill="none" stroke="${p2}" stroke-width="1.5"/>` : ""}
        ${isTourb ? `<circle cx="50" cy="60" r="5.5" fill="#1e293b" stroke="${glow}" stroke-width="1.8"/><path d="M46 60 H54 M50 56 V64" stroke="${p2}" stroke-width="1.2"/>` : ""}
        <line x1="50" y1="50" x2="50" y2="35" stroke="${p2}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="50" x2="62" y2="50" stroke="${glow}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="2.5" fill="${p2}"/>
      `;
    }
    case "paintings": {
      return `
        <rect x="18" y="20" width="64" height="56" rx="4" fill="#78350f" stroke="#facc15" stroke-width="3"/>
        <rect x="24" y="26" width="52" height="44" rx="2" fill="#0f172a"/>
        ${
          sub === "Modern" || sub === "Abstract"
            ? `<circle cx="42" cy="44" r="12" fill="${p1}" opacity="0.85"/><rect x="46" y="34" width="22" height="24" rx="3" fill="${glow}" opacity="0.75"/><path d="M26 62 Q50 30 74 58" fill="none" stroke="${p2}" stroke-width="3.5"/>`
            : `<circle cx="62" cy="38" r="6" fill="#fde047"/><path d="M24 62 L38 42 L52 56 L62 46 L76 62 V70 H24 Z" fill="${p1}"/><path d="M24 65 Q50 58 76 65 V70 H24 Z" fill="${glow}" opacity="0.7"/>`
        }
      `;
    }
    case "jewelry": {
      if (sub === "Tiara") {
        return `
          <path d="M20 64 Q50 54 80 64 L74 40 L61 52 L50 28 L39 52 L26 40 Z" fill="${p1}" stroke="${p2}" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="50,34 55,44 50,52 45,44" fill="${p2}"/>
          <circle cx="36" cy="52" r="3" fill="#ffffff"/>
          <circle cx="64" cy="52" r="3" fill="#ffffff"/>
        `;
      }
      if (sub === "Necklace") {
        return `
          <path d="M26 24 C26 52, 74 52, 74 24" fill="none" stroke="${p2}" stroke-width="3" stroke-dasharray="3 2"/>
          <polygon points="50,44 61,58 50,74 39,58" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <polygon points="50,48 56,58 50,68 44,58" fill="${p2}" opacity="0.7"/>
        `;
      }
      // Ring
      return `
        <circle cx="50" cy="58" r="16" fill="none" stroke="#facc15" stroke-width="5"/>
        <polygon points="50,22 64,34 56,45 44,45 36,34" fill="${p1}" stroke="${p2}" stroke-width="2"/>
        <polyline points="36,34 64,34 50,45 36,34" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.75"/>
      `;
    }
    case "stamps": {
      const inv = sub === "Error print" ? `transform="rotate(180 50 48)"` : "";
      return `
        <rect x="24" y="18" width="52" height="60" fill="#fef3c7" stroke="${p1}" stroke-width="3" stroke-dasharray="3 3"/>
        <rect x="29" y="23" width="42" height="50" fill="${p1}" opacity="0.22" stroke="${p1}" stroke-width="1.5"/>
        <g ${inv}>
          ${
            sub === "Airmail"
              ? `<path d="M35 48 L65 42 L52 55 L46 49 Z" fill="${p2}" stroke="${glow}" stroke-width="1.5"/>`
              : `<circle cx="50" cy="46" r="11" fill="${p1}" stroke="${p2}" stroke-width="2"/><polygon points="50,38 54,48 46,48" fill="#fef08a"/>`
          }
        </g>
        <text x="62" y="33" font-family="monospace" font-weight="bold" font-size="8" fill="${p2}" text-anchor="end">${(idx + 1) * 10}¢</text>
      `;
    }
    case "antiques": {
      if (sub === "Clock") {
        return `
          <path d="M34 74 H66 L62 32 C62 22, 38 22, 38 32 Z" fill="#78350f" stroke="#facc15" stroke-width="2.5"/>
          <circle cx="50" cy="42" r="10" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
          <line x1="50" y1="42" x2="50" y2="35" stroke="#1c1917" stroke-width="2"/>
          <line x1="50" y1="42" x2="56" y2="42" stroke="#1c1917" stroke-width="1.5"/>
          <circle cx="50" cy="62" r="4.5" fill="#facc15"/>
        `;
      }
      if (sub === "Furniture") {
        return `
          <path d="M30 48 Q50 24 70 48 Z" fill="${p1}" stroke="#facc15" stroke-width="2.5"/>
          <rect x="24" y="48" width="52" height="10" rx="3" fill="#78350f" stroke="#facc15" stroke-width="2"/>
          <path d="M28 58 Q26 70 32 74 M72 58 Q74 70 68 74" fill="none" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
        `;
      }
      // Porcelain vase
      return `
        <path d="M40 24 H60 L56 34 C68 44, 66 64, 58 74 H42 C34 64, 32 44, 44 34 Z" fill="${p1}" stroke="${p2}" stroke-width="2.2"/>
        <path d="M38 50 Q50 42 62 50 M39 58 Q50 66 61 58" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.85"/>
      `;
    }
    case "nfts": {
      if (sub === "Pixel art") {
        return `
          <g shape-rendering="crispEdges">
            <rect x="32" y="26" width="36" height="38" fill="${p1}"/>
            <rect x="28" y="34" width="44" height="10" fill="${p2}"/>
            <rect x="36" y="36" width="10" height="6" fill="#09090b"/>
            <rect x="54" y="36" width="10" height="6" fill="#09090b"/>
            <rect x="42" y="54" width="16" height="4" fill="#ffffff"/>
            <rect x="38" y="64" width="24" height="10" fill="${glow}"/>
          </g>
        `;
      }
      if (sub === "3D") {
        return `
          <polygon points="50,22 74,36 74,60 50,74 26,60 26,36" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <polygon points="50,22 74,36 50,48 26,36" fill="${p2}" opacity="0.75"/>
          <polygon points="50,48 74,36 74,60 50,74" fill="${glow}" opacity="0.65"/>
        `;
      }
      // Generative
      return `
        <circle cx="50" cy="48" r="22" fill="none" stroke="${p1}" stroke-width="2.5"/>
        <ellipse cx="50" cy="48" rx="22" ry="9" transform="rotate(45 50 48)" fill="none" stroke="${p2}" stroke-width="2"/>
        <ellipse cx="50" cy="48" rx="22" ry="9" transform="rotate(-45 50 48)" fill="none" stroke="${glow}" stroke-width="2"/>
        <polygon points="50,32 64,56 36,56" fill="none" stroke="#ffffff" stroke-width="2"/>
      `;
    }
    case "aircraft": {
      if (sub === "Helicopter") {
        return `
          <line x1="16" y1="30" x2="84" y2="30" stroke="${p2}" stroke-width="3" stroke-linecap="round"/>
          <line x1="50" y1="30" x2="50" y2="38" stroke="${p2}" stroke-width="3"/>
          <path d="M28 50 C28 38, 62 36, 68 48 C62 58, 34 58, 28 50 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <path d="M66 47 L86 43 L88 36" fill="none" stroke="${p1}" stroke-width="4" stroke-linecap="round"/>
          <path d="M34 64 H62 M40 56 V64 M56 56 V64" stroke="${p2}" stroke-width="2.5" stroke-linecap="round"/>
        `;
      }
      // Light jet / Business jet
      return `
        <path d="M16 54 L46 44 L84 30 L72 52 L84 66 L54 56 L26 64 Z" fill="${p1}" stroke="${p2}" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="48,45 68,37 60,49" fill="#e0f2fe"/>
        <line x1="22" y1="58" x2="66" y2="43" stroke="${glow}" stroke-width="2.5"/>
      `;
    }
    case "yachts":
    default: {
      if (sub === "Sailing yacht") {
        return `
          <polygon points="48,18 48,54 24,54" fill="${p2}" opacity="0.92"/>
          <polygon points="52,22 74,54 52,54" fill="${p1}" opacity="0.9"/>
          <path d="M18 58 H82 L72 68 H28 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
          <path d="M14 72 Q32 67 50 72 T86 72" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
        `;
      }
      // Motor yacht / Superyacht
      return `
        <path d="M24 52 L36 40 H66 L74 52 Z" fill="#f8fafc" stroke="${p2}" stroke-width="1.5"/>
        <rect x="40" y="34" width="20" height="6" rx="2" fill="${p2}"/>
        <path d="M14 52 H86 L74 66 H24 Z" fill="${p1}" stroke="${p2}" stroke-width="2"/>
        <path d="M12 72 Q30 67 50 72 T88 72" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
      `;
    }
  }
}

const COLLECTIBLE_TEXTURE_CACHE: Record<string, string> = {};

/**
 * Generates a custom SVG texture for each of the 9 Asset Categories.
 */
export function collectibleCategoryTexture(category: string): string {
  const key = `cat:${category}`;
  if (COLLECTIBLE_TEXTURE_CACHE[key]) return COLLECTIBLE_TEXTURE_CACHE[key]!;

  const catPalettes: Record<string, [string, string, string, string, string]> = {
    vehicles: ["#ef4444", "#fca5a5", "#f87171", "#1f080c", "Supercar"],
    watches: ["#f59e0b", "#fef08a", "#fbbf24", "#211605", "Tourbillon"],
    paintings: ["#8b5cf6", "#ddd6fe", "#a78bfa", "#160d29", "Impressionist"],
    jewelry: ["#06b6d4", "#cffafe", "#38bdf8", "#051e26", "Tiara"],
    stamps: ["#10b981", "#a7f3d0", "#34d399", "#052118", "Victorian"],
    antiques: ["#d97706", "#fde68a", "#f59e0b", "#241404", "Porcelain"],
    nfts: ["#ec4899", "#fbcfe8", "#38bdf8", "#240719", "Pixel art"],
    aircraft: ["#3b82f6", "#bae6fd", "#60a5fa", "#07172b", "Business jet"],
    yachts: ["#0ea5e9", "#e0f2fe", "#38bdf8", "#061d2c", "Superyacht"],
  };

  const [p1, p2, glow, bg, sub] = catPalettes[category] ?? catPalettes.vehicles!;
  const subject = renderCollectibleSubject(category, sub, p1, p2, glow, 0);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="catbg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="${p1}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${bg}"/>
        </radialGradient>
      </defs>
      <rect width="100" height="100" rx="14" fill="${bg}"/>
      <rect width="100" height="100" rx="14" fill="url(#catbg)"/>
      <circle cx="50" cy="48" r="34" fill="none" stroke="${p2}" stroke-width="1.2" opacity="0.28"/>
      ${subject}
    </svg>
  `;
  const encoded = encodeSvg(svg);
  COLLECTIBLE_TEXTURE_CACHE[key] = encoded;
  return encoded;
}

/**
 * Generates a unique custom SVG texture for each of the 120 Collectible Items
 * based on its category, subtype, item index livery, and model name.
 */
export function collectibleItemTexture(itemId?: string, category?: string): string {
  if (!itemId) return collectibleCategoryTexture(category ?? "vehicles");

  const resolvedId = resolveCollectibleId(itemId);
  const key = `item:${resolvedId}`;
  if (COLLECTIBLE_TEXTURE_CACHE[key]) return COLLECTIBLE_TEXTURE_CACHE[key]!;

  const def = COLLECTIBLE_BY_ID[resolvedId];
  if (!def) return collectibleCategoryTexture(category ?? "vehicles");

  const idxMatch = /-(\d+)$/.exec(def.id);
  const idx = idxMatch ? Math.max(0, Number(idxMatch[1]) - 1) : 0;
  const [p1, p2, glow, bg] =
    ITEM_LIVERY_PALETTES[idx % ITEM_LIVERY_PALETTES.length] ?? ITEM_LIVERY_PALETTES[0]!;
  const word = def.name.split(" ")[0]?.toUpperCase() ?? def.id.toUpperCase();
  const subject = renderCollectibleSubject(def.category, def.sub, p1, p2, glow, idx);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="ibg" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stop-color="${p1}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${bg}"/>
        </radialGradient>
      </defs>
      <rect width="100" height="100" rx="14" fill="${bg}"/>
      <rect width="100" height="100" rx="14" fill="url(#ibg)"/>
      <circle cx="50" cy="46" r="32" fill="none" stroke="${p2}" stroke-width="1" stroke-dasharray="4 3" opacity="0.35"/>
      <g transform="translate(0, -3)">
        ${subject}
      </g>
      <rect x="14" y="77" width="72" height="15" rx="4" fill="#090d16" opacity="0.86" stroke="${p2}" stroke-width="1"/>
      <text x="50" y="87.5" font-family="sans-serif" font-weight="800" font-size="8.5" letter-spacing="0.6" fill="${p2}" text-anchor="middle">${word}</text>
    </svg>
  `;
  const encoded = encodeSvg(svg);
  COLLECTIBLE_TEXTURE_CACHE[key] = encoded;
  return encoded;
}

export interface PlayerTierInfo {
  tier: number;
  sublevel: number;
  tierName: string;
  romanSublevel: "I" | "II" | "III";
  badgePath: string;
}

/**
 * Maps player level to the extracted 10 tier badges (3 sublevels each: I, II, III).
 * Uses exact specifications from tier_badge_image_sheets:
 * - Tier 1 Stone: 1-2 (I), 3-5 (II), 6-9 (III)
 * - Tier 2 Bronze: 10-13 (I), 14-17 (II), 18-22 (III)
 * - Tier 3 Iron: 23-28 (I), 29-34 (II), 35-40 (III)
 * - Tier 4 Silver: 41-45 (I), 46-50 (II), 51-55 (III)
 * - Tiers 5-10: 5 levels per sublevel progression up to 100+
 */
export function getPlayerTier(level: number): PlayerTierInfo {
  const lvl = Math.max(1, level);

  // Tier 1: Stone
  if (lvl <= 2)
    return {
      tier: 1,
      sublevel: 1,
      tierName: "Stone",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_1_1.png",
    };
  if (lvl <= 5)
    return {
      tier: 1,
      sublevel: 2,
      tierName: "Stone",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_1_2.png",
    };
  if (lvl <= 9)
    return {
      tier: 1,
      sublevel: 3,
      tierName: "Stone",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_1_3.png",
    };

  // Tier 2: Bronze
  if (lvl <= 13)
    return {
      tier: 2,
      sublevel: 1,
      tierName: "Bronze",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_2_1.png",
    };
  if (lvl <= 17)
    return {
      tier: 2,
      sublevel: 2,
      tierName: "Bronze",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_2_2.png",
    };
  if (lvl <= 22)
    return {
      tier: 2,
      sublevel: 3,
      tierName: "Bronze",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_2_3.png",
    };

  // Tier 3: Iron
  if (lvl <= 28)
    return {
      tier: 3,
      sublevel: 1,
      tierName: "Iron",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_3_1.png",
    };
  if (lvl <= 34)
    return {
      tier: 3,
      sublevel: 2,
      tierName: "Iron",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_3_2.png",
    };
  if (lvl <= 40)
    return {
      tier: 3,
      sublevel: 3,
      tierName: "Iron",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_3_3.png",
    };

  // Tier 4: Silver (+5 per sublevel)
  if (lvl <= 45)
    return {
      tier: 4,
      sublevel: 1,
      tierName: "Silver",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_4_1.png",
    };
  if (lvl <= 50)
    return {
      tier: 4,
      sublevel: 2,
      tierName: "Silver",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_4_2.png",
    };
  if (lvl <= 55)
    return {
      tier: 4,
      sublevel: 3,
      tierName: "Silver",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_4_3.png",
    };

  // Tier 5: Gold / Tier 5
  if (lvl <= 60)
    return {
      tier: 5,
      sublevel: 1,
      tierName: "Tier 5",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_5_1.png",
    };
  if (lvl <= 65)
    return {
      tier: 5,
      sublevel: 2,
      tierName: "Tier 5",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_5_2.png",
    };
  if (lvl <= 70)
    return {
      tier: 5,
      sublevel: 3,
      tierName: "Tier 5",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_5_3.png",
    };

  // Tier 6: Platinum / Tier 6
  if (lvl <= 75)
    return {
      tier: 6,
      sublevel: 1,
      tierName: "Tier 6",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_6_1.png",
    };
  if (lvl <= 80)
    return {
      tier: 6,
      sublevel: 2,
      tierName: "Tier 6",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_6_2.png",
    };
  if (lvl <= 85)
    return {
      tier: 6,
      sublevel: 3,
      tierName: "Tier 6",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_6_3.png",
    };

  // Tier 7: Diamond / Tier 7
  if (lvl <= 90)
    return {
      tier: 7,
      sublevel: 1,
      tierName: "Tier 7",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_7_1.png",
    };
  if (lvl <= 95)
    return {
      tier: 7,
      sublevel: 2,
      tierName: "Tier 7",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_7_2.png",
    };
  if (lvl <= 100)
    return {
      tier: 7,
      sublevel: 3,
      tierName: "Tier 7",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_7_3.png",
    };

  // Tier 8: Master / Tier 8
  if (lvl <= 105)
    return {
      tier: 8,
      sublevel: 1,
      tierName: "Tier 8",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_8_1.png",
    };
  if (lvl <= 110)
    return {
      tier: 8,
      sublevel: 2,
      tierName: "Tier 8",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_8_2.png",
    };
  if (lvl <= 115)
    return {
      tier: 8,
      sublevel: 3,
      tierName: "Tier 8",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_8_3.png",
    };

  // Tier 9: Grandmaster / Tier 9
  if (lvl <= 120)
    return {
      tier: 9,
      sublevel: 1,
      tierName: "Tier 9",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_9_1.png",
    };
  if (lvl <= 125)
    return {
      tier: 9,
      sublevel: 2,
      tierName: "Tier 9",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_9_2.png",
    };
  if (lvl <= 130)
    return {
      tier: 9,
      sublevel: 3,
      tierName: "Tier 9",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_9_3.png",
    };

  // Tier 10: Apex / Tier 10
  if (lvl <= 140)
    return {
      tier: 10,
      sublevel: 1,
      tierName: "Apex",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_10_1.png",
    };
  if (lvl <= 150)
    return {
      tier: 10,
      sublevel: 2,
      tierName: "Apex",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_10_2.png",
    };
  return {
    tier: 10,
    sublevel: 3,
    tierName: "Apex",
    romanSublevel: "III",
    badgePath: "/assets/game/tiers/tier_10_3.png",
  };
}
