export const theme = {
  colors: {
    // Bridge dark foundation scale (ink-900 → ink-600)
    bg0: '#0C1220',   // ink-900 — screen background
    bg1: '#111827',   // ink-800 — card background
    bg2: '#1A2333',   // ink-700 — elevated card, input background
    bg3: '#243044',   // ink-600 — borders, dividers

    // Backwards-compatible surface/background/border aliases
    background: '#0C1220',
    surface: '#111827',
    border: '#243044',

    // Text hierarchy
    textPrimary: '#F0F3F7',    // ink-50  — headings, amounts, key figures
    textSecondary: '#C4CBD8',  // ink-100 — body text, descriptions
    textMuted: '#8A96AA',      // ink-200 — timestamps, captions, hints

    // Semantic brand tokens (from Bridge Color System)
    primary: '#1B6FEB',       // Sapphire — Send button, links, active tab
    primaryLight: '#3B8BFF',  // hover / pressed state
    success: '#00C896',       // Emerald — best rate, money received
    secondary: '#F5A623',     // Amber — savings highlight, premium badge
    error: '#FF4D6D',         // Rose — errors, contract risk warnings
    accent: '#9B72FF',        // Violet — AI features, legal screen, premium tier

    // Named brand palette (kept for readability)
    sapphire: '#1B6FEB',
    emerald: '#00C896',
    amberGold: '#F5A623',
    rose: '#FF4D6D',
    violet: '#9B72FF',
    ink: '#0C1220',

    // Backward-compatible aliases (do not remove)
    green: '#1B6FEB',
    blue: '#00C896',
    amber: '#F5A623',
    red: '#FF4D6D',
    yellow: '#F5A623',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    hero: 36,
  },
};
