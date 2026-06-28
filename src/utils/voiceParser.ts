/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BRAND_OPTIONS, HEIGHT_OPTIONS, WAIST_OPTIONS, HIP_OPTIONS, SIZE_OPTIONS } from '../types';

// Simple text to number dictionary
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100
};

// Helper to extract a number from spoken text
export function parseSpokenNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();
  
  // Try matching direct digits
  const digitMatch = clean.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

  // Parse spoken words (e.g. "one hundred fifty")
  const words = clean.split(/[\s-]+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current || 1) * 100;
      } else {
        current += val;
      }
    }
  }
  total += current;
  return total > 0 ? total : null;
}

// 1. Height Parser
export function parseHeight(text: string): string | null {
  const clean = text.toLowerCase();

  // Try parsing something like "5 foot 6" or "5'6"
  // Look for feet: e.g. "five", "four", "six" or "5", "4", "6"
  let feet = 5; // default
  let inches = 0;

  const feetMatch = clean.match(/(4|5|6)\s*(foot|feet|ft|'|foot's)?/i);
  const wordFeetMatch = clean.match(/(four|five|six)\s*(foot|feet|ft|'|foot's)?/i);

  if (feetMatch) {
    feet = parseInt(feetMatch[1], 10);
  } else if (wordFeetMatch) {
    const word = wordFeetMatch[1];
    if (word === 'four') feet = 4;
    if (word === 'five') feet = 5;
    if (word === 'six') feet = 6;
  }

  // Look for inches
  // Remove the feet match first to avoid double matching
  const remainingClean = clean.replace(/(four|five|six|4|5|6)\s*(foot|feet|ft|'|foot's)?/i, '');
  const inchVal = parseSpokenNumber(remainingClean);
  if (inchVal !== null && inchVal >= 0 && inchVal <= 11) {
    inches = inchVal;
  } else if (clean.includes('ten')) {
    inches = 10;
  } else if (clean.includes('eleven')) {
    inches = 11;
  } else {
    // Check if the user said "five six" (two numbers)
    const numbers = clean.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      feet = parseInt(numbers[0], 10);
      inches = parseInt(numbers[1], 10);
    }
  }

  const result = `${feet}'${inches}"`;
  if (HEIGHT_OPTIONS.includes(result)) {
    return result;
  }
  
  // Direct matching if they state exactly
  for (const option of HEIGHT_OPTIONS) {
    const cleanOption = option.replace(/['"]/g, ' ').replace(/\s+/g, ' ').trim(); // "5 6"
    if (clean.includes(cleanOption) || clean.includes(option)) {
      return option;
    }
  }

  return null;
}

// 2. Weight Parser
export function parseWeight(text: string): string | null {
  const clean = text.toLowerCase();
  if (clean.includes('skip') || clean.includes('no') || clean.includes('private')) {
    return 'Skipped';
  }
  const weight = parseSpokenNumber(clean);
  if (weight && weight >= 50 && weight <= 400) {
    return String(weight);
  }
  return null;
}

// 3. Waist Parser
export function parseWaist(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && num >= 24 && num <= 52) {
    return String(num);
  }
  return null;
}

// 4. Hip Parser
export function parseHips(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && num >= 32 && num <= 60) {
    return String(num);
  }
  return null;
}

// 5. Waist Preference Parser
export function parseWaistPreference(text: string): 'Snug' | 'Slightly Relaxed' | 'Relaxed' | null {
  const clean = text.toLowerCase();
  if (clean.includes('slightly relaxed') || clean.includes('slightly')) return 'Slightly Relaxed';
  if (clean.includes('snug') || clean.includes('tight') || clean.includes('fitted')) return 'Snug';
  if (clean.includes('relaxed') || clean.includes('loose')) return 'Relaxed';
  return null;
}

// 6. Waistband Position Parser
export function parseWaistbandPosition(text: string): 'High Rise' | 'Mid Rise' | 'Low Rise' | null {
  const clean = text.toLowerCase();
  if (clean.includes('high rise') || clean.includes('high')) return 'High Rise';
  if (clean.includes('mid rise') || clean.includes('mid') || clean.includes('medium')) return 'Mid Rise';
  if (clean.includes('low rise') || clean.includes('low')) return 'Low Rise';
  return null;
}

// 7. Thigh Fit Parser
export function parseThighFit(text: string): 'Fitted' | 'Relaxed' | 'Loose' | null {
  const clean = text.toLowerCase();
  if (clean.includes('fitted') || clean.includes('tight')) return 'Fitted';
  if (clean.includes('slightly loose') || clean.includes('relaxed')) return 'Relaxed';
  if (clean.includes('loose') || clean.includes('baggy') || clean.includes('wide')) return 'Loose';
  return null;
}

// 8. Brands Parser
export function parseBrands(text: string): string[] | null {
  const clean = text.toLowerCase();
  const matchedBrands: string[] = [];

  for (const brand of BRAND_OPTIONS) {
    // levis -> levi's, wrangler -> wrangler, calvin klein -> calvin klein
    const normalizedBrand = brand.toLowerCase().replace(/['s]/g, ''); // "levi"
    if (clean.includes(normalizedBrand) || clean.includes(brand.toLowerCase())) {
      matchedBrands.push(brand);
    }
  }

  return matchedBrands.length > 0 ? matchedBrands : null;
}

// 9. Brand Size Parser
export function parseBrandSize(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && SIZE_OPTIONS.includes(String(num))) {
    return String(num);
  }
  return null;
}

// 10. Fit Frustration Parser
export function parseFrustration(text: string): 'Waist Gap' | 'Hip Tightness' | 'Wrong Length' | 'Thigh Fit' | 'Rise' | 'Other' | null {
  const clean = text.toLowerCase();
  if (clean.includes('waist gap') || clean.includes('gap')) return 'Waist Gap';
  if (clean.includes('hip tightness') || clean.includes('tight hip') || clean.includes('hips')) return 'Hip Tightness';
  if (clean.includes('length') || clean.includes('wrong length') || clean.includes('short') || clean.includes('long')) return 'Wrong Length';
  if (clean.includes('thigh') || clean.includes('thigh fit') || clean.includes('thighs')) return 'Thigh Fit';
  if (clean.includes('rise')) return 'Rise';
  if (clean.includes('other') || clean.includes('everything') || clean.includes('none')) return 'Other';
  return null;
}
