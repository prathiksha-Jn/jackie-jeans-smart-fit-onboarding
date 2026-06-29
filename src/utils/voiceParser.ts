/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BRAND_OPTIONS, HEIGHT_OPTIONS, SIZE_OPTIONS } from '../types';

// Simple text to number dictionary
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

export function parseSpokenNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();

  const digitMatch = clean.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

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

export function parseHeight(text: string): string | null {
  const clean = text.toLowerCase();

  let feet = 5;
  let inches = 0;

  const feetMatch = clean.match(/(4|5|6)\s*(foot|feet|ft|')?/i);
  const wordFeetMatch = clean.match(/(four|five|six)\s*(foot|feet|ft|')?/i);

  if (feetMatch) {
    feet = parseInt(feetMatch[1], 10);
  } else if (wordFeetMatch) {
    const word = wordFeetMatch[1];
    if (word === 'four') feet = 4;
    if (word === 'five') feet = 5;
    if (word === 'six') feet = 6;
  }

  const remainingClean = clean.replace(/(four|five|six|4|5|6)\s*(foot|feet|ft|')?/i, '');
  const inchVal = parseSpokenNumber(remainingClean);
  if (inchVal !== null && inchVal >= 0 && inchVal <= 11) {
    inches = inchVal;
  } else if (clean.includes('ten')) {
    inches = 10;
  } else if (clean.includes('eleven')) {
    inches = 11;
  } else {
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

  for (const option of HEIGHT_OPTIONS) {
    const cleanOption = option.replace(/['"]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.includes(cleanOption) || clean.includes(option)) {
      return option;
    }
  }

  return null;
}

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

export function parseWaist(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && num >= 24 && num <= 52) {
    return String(num);
  }
  return null;
}

export function parseHips(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && num >= 32 && num <= 60) {
    return String(num);
  }
  return null;
}

export function parseWaistPreference(text: string): 'Snug' | 'Slightly Relaxed' | 'Relaxed' | null {
  const clean = text.toLowerCase();
  if (clean.includes('slightly relaxed') || clean.includes('slightly')) return 'Slightly Relaxed';
  if (clean.includes('snug') || clean.includes('tight') || clean.includes('fitted')) return 'Snug';
  if (clean.includes('relaxed') || clean.includes('loose')) return 'Relaxed';
  return null;
}

export function parseWaistbandPosition(text: string): 'High Rise' | 'Mid Rise' | 'Low Rise' | null {
  const clean = text.toLowerCase();
  if (clean.includes('high rise') || clean.includes('high')) return 'High Rise';
  if (clean.includes('mid rise') || clean.includes('mid') || clean.includes('medium')) return 'Mid Rise';
  if (clean.includes('low rise') || clean.includes('low')) return 'Low Rise';
  return null;
}

export function parseThighFit(text: string): 'Fitted' | 'Relaxed' | 'Loose' | null {
  const clean = text.toLowerCase();
  if (clean.includes('fitted') || clean.includes('tight')) return 'Fitted';
  if (clean.includes('slightly loose') || clean.includes('relaxed')) return 'Relaxed';
  if (clean.includes('loose') || clean.includes('baggy') || clean.includes('wide')) return 'Loose';
  return null;
}

export function parseBrands(text: string): string[] | null {
  const clean = text.toLowerCase();

  // Handle special keywords before individual brand matching
  const allPhrases = ['all brands', 'all of them', 'all of the above', 'every brand', 'everything'];
  if (allPhrases.some((p) => clean.includes(p)) || clean.trim() === 'all') {
    return BRAND_OPTIONS;
  }

  const nonePhrases = ["none", "no brands", "haven't bought any", "no", "nothing", "neither"];
  if (nonePhrases.some((p) => clean.includes(p))) {
    return [];
  }

  const matchedBrands: string[] = [];
  for (const brand of BRAND_OPTIONS) {
    const normalizedBrand = brand.toLowerCase().replace(/['']/g, '');
    if (clean.includes(normalizedBrand) || clean.includes(brand.toLowerCase())) {
      matchedBrands.push(brand);
    }
  }

  return matchedBrands.length > 0 ? matchedBrands : null;
}

export function parseBrandSize(text: string): string | null {
  const num = parseSpokenNumber(text);
  if (num && SIZE_OPTIONS.includes(String(num))) {
    return String(num);
  }
  return null;
}

export function parseFrustration(
  text: string
): 'Waist Gap' | 'Hip Tightness' | 'Wrong Length' | 'Thigh Fit' | 'Rise' | 'Other' | null {
  const clean = text.toLowerCase();
  if (clean.includes('waist gap') || clean.includes('gap')) return 'Waist Gap';
  if (clean.includes('hip tightness') || clean.includes('tight hip') || clean.includes('hips')) return 'Hip Tightness';
  if (clean.includes('length') || clean.includes('wrong length') || clean.includes('short') || clean.includes('long')) return 'Wrong Length';
  if (clean.includes('thigh') || clean.includes('thigh fit') || clean.includes('thighs')) return 'Thigh Fit';
  if (clean.includes('rise')) return 'Rise';
  if (clean.includes('other') || clean.includes('everything') || clean.includes('none')) return 'Other';
  return null;
}