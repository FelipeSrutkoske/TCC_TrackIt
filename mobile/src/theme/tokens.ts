export type AppTheme = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    danger: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};

const baseTheme = {
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
  },
};

export const lightTheme: AppTheme = {
  ...baseTheme,
  colors: {
    background: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceMuted: '#E5E7EB',
    border: '#D1D5DB',
    text: '#111827',
    textMuted: '#4B5563',
    primary: '#1F3C88',
    primaryText: '#FFFFFF',
    secondary: '#E5E7EB',
    secondaryText: '#111827',
    danger: '#B91C1C',
  },
};

export const darkTheme: AppTheme = {
  ...baseTheme,
  colors: {
    background: '#111827',
    surface: '#1F2937',
    surfaceMuted: '#374151',
    border: '#4B5563',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    primary: '#60A5FA',
    primaryText: '#0F172A',
    secondary: '#374151',
    secondaryText: '#F9FAFB',
    danger: '#F87171',
  },
};
