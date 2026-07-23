// ============================================================
// 🏆 AURORA GOLD THEME — MyKharcho Mobile Color Palette
// Dark Mode: Deep Charcoal + Gold shimmer
// Light Mode: Warm White + Gold accents
// ============================================================

// Dark Mode (default for mobile)
export const Colors = {
    // ── Backgrounds ──
    background: '#111318',        // Deep charcoal
    surface: '#1C1F28',           // Dark card surface
    surfaceLight: '#22263A',      // Slightly lighter surface
    surfaceHover: '#2A2D3E',      // Hover state

    // ── Aurora Gold Primary ──
    primary: '#F59E0B',           // Gold — main CTA, active states
    primaryDark: '#D97706',       // Darker gold for gradients
    primaryLight: '#FBBF24',      // Light shimmer gold
    accent: '#FCD34D',            // Bright shimmer accent

    // ── Semantic Colors ──
    income: '#06B6D4',            // Cyan — income/credit
    incomeBg: 'rgba(6,182,212,0.12)',
    expense: '#F87171',           // Coral red — expense/debit
    expenseBg: 'rgba(248,113,113,0.12)',
    loan: '#FB923C',              // Orange — loans
    loanBg: 'rgba(251,146,60,0.12)',

    // ── Status ──
    success: '#10B981',           // Emerald green
    danger: '#F87171',            // Coral red
    warning: '#FBBF24',           // Gold warning

    // ── Text ──
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // ── Borders ──
    border: '#2A2D3E',
    borderSubtle: '#1E2130',
    borderGold: '#78511A',        // Gold-tinted border for highlights

    // ── Misc ──
    white: '#ffffff',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.7)',

    // ── Chart Colors (same order as before) ──
    chartColors: ['#F59E0B', '#06B6D4', '#F87171', '#10B981', '#A855F7', '#EC4899', '#64748B'],
};

// Light Mode palette
export const LightColors = {
    background: '#FAFAF5',        // Warm off-white
    surface: '#FFFFFF',
    surfaceLight: '#FFFBEB',
    surfaceHover: '#FEF3C7',

    primary: '#D97706',           // Darker gold for light backgrounds
    primaryDark: '#B45309',
    primaryLight: '#F59E0B',
    accent: '#FBBF24',

    income: '#0891B2',            // Cyan-700
    incomeBg: '#ECFEFF',
    expense: '#EF4444',
    expenseBg: '#FFF1F2',
    loan: '#EA580C',
    loanBg: '#FFF7ED',

    success: '#059669',
    danger: '#EF4444',
    warning: '#D97706',

    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    border: '#FDE68A',            // Warm gold border
    borderSubtle: '#FEF3C7',
    borderGold: '#F59E0B',

    white: '#ffffff',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.5)',

    chartColors: ['#D97706', '#0891B2', '#EF4444', '#059669', '#7C3AED', '#DB2777', '#64748B'],
};
