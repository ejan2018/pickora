/**
 * Currency conversion — every product's base price is USD.
 * Live rates come from /api/fx (cached in the DB for 12 h, refreshed from
 * the free open exchange-rate API). The table below is a static fallback so
 * prices still convert (approximately) if the API is unreachable.
 */

import { COUNTRY_BY_CODE } from "./countries";

export type FxRates = Record<string, number>;

export type FxPayload = {
  base: "USD";
  rates: FxRates;
  updatedAt: string;
  live: boolean;
};

/** Approximate USD→X rates (late-2025 snapshot; refreshed live via /api/fx). */
export const STATIC_RATES: FxRates = {
  AED: 3.67, AFN: 68, ALL: 87, AMD: 383, ANG: 1.79, AOA: 912,
  ARS: 1410, AUD: 1.56, AWG: 1.79, AZN: 1.7, BAM: 1.79, BBD: 2,
  BDT: 122, BGN: 1.79, BHD: 0.377, BIF: 2965, BMD: 1, BND: 1.29,
  BOB: 6.91, BRL: 5.8, BSD: 1, BTN: 88.5, BWP: 13.4, BYN: 3.27,
  BZD: 2, CAD: 1.44, CDF: 2865, CHF: 0.8, CLP: 975, CNY: 7.25,
  COP: 4430, CRC: 505, CUP: 24, CVE: 102.8, CZK: 22.4, DJF: 177.7,
  DKK: 6.88, DOP: 63, DZD: 130, EGP: 48.5, ERN: 15, ETB: 141,
  EUR: 0.92, FJD: 2.32, FKP: 0.78, GBP: 0.78, GEL: 2.72, GHS: 15.5,
  GIP: 0.78, GMD: 72.5, GNF: 8635, GTQ: 7.72, GYD: 209, HKD: 7.78,
  HNL: 26.2, HTG: 131, HUF: 355, IDR: 16450, ILS: 3.24, INR: 88.5,
  IQD: 1310, IRR: 42000, ISK: 123, JMD: 157, JOD: 0.709, JPY: 152,
  KES: 129, KGS: 87.4, KHR: 4040, KMF: 451, KRW: 1465, KWD: 0.3065,
  KYD: 0.83, KZT: 545, LAK: 21760, LBP: 89500, LKR: 292, LRD: 195,
  LSL: 17.6, MAD: 9.05, MDL: 17.2, MGA: 4555, MKD: 56.6, MMK: 2100,
  MNT: 3685, MOP: 8.01, MRU: 39.8, MUR: 47, MVR: 15.4, MWK: 1735,
  MXN: 20.2, MYR: 4.3, MZN: 63.9, NAD: 17.6, NGN: 1535, NIO: 36.8,
  NOK: 10.5, NPR: 141.5, NZD: 1.72, OMR: 0.3845, PAB: 1, PEN: 3.4,
  PGK: 4.06, PHP: 58.9, PKR: 278, PLN: 3.96, PYG: 7770, QAR: 3.64,
  RON: 4.58, RSD: 108, RUB: 99, RWF: 1435, SAR: 3.75, SBD: 8.37,
  SCR: 14.4, SDG: 601, SEK: 9.5, SGD: 1.29, SLE: 22.9, SOS: 571,
  SRD: 41.2, SSP: 4600, STN: 22.9, SYP: 13000, SZL: 17.6, THB: 31.8,
  TJS: 10.9, TND: 3.16, TOP: 2.38, TRY: 42.3, TTD: 6.79, TWD: 31.4,
  TZS: 2695, UAH: 42.1, UGX: 3670, USD: 1, UYU: 43.3, UZS: 12160,
  VES: 251, VND: 26350, VUV: 119, WST: 2.78, XAF: 604, XCD: 2.7,
  XOF: 604, XPF: 110, YER: 244, ZAR: 17.6, ZMW: 25.6,
};

/** Currency of a country code (falls back to USD). */
export function currencyOfCountry(code: string | null | undefined): string {
  if (!code) return "USD";
  return COUNTRY_BY_CODE[code]?.currency ?? "USD";
}

/** Format a USD amount into the target currency using the given rates. */
export function formatInCurrency(
  usd: number,
  currency: string,
  rates?: FxRates | null
): string {
  const rate = rates?.[currency] ?? STATIC_RATES[currency] ?? 1;
  const value = usd * rate;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}
