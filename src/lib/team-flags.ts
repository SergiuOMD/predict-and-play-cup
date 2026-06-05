/** FIFA 3-letter codes → flagcdn.com ISO codes (WC 2026 participants + common aliases). */
const TLA_TO_ISO: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CPV: "cv",
  COL: "co",
  COD: "cd",
  CIV: "ci",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JPN: "jp",
  JOR: "jo",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NZL: "nz",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  ESP: "es",
  SWE: "se",
  SUI: "ch",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

/** Emoji fallback when imaginea nu se încarcă (toate cele 48 din WC 2026). */
const TLA_TO_EMOJI: Record<string, string> = {
  ALG: "🇩🇿",
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  AUT: "🇦🇹",
  BEL: "🇧🇪",
  BIH: "🇧🇦",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CPV: "🇨🇻",
  COL: "🇨🇴",
  COD: "🇨🇩",
  CIV: "🇨🇮",
  CRO: "🇭🇷",
  CUW: "🇨🇼",
  CZE: "🇨🇿",
  ECU: "🇪🇨",
  EGY: "🇪🇬",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  GHA: "🇬🇭",
  HAI: "🇭🇹",
  IRN: "🇮🇷",
  IRQ: "🇮🇶",
  JPN: "🇯🇵",
  JOR: "🇯🇴",
  KOR: "🇰🇷",
  KSA: "🇸🇦",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NED: "🇳🇱",
  NZL: "🇳🇿",
  NOR: "🇳🇴",
  PAN: "🇵🇦",
  PAR: "🇵🇾",
  POR: "🇵🇹",
  QAT: "🇶🇦",
  RSA: "🇿🇦",
  SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  SEN: "🇸🇳",
  ESP: "🇪🇸",
  SWE: "🇸🇪",
  SUI: "🇨🇭",
  TUN: "🇹🇳",
  TUR: "🇹🇷",
  URU: "🇺🇾",
  USA: "🇺🇸",
  UZB: "🇺🇿",
};

/** Nume afișate în DB / football-data → cod FIFA */
const NAME_TO_TLA: Record<string, string> = {
  algeria: "ALG",
  argentina: "ARG",
  australia: "AUS",
  austria: "AUT",
  belgium: "BEL",
  "bosnia and herzegovina": "BIH",
  "bosnia-herzegovina": "BIH",
  brazil: "BRA",
  canada: "CAN",
  "cabo verde": "CPV",
  "cape verde": "CPV",
  colombia: "COL",
  "congo dr": "COD",
  "dr congo": "COD",
  "congo drc": "COD",
  "côte d'ivoire": "CIV",
  "cote d'ivoire": "CIV",
  "ivory coast": "CIV",
  croatia: "CRO",
  curaçao: "CUW",
  curacao: "CUW",
  czechia: "CZE",
  "czech republic": "CZE",
  ecuador: "ECU",
  egypt: "EGY",
  england: "ENG",
  france: "FRA",
  germany: "GER",
  ghana: "GHA",
  haiti: "HAI",
  iran: "IRN",
  "ir iran": "IRN",
  iraq: "IRQ",
  japan: "JPN",
  jordan: "JOR",
  "korea republic": "KOR",
  "south korea": "KOR",
  "saudi arabia": "KSA",
  morocco: "MAR",
  mexico: "MEX",
  netherlands: "NED",
  "new zealand": "NZL",
  norway: "NOR",
  panama: "PAN",
  paraguay: "PAR",
  portugal: "POR",
  qatar: "QAT",
  "south africa": "RSA",
  scotland: "SCO",
  senegal: "SEN",
  spain: "ESP",
  sweden: "SWE",
  switzerland: "SUI",
  tunisia: "TUN",
  türkiye: "TUR",
  turkiye: "TUR",
  turkey: "TUR",
  uruguay: "URU",
  usa: "USA",
  "united states": "USA",
  uzbekistan: "UZB",
};

export type ResolvedTeamFlag = {
  tla: string | null;
  iso: string | null;
  emoji: string;
  imageUrl: string | null;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function resolveTla(code?: string | null, name?: string | null): string | null {
  if (code) {
    const tla = code.trim().toUpperCase();
    if (TLA_TO_ISO[tla]) return tla;
  }
  if (name) {
    const key = normalizeName(name);
    if (NAME_TO_TLA[key]) return NAME_TO_TLA[key];
    for (const [pattern, tla] of Object.entries(NAME_TO_TLA)) {
      if (key.includes(pattern) || pattern.includes(key)) return tla;
    }
  }
  return null;
}

export function resolveTeamFlag(code?: string | null, name?: string | null): ResolvedTeamFlag {
  const tla = resolveTla(code, name);
  const iso = tla ? TLA_TO_ISO[tla] ?? null : null;
  const emoji = tla ? TLA_TO_EMOJI[tla] ?? "🏳️" : "🏳️";
  const imageUrl = iso ? `https://flagcdn.com/w80/${iso}.png` : null;
  return { tla, iso, emoji, imageUrl };
}

export function resolveFlagEmoji(code?: string | null, name?: string | null): string {
  return resolveTeamFlag(code, name).emoji;
}
