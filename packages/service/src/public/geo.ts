import { createLogger } from "@flowform/logger";

const log = createLogger("geo");

//Continent Map

const CONTINENT_MAP: Record<string, string> = {
  // Africa
  DZ: "Africa", AO: "Africa", BJ: "Africa", BW: "Africa", BF: "Africa",
  BI: "Africa", CV: "Africa", CM: "Africa", CF: "Africa", TD: "Africa",
  KM: "Africa", CG: "Africa", CD: "Africa", CI: "Africa", DJ: "Africa",
  EG: "Africa", GQ: "Africa", ER: "Africa", SZ: "Africa", ET: "Africa",
  GA: "Africa", GM: "Africa", GH: "Africa", GN: "Africa", GW: "Africa",
  KE: "Africa", LS: "Africa", LR: "Africa", LY: "Africa", MG: "Africa",
  MW: "Africa", ML: "Africa", MR: "Africa", MU: "Africa", MA: "Africa",
  MZ: "Africa", NA: "Africa", NE: "Africa", NG: "Africa", RW: "Africa",
  ST: "Africa", SN: "Africa", SL: "Africa", SO: "Africa", ZA: "Africa",
  SS: "Africa", SD: "Africa", TZ: "Africa", TG: "Africa", TN: "Africa",
  UG: "Africa", ZM: "Africa", ZW: "Africa",
  // Asia
  AF: "Asia", AM: "Asia", AZ: "Asia", BH: "Asia", BD: "Asia",
  BT: "Asia", BN: "Asia", KH: "Asia", CN: "Asia", GE: "Asia",
  IN: "Asia", ID: "Asia", IR: "Asia", IQ: "Asia", IL: "Asia",
  JP: "Asia", JO: "Asia", KZ: "Asia", KW: "Asia", KG: "Asia",
  LA: "Asia", LB: "Asia", MY: "Asia", MV: "Asia", MN: "Asia",
  MM: "Asia", NP: "Asia", KP: "Asia", OM: "Asia", PK: "Asia",
  PS: "Asia", PH: "Asia", QA: "Asia", SA: "Asia", SG: "Asia",
  KR: "Asia", LK: "Asia", SY: "Asia", TW: "Asia", TJ: "Asia",
  TH: "Asia", TL: "Asia", TR: "Asia", TM: "Asia", AE: "Asia",
  UZ: "Asia", VN: "Asia", YE: "Asia",
  // Europe
  AL: "Europe", AD: "Europe", AT: "Europe", BY: "Europe", BE: "Europe",
  BA: "Europe", BG: "Europe", HR: "Europe", CY: "Europe", CZ: "Europe",
  DK: "Europe", EE: "Europe", FI: "Europe", FR: "Europe", DE: "Europe",
  GR: "Europe", HU: "Europe", IS: "Europe", IE: "Europe", IT: "Europe",
  XK: "Europe", LV: "Europe", LI: "Europe", LT: "Europe", LU: "Europe",
  MT: "Europe", MD: "Europe", MC: "Europe", ME: "Europe", NL: "Europe",
  MK: "Europe", NO: "Europe", PL: "Europe", PT: "Europe", RO: "Europe",
  RU: "Europe", SM: "Europe", RS: "Europe", SK: "Europe", SI: "Europe",
  ES: "Europe", SE: "Europe", CH: "Europe", UA: "Europe", GB: "Europe",
  VA: "Europe",
  // North America
  AG: "North America", BS: "North America", BB: "North America",
  BZ: "North America", CA: "North America", CR: "North America",
  CU: "North America", DM: "North America", DO: "North America",
  SV: "North America", GD: "North America", GT: "North America",
  HT: "North America", HN: "North America", JM: "North America",
  MX: "North America", NI: "North America", PA: "North America",
  KN: "North America", LC: "North America", VC: "North America",
  TT: "North America", US: "North America",
  // South America
  AR: "South America", BO: "South America", BR: "South America",
  CL: "South America", CO: "South America", EC: "South America",
  GY: "South America", PY: "South America", PE: "South America",
  SR: "South America", UY: "South America", VE: "South America",
  // Oceania
  AU: "Oceania", FJ: "Oceania", KI: "Oceania", MH: "Oceania",
  FM: "Oceania", NR: "Oceania", NZ: "Oceania", PW: "Oceania",
  PG: "Oceania", WS: "Oceania", SB: "Oceania", TO: "Oceania",
  TV: "Oceania", VU: "Oceania",
};

export function countryToContinent(countryCode: string): string {
  return CONTINENT_MAP[countryCode.toUpperCase()] ?? "Other";
}

//Device Detection

export function detectDevice(userAgent: string): "desktop" | "mobile" | "tablet" {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) return "mobile";
  return "desktop";
}

//Timezone Validation

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

//ipinfo.io Lookup

export type GeoInfo = {
  country: string;
  continent: string;
  city: string;
};

const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|fc|fd)/;

export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (!ip || ip === "0.0.0.0" || PRIVATE_IP_RE.test(ip)) return null;

  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const data = await res.json() as {
      country?: string;
      city?: string;
    };

    if (!data.country) return null;

    const country = data.country.toUpperCase();
    return {
      country,
      continent: countryToContinent(country),
      city: data.city ?? "Unknown",
    };
  } catch (err) {
    log.warn({ err, ip }, "Geo lookup failed");
    return null;
  }
}
