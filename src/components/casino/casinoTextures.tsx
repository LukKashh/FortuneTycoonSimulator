import type { CasinoDenomination } from "@/game/config";
import type { Card } from "@/game/casino";
import { cn } from "@/lib/utils";

export function CasinoChipSvg({
  denom,
  size = 44,
  className,
}: {
  denom: CasinoDenomination;
  size?: number;
  className?: string;
}) {
  const palette =
    denom === 5000
      ? {
          rim: "#18181b",
          mid: "#27272a",
          edge: "#facc15",
          ring: "#fde047",
          text: "#fef08a",
          label: "$5K",
        }
      : denom === 1000
        ? {
            rim: "#065f46",
            mid: "#047857",
            edge: "#a7f3d0",
            ring: "#34d399",
            text: "#ecfdf5",
            label: "$1K",
          }
        : {
            rim: "#991b1b",
            mid: "#b91c1c",
            edge: "#fecaca",
            ring: "#fca5a5",
            text: "#fff1f2",
            label: "$100",
          };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 select-none drop-shadow-md", className)}
      aria-label={`$${denom.toLocaleString()} Casino Chip`}
    >
      <defs>
        <radialGradient id={`chipGrad-${denom}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.rim} />
        </radialGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={`url(#chipGrad-${denom})`}
        stroke={palette.edge}
        strokeWidth="2"
      />
      {/* 8 Clay Edge Spots */}
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(ang) * 23;
        const y1 = 32 + Math.sin(ang) * 23;
        const x2 = 32 + Math.cos(ang) * 29;
        const y2 = 32 + Math.sin(ang) * 29;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={palette.edge}
            strokeWidth="4.5"
            strokeLinecap="butt"
          />
        );
      })}
      <circle
        cx="32"
        cy="32"
        r="20.5"
        fill="none"
        stroke={palette.ring}
        strokeWidth="1.2"
        strokeDasharray="3 2.5"
      >
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="14s" repeatCount="indefinite" />
      </circle>
      <circle cx="32" cy="32" r="17.5" fill="#0f172a" stroke={palette.ring} strokeWidth="1.4" />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fill={palette.text}
        fontSize={denom === 100 ? "11" : "12.5"}
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        {palette.label}
      </text>
    </svg>
  );
}

export function GameCoverArt({ id, className }: { id: string; className?: string }) {
  const wraps: Record<string, { bg: string; accent: string }> = {
    dice: { bg: "from-sky-900/90 via-slate-900 to-cyan-950", accent: "#38bdf8" },
    plinko: { bg: "from-indigo-900/90 via-slate-900 to-violet-950", accent: "#a78bfa" },
    keno: { bg: "from-emerald-900/90 via-slate-900 to-teal-950", accent: "#34d399" },
    crash: { bg: "from-orange-900/85 via-slate-900 to-rose-950", accent: "#fb923c" },
    mines: { bg: "from-cyan-900/90 via-slate-900 to-slate-950", accent: "#22d3ee" },
    chicken: { bg: "from-amber-900/85 via-slate-900 to-yellow-950", accent: "#facc15" },
    hilo: { bg: "from-fuchsia-900/85 via-slate-900 to-purple-950", accent: "#e879f9" },
    classic_777: { bg: "from-rose-900/90 via-slate-900 to-amber-950", accent: "#fb7185" },
    olympus_thunder: { bg: "from-sky-900/90 via-indigo-950 to-slate-950", accent: "#38bdf8" },
    pharaoh_vault: { bg: "from-amber-900/90 via-stone-900 to-yellow-950", accent: "#fbbf24" },
    neon_cyberspin: { bg: "from-cyan-900/90 via-slate-950 to-fuchsia-950", accent: "#22d3ee" },
    emerald_fortune: { bg: "from-emerald-900/90 via-green-950 to-slate-950", accent: "#4ade80" },
    sugar_bonanza: { bg: "from-pink-900/90 via-fuchsia-950 to-slate-950", accent: "#f472b6" },
  };
  const theme = wraps[id] ?? { bg: "from-slate-800 to-slate-950", accent: "#38bdf8" };

  return (
    <div
      className={cn(
        "relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br",
        theme.bg,
        className,
      )}
    >
      <svg viewBox="0 0 180 100" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`g-${id}`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="180" height="100" fill={`url(#g-${id})`} />
        {/* Subtle ambient motion layer shared by all casino game covers. */}
        <g pointerEvents="none">
          <circle cx="90" cy="50" r="34" fill="none" stroke={theme.accent} strokeOpacity="0.22" strokeWidth="0.8" strokeDasharray="2 8">
            <animateTransform attributeName="transform" type="rotate" from="0 90 50" to="360 90 50" dur="24s" repeatCount="indefinite" />
          </circle>
          <circle cx="34" cy="22" r="2.2" fill={theme.accent}>
            <animate attributeName="opacity" values="0.25;1;0.25" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.4;2.8;1.4" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="148" cy="72" r="1.8" fill="#ffffff">
            <animate attributeName="opacity" values="0.1;0.85;0.1" dur="4.1s" begin="-1.3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;-5 -8;0 0" dur="4.1s" repeatCount="indefinite" />
          </circle>
          <path d="M18 74 L22 70 L26 74 L22 78 Z" fill={theme.accent} fillOpacity="0.65">
            <animateTransform attributeName="transform" type="translate" values="0 0;3 -9;0 0" dur="5.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur="5.5s" repeatCount="indefinite" />
          </path>
        </g>
        {id === "dice" && (
          <g transform="translate(54 18)">
            <rect
              x="4"
              y="8"
              width="44"
              height="44"
              rx="10"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="2.5"
              transform="rotate(-10 26 30)"
            />
            <circle cx="17" cy="22" r="3.5" fill="#e0f2fe" />
            <circle cx="34" cy="36" r="3.5" fill="#e0f2fe" />
            <rect
              x="34"
              y="18"
              width="40"
              height="40"
              rx="9"
              fill="#0f172a"
              stroke="#22d3ee"
              strokeWidth="2.5"
              transform="rotate(12 54 38)"
            />
            <circle cx="46" cy="29" r="3" fill="#38bdf8" />
            <circle cx="54" cy="38" r="3" fill="#38bdf8" />
            <circle cx="62" cy="47" r="3" fill="#38bdf8" />
          </g>
        )}
        {id === "plinko" && (
          <g>
            {[0, 1, 2, 3].map((row) =>
              Array.from({ length: row + 3 }, (_, col) => {
                const cx = 90 + (col - (row + 2) / 2) * 18;
                const cy = 18 + row * 17;
                return <circle key={`${row}-${col}`} cx={cx} cy={cy} r="3" fill="#cbd5e1" />;
              }),
            )}
            <circle cx="96" cy="43" r="6" fill="#22c55e" stroke="#bbf7d0" strokeWidth="1.5" />
            <rect x="36" y="82" width="24" height="11" rx="3" fill="#ef4444" />
            <rect x="64" y="82" width="24" height="11" rx="3" fill="#f59e0b" />
            <rect x="92" y="82" width="24" height="11" rx="3" fill="#22c55e" />
            <rect x="120" y="82" width="24" height="11" rx="3" fill="#ef4444" />
          </g>
        )}
        {id === "keno" && (
          <g>
            {[1, 7, 14, 22, 28, 36].map((num, idx) => {
              const cx = 36 + (idx % 3) * 52;
              const cy = 28 + Math.floor(idx / 3) * 40;
              const hit = idx % 2 === 0;
              return (
                <g key={num}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="15"
                    fill={hit ? "#059669" : "#1e293b"}
                    stroke={hit ? "#6ee7b7" : "#475569"}
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {num}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {id === "crash" && (
          <g>
            <path
              d="M 20 84 Q 82 78 148 18"
              fill="none"
              stroke="#fb923c"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path d="M 20 84 Q 82 78 148 18 L 148 84 Z" fill="#fb923c" fillOpacity="0.16" />
            <g transform="translate(136 10) rotate(36)">
              <path d="M12 0 L20 18 L12 14 L4 18 Z" fill="#f8fafc" />
              <circle cx="12" cy="10" r="2.5" fill="#fb923c" />
            </g>
            <text
              x="52"
              y="40"
              fill="#fed7aa"
              fontSize="16"
              fontWeight="800"
              fontFamily="JetBrains Mono, monospace"
            >
              4.82×
            </text>
          </g>
        )}
        {id === "mines" && (
          <g transform="translate(46 12)">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const x = c * 30;
                const y = r * 26;
                const isGem = (r === 0 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 0);
                const isBomb = r === 1 && c === 1;
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={x}
                      y={y}
                      width="24"
                      height="21"
                      rx="4"
                      fill={isBomb ? "#7f1d1d" : isGem ? "#064e3b" : "#1e293b"}
                      stroke={isBomb ? "#f87171" : isGem ? "#34d399" : "#334155"}
                      strokeWidth="1.5"
                    />
                    {isGem && (
                      <polygon
                        points={`${x + 12},${y + 4} ${x + 18},${y + 10} ${x + 12},${y + 17} ${x + 6},${y + 10}`}
                        fill="#34d399"
                      />
                    )}
                    {isBomb && <circle cx={x + 12} cy={y + 11} r="5.5" fill="#ef4444" />}
                  </g>
                );
              }),
            )}
          </g>
        )}
        {id === "chicken" && (
          <g>
            <rect x="0" y="64" width="180" height="36" fill="#1e293b" />
            <line
              x1="0"
              y1="80"
              x2="180"
              y2="80"
              stroke="#facc15"
              strokeWidth="2"
              strokeDasharray="10 8"
            />
            <g transform="translate(72 18)">
              <ellipse
                cx="18"
                cy="30"
                rx="14"
                ry="12"
                fill="#fef9c3"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="24" cy="18" r="9" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
              <path d="M21 7 L24 2 L27 8" fill="#ef4444" />
              <polygon points="32,17 40,20 32,22" fill="#f97316" />
              <circle cx="27" cy="16" r="1.8" fill="#0f172a" />
            </g>
          </g>
        )}
        {id === "hilo" && (
          <g>
            <rect
              x="44"
              y="18"
              width="38"
              height="56"
              rx="6"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              transform="rotate(-10 63 46)"
            />
            <text
              x="58"
              y="45"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="16"
              fontWeight="800"
              transform="rotate(-10 63 46)"
            >
              A♠
            </text>
            <rect
              x="96"
              y="18"
              width="38"
              height="56"
              rx="6"
              fill="#f8fafc"
              stroke="#e879f9"
              strokeWidth="2"
              transform="rotate(8 115 46)"
            />
            <text
              x="114"
              y="47"
              textAnchor="middle"
              fill="#dc2626"
              fontSize="16"
              fontWeight="800"
              transform="rotate(8 115 46)"
            >
              K♥
            </text>
          </g>
        )}
        {id.includes("_") && (
          <g transform="translate(36 16)">
            <rect
              x="0"
              y="0"
              width="108"
              height="68"
              rx="8"
              fill="#0f172a"
              fillOpacity="0.82"
              stroke={theme.accent}
              strokeWidth="2"
            />
            {[0, 1, 2].map((col) => (
              <rect
                key={col}
                x={8 + col * 32}
                y={10}
                width="28"
                height="48"
                rx="4"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
              />
            ))}
            <text
              x="22"
              y="40"
              textAnchor="middle"
              fill={theme.accent}
              fontSize="18"
              fontWeight="800"
            >
              {id === "classic_777"
                ? "7"
                : id === "olympus_thunder"
                  ? "⚡"
                  : id === "pharaoh_vault"
                    ? "☥"
                    : id === "neon_cyberspin"
                      ? "◈"
                      : id === "emerald_fortune"
                        ? "♣"
                        : "★"}
            </text>
            <text x="54" y="40" textAnchor="middle" fill="#facc15" fontSize="18" fontWeight="800">
              {id === "classic_777"
                ? "7"
                : id === "olympus_thunder"
                  ? "♛"
                  : id === "pharaoh_vault"
                    ? "◈"
                    : id === "neon_cyberspin"
                      ? "2×"
                      : id === "emerald_fortune"
                        ? "★"
                        : "✿"}
            </text>
            <text
              x="86"
              y="40"
              textAnchor="middle"
              fill={theme.accent}
              fontSize="18"
              fontWeight="800"
            >
              {id === "classic_777"
                ? "7"
                : id === "olympus_thunder"
                  ? "⚡"
                  : id === "pharaoh_vault"
                    ? "☥"
                    : id === "neon_cyberspin"
                      ? "◈"
                      : id === "emerald_fortune"
                        ? "♣"
                        : "★"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function SlotSymbolSvg({
  symbolId,
  size = 44,
  className,
}: {
  symbolId: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={cn("select-none", className)}>
      <g style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        {renderSymbolShape(symbolId)}
        <animateTransform attributeName="transform" type="scale" values="1;1.035;1" dur="2.8s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}

function renderSymbolShape(id: string) {
  switch (id) {
    case "diamond":
    case "emerald":
    case "gem_blue":
    case "gem_purple":
    case "holo_chip": {
      const fill =
        id === "emerald" || id === "holo_chip"
          ? "#10b981"
          : id === "gem_purple"
            ? "#a855f7"
            : "#38bdf8";
      const light =
        id === "emerald" || id === "holo_chip"
          ? "#a7f3d0"
          : id === "gem_purple"
            ? "#e9d5ff"
            : "#bae6fd";
      return (
        <g>
          <polygon
            points="14,10 34,10 42,20 24,40 6,20"
            fill={fill}
            stroke={light}
            strokeWidth="2"
          />
          <polygon points="14,10 24,20 34,10" fill={light} fillOpacity="0.65" />
          <line x1="6" y1="20" x2="42" y2="20" stroke={light} strokeWidth="1.3" />
          {id === "holo_chip" && (
            <text x="24" y="29" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              2×
            </text>
          )}
        </g>
      );
    }
    case "seven":
      return (
        <g>
          <rect
            x="6"
            y="7"
            width="36"
            height="34"
            rx="8"
            fill="#450a0a"
            stroke="#facc15"
            strokeWidth="2"
          />
          <text
            x="24"
            y="33"
            textAnchor="middle"
            fill="#f87171"
            stroke="#fef08a"
            strokeWidth="0.8"
            fontSize="26"
            fontWeight="900"
          >
            7
          </text>
        </g>
      );
    case "bell":
      return (
        <g>
          <path
            d="M24 8 C15 8 12 16 12 27 L8 33 H40 L36 27 C36 16 33 8 24 8 Z"
            fill="#facc15"
            stroke="#fef08a"
            strokeWidth="1.8"
          />
          <circle cx="24" cy="36" r="4" fill="#ca8a04" />
        </g>
      );
    case "bar":
      return (
        <g>
          <rect
            x="5"
            y="14"
            width="38"
            height="20"
            rx="4"
            fill="#f59e0b"
            stroke="#fef08a"
            strokeWidth="2"
          />
          <text x="24" y="28" textAnchor="middle" fill="#18181b" fontSize="12" fontWeight="900">
            BAR
          </text>
        </g>
      );
    case "clover":
      return (
        <g fill="#22c55e" stroke="#86efac" strokeWidth="1.3">
          <circle cx="24" cy="15" r="7" />
          <circle cx="15" cy="24" r="7" />
          <circle cx="33" cy="24" r="7" />
          <circle cx="24" cy="31" r="6.5" />
          <path d="M24 30 L27 42" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "cherry":
    case "strawberry":
      return (
        <g>
          <path
            d="M24 10 C22 15 16 20 15 26"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 10 C27 16 32 20 33 26"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="15" cy="31" r="8" fill="#e11d48" stroke="#fda4af" strokeWidth="1.5" />
          <circle cx="33" cy="32" r="7.5" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />
        </g>
      );
    case "zeus_crown":
    case "pharaoh":
      return (
        <g>
          <polygon
            points="8,34 10,14 18,22 24,10 30,22 38,14 40,34"
            fill="#facc15"
            stroke="#fef08a"
            strokeWidth="1.8"
          />
          <rect x="8" y="34" width="32" height="6" rx="2" fill="#ca8a04" />
          <circle cx="24" cy="24" r="3" fill="#38bdf8" />
        </g>
      );
    case "lightning":
      return (
        <g>
          <polygon
            points="27,5 12,26 23,26 20,43 36,21 25,21"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.8"
          />
        </g>
      );
    case "trident":
    case "katana":
      return (
        <g stroke="#60a5fa" strokeWidth="2.8" strokeLinecap="round" fill="none">
          <line x1="24" y1="8" x2="24" y2="41" />
          <path d="M13 13 V21 C13 24 35 24 35 21 V13" />
          <polygon points="24,5 20,13 28,13" fill="#93c5fd" stroke="none" />
        </g>
      );
    case "chalice":
    case "ale":
    case "gold_pot":
      return (
        <g>
          <path
            d="M11 16 H37 L34 33 C33 38 15 38 14 33 Z"
            fill="#f59e0b"
            stroke="#fde68a"
            strokeWidth="1.8"
          />
          <circle cx="18" cy="14" r="4" fill="#facc15" />
          <circle cx="24" cy="12" r="4.5" fill="#fef08a" />
          <circle cx="30" cy="14" r="4" fill="#facc15" />
        </g>
      );
    case "scarab_wild":
      return (
        <g>
          <ellipse
            cx="24"
            cy="25"
            rx="13"
            ry="15"
            fill="#0d9488"
            stroke="#5eead4"
            strokeWidth="2"
          />
          <circle cx="24" cy="13" r="6" fill="#facc15" />
          <text x="24" y="30" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">
            WILD
          </text>
        </g>
      );
    case "ankh":
      return (
        <g stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <circle cx="24" cy="14" r="6" />
          <line x1="24" y1="20" x2="24" y2="40" />
          <line x1="13" y1="26" x2="35" y2="26" />
        </g>
      );
    case "eye_horus":
    case "synth_helm":
    case "visor":
      return (
        <g>
          <path
            d="M7 24 Q24 10 41 24 Q24 38 7 24 Z"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2.2"
          />
          <circle cx="24" cy="24" r="6.5" fill="#38bdf8" />
          <circle cx="24" cy="24" r="2.5" fill="#0f172a" />
        </g>
      );
    case "pyramid":
      return (
        <g>
          <polygon points="24,8 42,37 6,37" fill="#d97706" stroke="#fde68a" strokeWidth="1.8" />
          <polygon points="24,8 42,37 24,37" fill="#b45309" />
        </g>
      );
    case "cyber_core":
      return (
        <g>
          <polygon
            points="24,6 39,15 39,33 24,42 9,33 9,15"
            fill="#083344"
            stroke="#22d3ee"
            strokeWidth="2.2"
          />
          <circle cx="24" cy="24" r="7" fill="#22d3ee" />
        </g>
      );
    case "star_candy":
      return (
        <polygon
          points="24,6 29,18 42,19 32,27 35,40 24,33 13,40 16,27 6,19 19,18"
          fill="#facc15"
          stroke="#fef08a"
          strokeWidth="1.8"
        />
      );
    case "lollipop":
      return (
        <g>
          <line
            x1="24"
            y1="27"
            x2="24"
            y2="43"
            stroke="#e2e8f0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="24" cy="18" r="12" fill="#ec4899" stroke="#fbcfe8" strokeWidth="2" />
          <path
            d="M24 18 m-6 0 a6 6 0 1 0 12 0 a4 4 0 1 0 -8 0"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      );
    case "cupcake":
      return (
        <g>
          <polygon
            points="12,24 36,24 32,40 16,40"
            fill="#a855f7"
            stroke="#e9d5ff"
            strokeWidth="1.5"
          />
          <path d="M10 24 C10 13 38 13 38 24 Z" fill="#f472b6" stroke="#fbcfe8" strokeWidth="1.5" />
          <circle cx="24" cy="12" r="3" fill="#ef4444" />
        </g>
      );
    case "gummy_bear":
      return (
        <g fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.5">
          <circle cx="17" cy="12" r="4" />
          <circle cx="31" cy="12" r="4" />
          <circle cx="24" cy="19" r="8" />
          <ellipse cx="24" cy="33" rx="9" ry="8" />
        </g>
      );
    case "horseshoe":
      return (
        <path
          d="M14 11 V24 C14 33 34 33 34 24 V11"
          fill="none"
          stroke="#facc15"
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <g>
          <circle cx="24" cy="24" r="15" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="24" cy="24" r="7" fill="#facc15" />
        </g>
      );
  }
}

export function ChickenSpriteSvg({
  state = "idle",
  size = 44,
}: {
  state?: "idle" | "hop" | "hit" | "win";
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn(
        "select-none transition-transform duration-200",
        state === "hop" && "-translate-y-2 scale-105",
        state === "hit" && "rotate-90 opacity-65 grayscale",
        state === "win" && "scale-110",
      )}
    >
      {/* Legs */}
      <line
        x1="19"
        y1="36"
        x2="19"
        y2="44"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="29"
        y1="36"
        x2="29"
        y2="44"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Body */}
      <ellipse cx="23" cy="28" rx="14" ry="11" fill="#fef9c3" stroke="#eab308" strokeWidth="1.8" />
      {/* Wing */}
      <ellipse cx="19" cy="29" rx="7" ry="5" fill="#fde047" />
      {/* Head */}
      <circle cx="29" cy="17" r="8.5" fill="#fef9c3" stroke="#eab308" strokeWidth="1.8" />
      {/* Comb */}
      <path d="M25 9 L28 3 L31 9 L34 5 L35 11 Z" fill="#ef4444" />
      {/* Beak */}
      <polygon points="37,16 44,19 37,22" fill="#f97316" />
      {/* Eye */}
      {state === "hit" ? (
        <path d="M30 14 L34 18 M34 14 L30 18" stroke="#0f172a" strokeWidth="2" />
      ) : (
        <circle cx="32" cy="15.5" r="1.8" fill="#0f172a" />
      )}
    </svg>
  );
}

export function HazardCarSvg({ variant = 0 }: { variant?: number }) {
  const color = variant % 2 === 0 ? "#ef4444" : "#3b82f6";
  return (
    <svg width="42" height="24" viewBox="0 0 42 24" className="select-none">
      <rect
        x="3"
        y="6"
        width="36"
        height="12"
        rx="4"
        fill={color}
        stroke="#f8fafc"
        strokeWidth="1.2"
      />
      <rect x="10" y="3" width="18" height="7" rx="2" fill="#0f172a" fillOpacity="0.65" />
      <circle cx="11" cy="19" r="3.5" fill="#18181b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="31" cy="19" r="3.5" fill="#18181b" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  );
}

export function PlayingCardVisual({
  c,
  hidden,
  size = "md",
}: {
  c?: Card;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-36 w-24 text-2xl rounded-xl"
      : size === "sm"
        ? "h-14 w-10 text-xs rounded-md"
        : "h-24 w-16 text-lg rounded-lg";

  if (!c || hidden) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-sky-400/40 bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 shadow-md",
          dims,
        )}
      >
        <div className="flex h-[80%] w-[78%] items-center justify-center rounded border border-sky-300/25 text-sky-300/60 font-bold">
          CF
        </div>
      </div>
    );
  }
  const rank = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][c.r];
  const suit = ["♠", "♥", "♦", "♣"][c.s];
  const isRed = c.s === 1 || c.s === 2;
  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col justify-between border border-slate-200 bg-slate-50 p-1.5 font-bold shadow-lg select-none animate-in zoom-in-95 duration-150",
        isRed ? "text-rose-600" : "text-slate-900",
        dims,
      )}
    >
      <div className="flex items-center justify-between text-[0.62em] leading-none">
        <span>{rank}</span>
        <span>{suit}</span>
      </div>
      <div className="text-center leading-none">{suit}</div>
      <div className="flex items-center justify-between text-[0.62em] leading-none rotate-180">
        <span>{rank}</span>
        <span>{suit}</span>
      </div>
    </div>
  );
}
