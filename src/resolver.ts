/**
 * Theme Resolver Per Day - Standalone Module
 * 
 * A reusable module for resolving themes based on dates.
 * Configuration is included internally - just pass a date and get themes.
 */

import themeRulesConfigJson from './themeRules.json';
const themeRulesConfig = themeRulesConfigJson as any;

export type DateRule = 
  | { kind: 'range'; from: string; to: string }
  | { kind: 'holiday-offset'; holiday: 'easter'; start: number; end: number }
  | { kind: 'nth-weekday'; month: number; weekday: number; n: number; duration?: number }
  | { kind: 'always' };

export interface ThemeRule {
  name: string;
  rule: DateRule;
  enabled?: boolean;
  region?: string[];
  metadata?: {
    actualDate?: string;
    description?: string;
  };
}

export interface ThemeRulesConfig {
  seasonal: ThemeRule[];
  holidays: ThemeRule[];
  cultural: ThemeRule[];
  everyday: ThemeRule[];
}

export interface ResolverOptions {
  enabledCultures?: string[];
  userRegion?: string;
}

export interface ResolvedTheme {
  name: string;
  category: 'seasonal' | 'holidays' | 'cultural' | 'everyday';
  rule: DateRule;
  metadata?: {
    actualDate?: string;
    description?: string;
  };
}

/**
 * Resolve themes for a specific date
 * 
 * @param date - The date to resolve themes for
 * @param options - Optional filters for cultural themes and region
 * @returns Array of resolved themes, sorted by specificity (shortest duration first)
 * 
 * @example
 * ```typescript
 * const themes = resolveThemesForDate(
 *   new Date('2025-12-25'),
 *   { enabledCultures: ['diwali'], userRegion: 'india' }
 * );
 * // Returns: [{ name: 'christmas', category: 'seasonal', metadata: {...} }]
 * ```
 */
export function resolveThemesForDate(
  date: Date,
  options: ResolverOptions = {}
): ResolvedTheme[] {
  const { enabledCultures = [], userRegion } = options;
  const year = date.getFullYear();
  
  // Use internal config and flatten with category
  const config = themeRulesConfig as ThemeRulesConfig;
  const allRules: Array<ThemeRule & { category: 'seasonal' | 'holidays' | 'cultural' | 'everyday' }> = [
    ...config.seasonal.map(rule => ({ ...rule, category: 'seasonal' as const })),
    ...config.holidays.map(rule => ({ ...rule, category: 'holidays' as const })),
    ...config.cultural.map(rule => ({ ...rule, category: 'cultural' as const })),
    ...config.everyday.map(rule => ({ ...rule, category: 'everyday' as const }))
  ];
  
  // Filter available themes based on enabled cultures and region
  const availableRules = allRules.filter(rule => {
    // Skip everyday theme in first pass
    if (rule.name === 'everyday') {
      return false;
    }
    
    // Always include non-cultural themes (enabled undefined or true)
    if (rule.enabled === undefined || rule.enabled === true) {
      return true;
    }
    
    // For cultural themes, check if they're enabled
    if (rule.enabled === false) {
      return enabledCultures.includes(rule.name) || 
             (rule.region && userRegion && rule.region.includes(userRegion));
    }
    
    return false;
  });
  
  // Find all matching themes
  const matchingThemes: ResolvedTheme[] = [];
  
  for (const rule of availableRules) {
    if (isRuleActive(rule.rule, date, year)) {
      matchingThemes.push({
        name: rule.name,
        category: rule.category,
        rule: rule.rule,
        metadata: rule.metadata
      });
    }
  }
  
  // Sort by duration (shortest first = most specific)
  matchingThemes.sort((a, b) => {
    const ruleA = allRules.find(r => r.name === a.name)!;
    const ruleB = allRules.find(r => r.name === b.name)!;
    const durationA = getThemeDuration(ruleA.rule, year);
    const durationB = getThemeDuration(ruleB.rule, year);
    return durationA - durationB;
  });
  
  // If no themes match, return everyday theme
  if (matchingThemes.length === 0) {
    const everydayRule = config.everyday.find(r => r.name === 'everyday');
    if (everydayRule) {
      matchingThemes.push({
        name: 'everyday',
        category: 'everyday',
        rule: everydayRule.rule,
        metadata: everydayRule.metadata
      });
    }
  }
  
  return matchingThemes;
}

/**
 * Get the primary (most specific) theme for a date
 * 
 * @param date - The date to resolve theme for
 * @param options - Optional filters for cultural themes and region
 * @returns The most specific matching theme, or null if none found
 * 
 * @example
 * ```typescript
 * const theme = resolvePrimaryThemeForDate(new Date('2025-10-31'));
 * // Returns: { name: 'halloween', category: 'holidays', metadata: {...} }
 * ```
 */
export function resolvePrimaryThemeForDate(
  date: Date,
  options: ResolverOptions = {}
): ResolvedTheme | null {
  const themes = resolveThemesForDate(date, options);
  return themes.length > 0 ? themes[0] : null;
}

/**
 * Check if a date rule is active for a given date
 */
function isRuleActive(rule: DateRule, date: Date, year: number): boolean {
  switch (rule.kind) {
    case 'range':
      return isInRange(rule.from, rule.to, date);
    case 'holiday-offset':
      return isHolidayOffsetActive(rule.holiday, rule.start, rule.end, date, year);
    case 'nth-weekday':
      return isNthWeekdayActive(rule.month, rule.weekday, rule.n, rule.duration || 1, date);
    case 'always':
      return true;
    default:
      return false;
  }
}

/**
 * Check if a date falls within a range
 */
function isInRange(from: string, to: string, date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const currentDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  // Handle year wrap-around (e.g., Christmas: 12-26 to 01-07)
  if (from <= to) {
    return currentDate >= from && currentDate <= to;
  } else {
    return currentDate >= from || currentDate <= to;
  }
}

/**
 * Check if a date is within a holiday offset range
 */
function isHolidayOffsetActive(
  holiday: 'easter',
  startOffset: number,
  endOffset: number,
  date: Date,
  year: number
): boolean {
  let holidayDate: Date;
  
  switch (holiday) {
    case 'easter':
      holidayDate = calculateEaster(year);
      break;
    default:
      return false;
  }
  
  const startDate = new Date(holidayDate);
  startDate.setDate(startDate.getDate() + startOffset);
  
  const endDate = new Date(holidayDate);
  endDate.setDate(endDate.getDate() + endOffset);
  
  return date >= startDate && date <= endDate;
}

/**
 * Check if a date matches the nth weekday of a month
 */
function isNthWeekdayActive(
  month: number,
  weekday: number,
  n: number,
  duration: number = 1,
  date: Date
): boolean {
  const year = date.getFullYear();
  
  // Find the nth occurrence of the weekday in the month
  let count = 0;
  let targetDate: Date | null = null;
  
  for (let day = 1; day <= 31; day++) {
    const testDate = new Date(year, month - 1, day);
    if (testDate.getMonth() !== month - 1) break;
    
    if (testDate.getDay() === weekday) {
      count++;
      if (count === n) {
        targetDate = testDate;
        break;
      }
    }
  }
  
  if (!targetDate) return false;
  
  // If duration is specified, check if date is within the duration window
  if (duration > 1) {
    const halfDuration = Math.floor(duration / 2);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - halfDuration);
    
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + (duration - halfDuration - 1));
    
    return date >= startDate && date <= endDate;
  }
  
  // Single day event - exact match
  return date.toDateString() === targetDate.toDateString();
}

/**
 * Calculate Easter date using Gauss algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Calculate theme duration in days
 */
function getThemeDuration(rule: DateRule, year: number): number {
  switch (rule.kind) {
    case 'range': {
      const [fromMonth, fromDay] = rule.from.split('-').map(Number);
      const [toMonth, toDay] = rule.to.split('-').map(Number);
      
      const startDate = new Date(year, fromMonth - 1, fromDay);
      const endDate = new Date(year, toMonth - 1, toDay);
      
      // Handle year wrap-around
      if (endDate < startDate) {
        endDate.setFullYear(year + 1);
      }
      
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    case 'holiday-offset': {
      return Math.abs(rule.end - rule.start) + 1;
    }
    case 'nth-weekday': {
      return rule.duration || 1;
    }
    case 'always': {
      return Infinity;
    }
    default:
      return Infinity;
  }
}
