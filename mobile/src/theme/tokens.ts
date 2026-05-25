export type AppTheme = {
  colors: {
    background: string;
    backgroundCanvas: string;
    surface: string;
    surfaceMuted: string;
    surfaceAccent: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    highlight: string;
    accentText: string;
    statusInfo: string;
    statusInfoText: string;
    statusSuccess: string;
    statusSuccessText: string;
    statusDanger: string;
    statusDangerText: string;
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
    xl: number;
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
    sm: 10,
    md: 18,
    lg: 26,
    xl: 34,
  },
};

export const lightTheme: AppTheme = {
  ...baseTheme,
  colors: {
    background: '#F3F7F1',
    backgroundCanvas: '#E4EDDE',
    surface: '#FBFDF8',
    surfaceMuted: '#E0EADD',
    surfaceAccent: '#123127',
    border: '#C8D7C0',
    borderStrong: '#7A9774',
    text: '#18231C',
    textMuted: '#5D6F63',
    primary: '#10935C',
    primaryText: '#FFFFFF',
    secondary: '#E8F1E4',
    secondaryText: '#18231C',
    highlight: '#DFF7E7',
    accentText: '#F7FFF9',
    statusInfo: '#2C63D6',
    statusInfoText: '#F4F7FB',
    statusSuccess: '#159A52',
    statusSuccessText: '#F4FFF7',
    statusDanger: '#C94040',
    statusDangerText: '#FFF5F5',
    danger: '#B91C1C',
  },
};

export const darkTheme: AppTheme = {
  ...baseTheme,
  colors: {
    background: '#09110D',
    backgroundCanvas: '#0F1A15',
    surface: '#122019',
    surfaceMuted: '#20342A',
    surfaceAccent: '#183D2F',
    border: '#274436',
    borderStrong: '#4F8E6C',
    text: '#EFF7F1',
    textMuted: '#A8BAAF',
    primary: '#45C879',
    primaryText: '#072514',
    secondary: '#1A2B23',
    secondaryText: '#EFF7F1',
    highlight: '#1F5A3D',
    accentText: '#F4FFF7',
    statusInfo: '#2C63D6',
    statusInfoText: '#F4F7FB',
    statusSuccess: '#159A52',
    statusSuccessText: '#F4FFF7',
    statusDanger: '#C94040',
    statusDangerText: '#FFF5F5',
    danger: '#F87171',
  },
};
