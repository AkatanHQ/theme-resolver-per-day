# Theme Resolver Per Day

A standalone, reusable module for resolving themes based on dates. Zero dependencies, simple API.

## Installation

```bash
npm install theme-resolver-per-day
```

## Usage

### Simple Example

```typescript
import { resolvePrimaryThemeForDate } from 'theme-resolver-per-day';

// Get today's theme
const theme = resolvePrimaryThemeForDate(new Date());
console.log(theme);
// { name: 'winter', category: 'seasonal', metadata: { description: '...' } }
```

### Get All Matching Themes

```typescript
import { resolveThemesForDate } from 'theme-resolver-per-day';

// Get all themes for Christmas
const themes = resolveThemesForDate(new Date('2025-12-25'));
// [{ name: 'christmas', category: 'seasonal', metadata: {...} }]
```

### With Cultural Themes

```typescript
const themes = resolveThemesForDate(
  new Date('2025-10-23'),
  {
    enabledCultures: ['diwali'],
    userRegion: 'india'
  }
);
// [{ name: 'diwali', category: 'cultural', ... }, ...]
```

## API

### `resolvePrimaryThemeForDate(date, options?)`

Returns the most specific theme for a given date.

**Parameters:**
- `date: Date` - The date to resolve
- `options?: ResolverOptions`
  - `enabledCultures?: string[]` - Cultural themes to enable
  - `userRegion?: string` - User's region

**Returns:** `ResolvedTheme | null`

### `resolveThemesForDate(date, options?)`

Returns all matching themes for a given date, sorted by specificity.

**Parameters:** Same as above

**Returns:** `ResolvedTheme[]`

## Theme Types

The module includes:
- **Seasonal**: winter, spring, summer, autumn, etc.
- **Holidays**: christmas, halloween, easter, thanksgiving, etc.
- **Cultural**: diwali, chinese-new-year, hanukkah, ramadan, etc. (opt-in)
- **Everyday**: fallback theme when nothing matches

## Features

- ✅ Zero dependencies
- ✅ TypeScript support
- ✅ Simple API - just pass a date
- ✅ Handles year wrap-around (e.g., New Year)
- ✅ Calculated holidays (Easter, Thanksgiving)
- ✅ Cultural theme support with opt-in
- ✅ Specificity sorting (shorter duration = higher priority)

## License

MIT

## Repository

https://github.com/storybookly/theme-resolver-per-day
