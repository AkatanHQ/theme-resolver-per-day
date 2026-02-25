/**
 * Theme Resolver Per Day - Standalone Module
 *
 * A reusable module for resolving themes based on dates.
 * Configuration is included internally - just pass a date and get themes.
 */
export type DateRule = {
    kind: 'range';
    from: string;
    to: string;
} | {
    kind: 'holiday-offset';
    holiday: 'easter';
    start: number;
    end: number;
} | {
    kind: 'nth-weekday';
    month: number;
    weekday: number;
    n: number;
    duration?: number;
} | {
    kind: 'always';
};
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
export declare function resolveThemesForDate(date: Date, options?: ResolverOptions): ResolvedTheme[];
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
export declare function resolvePrimaryThemeForDate(date: Date, options?: ResolverOptions): ResolvedTheme | null;
//# sourceMappingURL=resolver.d.ts.map