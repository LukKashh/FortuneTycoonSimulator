import { BALANCE } from "./config";
import { hashStr, mulberry, wave } from "./rng";

// ------------------------------------------------------------------ Stocks
export const SECTORS = [
  "Technology",
  "Finance",
  "Energy",
  "Healthcare",
  "Manufacturing",
  "Consumer Goods",
  "Retail",
  "Transportation",
  "Real Estate",
  "Mining",
  "Entertainment",
  "Utilities",
];

export type StockDef = {
  ticker: string;
  name: string;
  sector: string;
  base: number;
  vol: number; // daily-ish volatility
  drift: number; // annual drift
  shares: number; // outstanding
  authorized: number;
  treasury: number;
  dividendYield: number; // annual
  payoutRatio: number;
  revenue: number;
  margin: number;
  assets: number;
  liabilities: number;
  listedAt: number; // ms
  desc: string;
  generated?: boolean;
};

const EPOCH = Date.UTC(2026, 9, 1);

/**
 * Legacy synthetic stock ticker migration map for older player saves.
 */
export const LEGACY_STOCK_MAP: Record<string, string> = {
  NOVA: "NVDA",
  QBIT: "AMD",
  MRDN: "JPM",
  CRSC: "BAC",
  HELX: "XOM",
  SOLR: "FSLR",
  VITA: "UNH",
  GENX: "PFE",
  IRON: "CAT",
  PURE: "PG",
  MRKT: "WMT",
  SWFT: "DAL",
  URBN: "PLD",
  ORE: "BHP",
  STAR: "DIS",
  GRID: "NEE",
  APXS: "AAPL",
  CLD: "MSFT",
  SYNT: "GOOGL",
  CYBR: "META",
  AURA: "AVGO",
  MTRX: "ORCL",
  VLTG: "BRK",
  SOVB: "V",
  ALPH: "MA",
  PAYX: "GS",
  TRST: "MS",
  PTRL: "CVX",
  FUSN: "SHEL",
  GEOT: "COP",
  LNGX: "TTE",
  MEDC: "LLY",
  BIOL: "JNJ",
  CARE: "ABBV",
  NEUR: "MRK",
  AERO: "GE",
  TITN: "LMT",
  STEL: "BA",
  PRCN: "HON",
  CHMC: "DE",
  VRDE: "KO",
  BRWR: "PEP",
  LUXE: "MC",
  ESSN: "NKE",
  WHLS: "COST",
  OMNI: "AMZN",
  BZR: "HD",
  MODA: "MCD",
  FRGT: "UNP",
  OCEN: "UPS",
  VELO: "TSLA",
  PORT: "UBER",
  TOWR: "AMT",
  INDP: "SPG",
  MALL: "TGT",
  LITH: "RIO",
  AURE: "NEM",
  COPR: "UL",
  SILV: "INTC",
  STRM: "NFLX",
  ARCD: "SONY",
  VSN: "CRM",
  HYDR: "BLK",
  AMPR: "DUK",
  NUKR: "SO",
};

/**
 * 65 real-life publicly traded companies across all 12 sectors,
 * scaled to the game economy with authentic relative valuations and dividend profiles.
 */
const REAL_STOCK_SPECS: [
  ticker: string,
  name: string,
  sector: string,
  base: number,
  vol: number,
  drift: number,
  shares: number,
  dy: number,
][] = [
  // Technology (10)
  ["NVDA", "NVIDIA Corp", "Technology", 420, 0.032, 0.16, 2.4e9, 0.004],
  ["MSFT", "Microsoft Corp", "Technology", 380, 0.018, 0.12, 2.2e9, 0.014],
  ["AAPL", "Apple Inc.", "Technology", 340, 0.019, 0.11, 2.5e9, 0.012],
  ["META", "Meta Platforms", "Technology", 295, 0.028, 0.14, 1.6e9, 0.009],
  ["GOOGL", "Alphabet Inc.", "Technology", 260, 0.021, 0.12, 2.1e9, 0.008],
  ["AVGO", "Broadcom Inc.", "Technology", 245, 0.026, 0.13, 1.4e9, 0.019],
  ["CRM", "Salesforce Inc.", "Technology", 188, 0.025, 0.1, 1.1e9, 0.008],
  ["ORCL", "Oracle Corp", "Technology", 155, 0.022, 0.1, 1.5e9, 0.016],
  ["AMD", "Advanced Micro Devices", "Technology", 142, 0.035, 0.14, 1.3e9, 0],
  ["INTC", "Intel Corp", "Technology", 44, 0.034, 0.06, 1.8e9, 0.018],

  // Finance (8)
  ["BRK", "Berkshire Hathaway", "Finance", 465, 0.013, 0.09, 1.5e9, 0],
  ["BLK", "BlackRock Inc.", "Finance", 350, 0.018, 0.09, 8.2e8, 0.028],
  ["MA", "Mastercard Inc.", "Finance", 310, 0.016, 0.11, 1.3e9, 0.012],
  ["GS", "Goldman Sachs", "Finance", 285, 0.021, 0.08, 9.5e8, 0.032],
  ["V", "Visa Inc.", "Finance", 275, 0.015, 0.1, 1.6e9, 0.015],
  ["JPM", "JPMorgan Chase", "Finance", 215, 0.016, 0.08, 1.9e9, 0.034],
  ["MS", "Morgan Stanley", "Finance", 112, 0.02, 0.07, 1.5e9, 0.038],
  ["BAC", "Bank of America", "Finance", 46, 0.019, 0.06, 2.6e9, 0.042],

  // Energy (6)
  ["FSLR", "First Solar Inc.", "Energy", 164, 0.036, 0.13, 8.5e8, 0],
  ["CVX", "Chevron Corp", "Energy", 148, 0.021, 0.06, 1.8e9, 0.054],
  ["XOM", "ExxonMobil Corp", "Energy", 118, 0.02, 0.06, 2.3e9, 0.051],
  ["COP", "ConocoPhillips", "Energy", 106, 0.024, 0.07, 1.4e9, 0.045],
  ["SHEL", "Shell plc", "Energy", 72, 0.022, 0.05, 2.1e9, 0.056],
  ["TTE", "TotalEnergies SE", "Energy", 68, 0.021, 0.05, 1.7e9, 0.058],

  // Healthcare (6)
  ["LLY", "Eli Lilly & Co", "Healthcare", 395, 0.024, 0.14, 1.4e9, 0.011],
  ["UNH", "UnitedHealth Group", "Healthcare", 330, 0.017, 0.09, 1.3e9, 0.022],
  ["ABBV", "AbbVie Inc.", "Healthcare", 176, 0.018, 0.08, 1.6e9, 0.048],
  ["JNJ", "Johnson & Johnson", "Healthcare", 158, 0.013, 0.06, 2.0e9, 0.044],
  ["MRK", "Merck & Co.", "Healthcare", 122, 0.017, 0.07, 1.8e9, 0.036],
  ["PFE", "Pfizer Inc.", "Healthcare", 34, 0.024, 0.04, 2.4e9, 0.062],

  // Manufacturing (6)
  ["LMT", "Lockheed Martin", "Manufacturing", 345, 0.016, 0.07, 9.2e8, 0.035],
  ["DE", "Deere & Company", "Manufacturing", 284, 0.02, 0.08, 1.0e9, 0.022],
  ["CAT", "Caterpillar Inc.", "Manufacturing", 265, 0.021, 0.09, 1.2e9, 0.024],
  ["HON", "Honeywell Intl", "Manufacturing", 198, 0.016, 0.07, 1.3e9, 0.028],
  ["GE", "GE Aerospace", "Manufacturing", 172, 0.023, 0.1, 1.4e9, 0.016],
  ["BA", "Boeing Co.", "Manufacturing", 152, 0.031, 0.06, 1.1e9, 0],

  // Consumer Goods (6)
  ["MC", "LVMH Moët Hennessy", "Consumer Goods", 360, 0.022, 0.09, 1.1e9, 0.022],
  ["PEP", "PepsiCo Inc.", "Consumer Goods", 168, 0.012, 0.06, 1.7e9, 0.039],
  ["PG", "Procter & Gamble", "Consumer Goods", 166, 0.012, 0.06, 1.9e9, 0.034],
  ["NKE", "Nike Inc.", "Consumer Goods", 86, 0.024, 0.06, 1.6e9, 0.024],
  ["KO", "Coca-Cola Co.", "Consumer Goods", 64, 0.011, 0.05, 2.5e9, 0.042],
  ["UL", "Unilever plc", "Consumer Goods", 58, 0.014, 0.05, 2.0e9, 0.045],

  // Retail (6)
  ["COST", "Costco Wholesale", "Retail", 410, 0.016, 0.11, 1.1e9, 0.012],
  ["HD", "Home Depot Inc.", "Retail", 298, 0.018, 0.08, 1.4e9, 0.032],
  ["MCD", "McDonald's Corp", "Retail", 262, 0.014, 0.07, 1.3e9, 0.031],
  ["AMZN", "Amazon.com Inc.", "Retail", 225, 0.023, 0.13, 2.3e9, 0],
  ["TGT", "Target Corp", "Retail", 128, 0.022, 0.05, 1.1e9, 0.041],
  ["WMT", "Walmart Inc.", "Retail", 92, 0.014, 0.08, 2.4e9, 0.021],

  // Transportation (5)
  ["TSLA", "Tesla Inc.", "Transportation", 248, 0.042, 0.15, 1.9e9, 0],
  ["UNP", "Union Pacific Corp", "Transportation", 218, 0.017, 0.07, 1.2e9, 0.029],
  ["UPS", "United Parcel Service", "Transportation", 132, 0.02, 0.05, 1.3e9, 0.052],
  ["UBER", "Uber Technologies", "Transportation", 78, 0.029, 0.11, 1.6e9, 0],
  ["DAL", "Delta Air Lines", "Transportation", 54, 0.028, 0.06, 1.1e9, 0.016],

  // Real Estate (3)
  ["AMT", "American Tower REIT", "Real Estate", 192, 0.018, 0.06, 1.1e9, 0.046],
  ["SPG", "Simon Property Group", "Real Estate", 154, 0.02, 0.06, 1.0e9, 0.064],
  ["PLD", "Prologis Inc.", "Real Estate", 116, 0.017, 0.06, 1.5e9, 0.048],

  // Mining (3)
  ["RIO", "Rio Tinto plc", "Mining", 66, 0.023, 0.05, 1.8e9, 0.062],
  ["BHP", "BHP Group Ltd", "Mining", 59, 0.024, 0.05, 2.1e9, 0.058],
  ["NEM", "Newmont Corp", "Mining", 48, 0.029, 0.06, 1.6e9, 0.035],

  // Entertainment (3)
  ["NFLX", "Netflix Inc.", "Entertainment", 335, 0.027, 0.13, 1.2e9, 0],
  ["DIS", "Walt Disney Co.", "Entertainment", 104, 0.023, 0.06, 1.7e9, 0.014],
  ["SONY", "Sony Group Corp", "Entertainment", 94, 0.021, 0.08, 1.5e9, 0.012],

  // Utilities (3)
  ["DUK", "Duke Energy Corp", "Utilities", 108, 0.012, 0.05, 1.5e9, 0.051],
  ["SO", "Southern Company", "Utilities", 86, 0.012, 0.05, 1.7e9, 0.048],
  ["NEE", "NextEra Energy", "Utilities", 78, 0.015, 0.07, 1.9e9, 0.042],
];

const ALL_STOCKS_CACHE: StockDef[] = REAL_STOCK_SPECS.map(
  ([ticker, name, sector, base, vol, drift, shares, dy]) => {
    const r = mulberry(hashStr("stock-real-" + ticker));
    return {
      ticker,
      name,
      sector,
      base,
      vol,
      drift,
      shares,
      authorized: shares * 1.5,
      treasury: shares * 0.05,
      dividendYield: dy,
      payoutRatio: dy > 0 ? Math.min(0.85, 0.35 + dy * 5) : 0,
      revenue: shares * base * (0.3 + r() * 0.14),
      margin: 0.08 + (hashStr(ticker) % 18) / 100,
      assets: shares * base * 0.88,
      liabilities: shares * base * 0.4,
      listedAt: EPOCH,
      desc: `${name} (${ticker}) is a publicly traded ${sector.toLowerCase()} leader listed on the Stock Exchange.`,
    };
  },
); // 65 real-life companies total

export function listStocks(_now: number): StockDef[] {
  return ALL_STOCKS_CACHE;
}

export function upcomingStockListing(now: number) {
  return { at: now + 365 * 86400_000, name: "Exchange Schedule" };
}

export const stockTick = (t: number) => Math.floor(t / (BALANCE.stockTickMin * 60_000));
export const stockTickTime = (k: number) => k * BALANCE.stockTickMin * 60_000;

function marketCondition(tick: number, perDay: number) {
  return wave(777, tick / perDay) * 0.08; // broad market cycle
}

export function stockPriceAtTick(s: StockDef, tick: number): number {
  const perDay = (24 * 60) / BALANCE.stockTickMin;
  const seed = hashStr(s.ticker);
  const years = (tick - stockTick(s.listedAt)) / (perDay * 365);
  const w = wave(seed, tick / 6) * s.vol * 6 + wave(seed ^ 99, tick / 60) * s.vol * 10;
  const sector = wave(hashStr(s.sector), tick / perDay) * 0.06;
  const p = s.base * Math.exp(s.drift * years + w + sector + marketCondition(tick, perDay));
  return Math.max(0.01, Math.round(p * 100) / 100);
}
export const stockPrice = (s: StockDef, t: number) => stockPriceAtTick(s, stockTick(t));

/** Shares available per tick on the exchange (relaxed liquidity caps). */
export function stockLiquidity(s: StockDef, tick: number) {
  return Math.max(
    2_500,
    Math.floor(
      (s.shares * 0.0005 * (0.6 + 0.4 * (wave(hashStr(s.ticker) ^ 5, tick) + 1))) / (1 + s.vol * 6),
    ),
  );
}

export function stockProfitable(s: StockDef, day: number) {
  return s.margin + wave(hashStr(s.ticker) ^ 31, day) * 0.12 > 0;
}

// ------------------------------------------------------------------ Crypto
export type CryptoDef = {
  symbol: string;
  name: string;
  base: number;
  profile: "low" | "moderate" | "high" | "very high" | "extreme";
  supplyModel: "fixed" | "inflationary" | "burn";
  circulating: number;
  max: number | null;
  inflation: number; // annual
  burn: number; // annual
  listedAt: number;
  desc: string;
};

const VOL: Record<CryptoDef["profile"], number> = {
  low: 0.02,
  moderate: 0.04,
  high: 0.07,
  "very high": 0.1,
  extreme: 0.15,
};

/** Legacy synthetic symbol migration map for older player saves. */
export const LEGACY_CRYPTO_MAP: Record<string, string> = {
  BTX: "BTC",
  ETR: "ETH",
  SOLA: "SOL",
  STB: "USDT",
  DOGO: "DOGE",
  LNK: "LINK",
  AVX: "AVAX",
  FLR: "TRX",
};

/**
 * 45 real-life cryptocurrencies scaled to the game economy while preserving
 * authentic relative price rankings (descending from BTC down to SHIB).
 */
const CRYPTO_CURATED: Omit<CryptoDef, "listedAt">[] = [
  ["BTC", "Bitcoin", 68_000, "moderate", "fixed", 19.7e6, 21e6, 0.009, 0],
  ["ETH", "Ethereum", 3_100, "high", "burn", 120e6, null, 0.008, 0.012],
  ["MKR", "Maker", 2_100, "high", "burn", 9.3e5, 1e6, 0, 0.015],
  ["BNB", "BNB", 620, "high", "burn", 145e6, 200e6, 0, 0.02],
  ["TAO", "Bittensor", 480, "very high", "fixed", 7.4e6, 21e6, 0.05, 0],
  ["BCH", "Bitcoin Cash", 420, "high", "fixed", 19.7e6, 21e6, 0.009, 0],
  ["XMR", "Monero", 195, "moderate", "inflationary", 18.4e6, null, 0.008, 0],
  ["SOL", "Solana", 185, "very high", "inflationary", 470e6, null, 0.048, 0.01],
  ["AAVE", "Aave", 175, "high", "fixed", 14.9e6, 16e6, 0.01, 0],
  ["LTC", "Litecoin", 95, "high", "fixed", 75e6, 84e6, 0.018, 0],
  ["QNT", "Quant", 85, "high", "fixed", 12.1e6, 14.6e6, 0.005, 0],
  ["COMP", "Compound", 58, "very high", "fixed", 8.2e6, 10e6, 0.02, 0],
  ["EGLD", "MultiversX", 42, "very high", "fixed", 27.5e6, 31.4e6, 0.04, 0],
  ["AVAX", "Avalanche", 36, "very high", "fixed", 406e6, 715e6, 0.045, 0.01],
  ["INJ", "Injective", 28, "very high", "burn", 97e6, 100e6, 0.02, 0.03],
  ["LINK", "Chainlink", 18.5, "high", "fixed", 626e6, 1e9, 0.03, 0],
  ["ICP", "Internet Computer", 11.5, "very high", "inflationary", 472e6, null, 0.05, 0.01],
  ["UNI", "Uniswap", 9.8, "high", "fixed", 600e6, 1e9, 0.02, 0],
  ["RNDR", "Render", 8.4, "very high", "burn", 517e6, 644e6, 0.01, 0.02],
  ["FIL", "Filecoin", 6.2, "very high", "inflationary", 595e6, 1.96e9, 0.06, 0],
  ["NEAR", "NEAR Protocol", 5.6, "very high", "inflationary", 1.15e9, null, 0.05, 0.008],
  ["ATOM", "Cosmos", 5.1, "high", "inflationary", 390e6, null, 0.08, 0],
  ["TON", "Toncoin", 4.9, "high", "inflationary", 2.54e9, null, 0.006, 0],
  ["DOT", "Polkadot", 4.6, "high", "inflationary", 1.5e9, null, 0.08, 0],
  ["SUI", "Sui", 3.4, "very high", "fixed", 2.8e9, 10e9, 0.07, 0],
  ["APT", "Aptos", 2.9, "very high", "inflationary", 520e6, null, 0.06, 0],
  ["OP", "Optimism", 2.1, "very high", "fixed", 1.25e9, 4.29e9, 0.04, 0],
  ["XRP", "XRP", 1.45, "high", "fixed", 56.8e9, 100e9, 0.02, 0.001],
  ["XTZ", "Tezos", 1.15, "high", "inflationary", 1.01e9, null, 0.04, 0],
  ["USDT", "Tether", 1.0, "low", "inflationary", 120e9, null, 0.05, 0],
  ["STX", "Stacks", 0.92, "very high", "fixed", 1.5e9, 1.81e9, 0.03, 0],
  ["ARB", "Arbitrum", 0.85, "very high", "fixed", 3.98e9, 10e9, 0.05, 0],
  ["WLD", "Worldcoin", 0.78, "extreme", "fixed", 650e6, 10e9, 0.08, 0],
  ["ADA", "Cardano", 0.68, "high", "fixed", 35.7e9, 45e9, 0.025, 0],
  ["POL", "Polygon", 0.54, "high", "inflationary", 10.2e9, null, 0.02, 0],
  ["XLM", "Stellar", 0.38, "high", "fixed", 29.8e9, 50e9, 0.01, 0],
  ["ALGO", "Algorand", 0.29, "very high", "fixed", 8.2e9, 10e9, 0.02, 0],
  ["TRX", "TRON", 0.24, "moderate", "burn", 86.5e9, null, 0.01, 0.018],
  ["DOGE", "Dogecoin", 0.18, "extreme", "inflationary", 146e9, null, 0.036, 0],
  ["GRT", "The Graph", 0.15, "very high", "inflationary", 9.5e9, null, 0.03, 0.01],
  ["HBAR", "Hedera", 0.12, "very high", "fixed", 37.7e9, 50e9, 0.03, 0],
  ["VET", "VeChain", 0.042, "very high", "fixed", 81e9, 86.7e9, 0.01, 0],
  ["GALA", "Gala", 0.028, "extreme", "fixed", 35.4e9, 50e9, 0.04, 0],
  ["BONK", "Bonk", 0.0025, "extreme", "burn", 75e12, 93e12, 0, 0.02],
  ["SHIB", "Shiba Inu", 0.0005, "extreme", "burn", 589e12, 589.5e12, 0, 0.01],
].map(([symbol, name, base, profile, supplyModel, circulating, max, inflation, burn]) => ({
  symbol: symbol as string,
  name: name as string,
  base: base as number,
  profile: profile as CryptoDef["profile"],
  supplyModel: supplyModel as CryptoDef["supplyModel"],
  circulating: circulating as number,
  max: max as number | null,
  inflation: inflation as number,
  burn: burn as number,
  desc: `${name} (${symbol}) traded on the CryptoTrade Exchange.`,
}));

const ALL_CRYPTO_CACHE: CryptoDef[] = CRYPTO_CURATED.map((c) => ({ ...c, listedAt: EPOCH }));

export function listCrypto(_now: number): CryptoDef[] {
  return ALL_CRYPTO_CACHE;
}

export const cryptoTick = (t: number) => Math.floor(t / (BALANCE.cryptoTickMin * 60_000));
export const cryptoTickTime = (k: number) => k * BALANCE.cryptoTickMin * 60_000;
export const CRYPTO_MIN_PRICE = 0.0001;

export function cryptoPriceAtTick(c: CryptoDef, tick: number): number {
  const seed = hashStr(c.symbol);
  const v = VOL[c.profile];
  const perDay = (24 * 60) / BALANCE.cryptoTickMin;
  const sentiment = wave(4242, tick / perDay) * 0.15;
  const w = wave(seed, tick / 4) * v * 4 + wave(seed ^ 7, tick / 90) * v * 12;
  const p = c.base * Math.exp(w + sentiment);
  return Math.max(CRYPTO_MIN_PRICE, Number(p.toPrecision(6)));
}
export const cryptoPrice = (c: CryptoDef, t: number) => cryptoPriceAtTick(c, cryptoTick(t));

export function cryptoSupply(c: CryptoDef, t: number) {
  const years = Math.max(0, (t - c.listedAt) / (365 * 86400_000));
  let circ = c.circulating * Math.pow(1 + c.inflation - c.burn, years);
  if (c.max) circ = Math.min(circ, c.max);
  const burned = c.circulating * c.burn * years;
  return { circulating: circ, burned, max: c.max };
}

export function cryptoLiquidity(c: CryptoDef, tick: number) {
  return Math.max(
    100,
    c.circulating * 0.00008 * (0.5 + 0.5 * (wave(hashStr(c.symbol) ^ 3, tick) + 1)),
  );
}

/** Sample a price series between two times for charts. */
export function series(
  fn: (tick: number) => number,
  tickFn: (t: number) => number,
  tickTime: (k: number) => number,
  from: number,
  to: number,
  points = 60,
) {
  const a = tickFn(from);
  const b = tickFn(to);
  const step = Math.max(1, Math.floor((b - a) / points));
  const out: { t: number; v: number }[] = [];
  for (let k = a; k <= b; k += step) out.push({ t: tickTime(k), v: fn(k) });
  return out;
}
