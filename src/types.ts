/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FitProfile {
  height: string;
  weight: string; // numeric as string, or "" if skipped
  waist: string;
  hips: string;
  waistPreference: 'Snug' | 'Slightly Relaxed' | 'Relaxed' | '';
  waistbandPosition: 'High Rise' | 'Mid Rise' | 'Low Rise' | '';
  thighFit: 'Fitted' | 'Relaxed' | 'Loose' | '';
  brands: string[];
  brandSizes: Record<string, string>; // maps Brand -> Size
  frustration: 'Waist Gap' | 'Hip Tightness' | 'Wrong Length' | 'Thigh Fit' | 'Rise' | 'Other' | '';
}

export const INITIAL_FIT_PROFILE: FitProfile = {
  height: '',
  weight: '',
  waist: '',
  hips: '',
  waistPreference: '',
  waistbandPosition: '',
  thighFit: '',
  brands: [],
  brandSizes: {},
  frustration: '',
};

export const BRAND_OPTIONS = [
  "Levi's",
  "Wrangler",
  "Lee",
  "Pepe Jeans",
  "Calvin Klein",
  "American Eagle",
  "Gap",
  "Diesel",
  "Tommy Hilfiger",
  "H&M",
  "Zara",
  "Uniqlo",
  "Jack & Jones",
  "Forever 21",
  "Old Navy"
];

export const HEIGHT_OPTIONS = [
  "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"",
  "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""
];

export const WAIST_OPTIONS = Array.from({ length: 52 - 24 + 1 }, (_, i) => String(24 + i)); // 24 to 52
export const HIP_OPTIONS = Array.from({ length: 60 - 32 + 1 }, (_, i) => String(32 + i)); // 32 to 60
export const SIZE_OPTIONS = ["26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38", "40"];

export const WAIST_PREF_OPTIONS = ["Snug", "Slightly Relaxed", "Relaxed"];
export const WAISTBAND_POSITION_OPTIONS = ["High Rise", "Mid Rise", "Low Rise"];
export const THIGH_FIT_OPTIONS = ["Fitted", "Relaxed", "Loose"];
export const FRUSTRATION_OPTIONS = ["Waist Gap", "Hip Tightness", "Wrong Length", "Thigh Fit", "Rise", "Other"];
