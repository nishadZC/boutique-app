import { createTheme } from '@mui/material/styles';
import { BRAND } from '../constants/colors';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.DARK,
      light: BRAND.DARK_SOFT,
      dark: BRAND.DARK_DEEP,
      contrastText: BRAND.WHITE,
    },
    secondary: {
      main: BRAND.GOLD,
      light: BRAND.GOLD_LIGHT,
      dark: BRAND.GOLD_DARK,
      contrastText: BRAND.DARK_DEEP,
    },
    background: {
      default: BRAND.SURFACE,
      paper: BRAND.WHITE,
    },
    text: {
      primary: BRAND.DARK,
      secondary: BRAND.TEXT_SECONDARY,
    },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    info: { main: '#0288d1' },
    success: { main: '#2e7d32' },
  },
  typography: {
    fontFamily: ['"Inter"', '"Playfair Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '3.5rem', lineHeight: 1.2 },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '2.5rem', lineHeight: 1.3 },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '2rem', lineHeight: 1.3 },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
    h5: { fontFamily: '"Playfair Display", serif', fontWeight: 500, fontSize: '1.25rem', lineHeight: 1.4 },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
    body1: { fontFamily: '"Inter", sans-serif', fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontFamily: '"Inter", sans-serif', fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 500, fontSize: '1rem' },
    subtitle2: { fontFamily: '"Inter", sans-serif', fontWeight: 500, fontSize: '0.875rem' },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' },
    caption: { fontFamily: '"Inter", sans-serif', fontSize: '0.75rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          boxShadow: 'none',
          transition: 'all 0.3s ease-in-out',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
        contained: {
          background: `linear-gradient(135deg, ${BRAND.DARK} 0%, ${BRAND.DARK_SOFT} 100%)`,
          color: BRAND.WHITE,
          '&:hover': { background: `linear-gradient(135deg, ${BRAND.DARK_DEEP} 0%, ${BRAND.DARK} 100%)` },
        },
        outlined: {
          borderColor: BRAND.DARK,
          color: BRAND.DARK,
          '&:hover': { backgroundColor: 'rgba(26,26,26,0.04)', borderColor: BRAND.DARK_DEEP },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: `1px solid ${BRAND.BORDER}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        elevation1: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        elevation3: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.GOLD },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.GOLD, borderWidth: 2 },
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 16, fontWeight: 500 } } },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: BRAND.WHITE, color: BRAND.DARK, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderBottom: `1px solid ${BRAND.BORDER}` },
      },
    },
    MuiToolbar: { styleOverrides: { root: { minHeight: 72 } } },
    MuiTypography: {
      styleOverrides: {
        h1: { marginBottom: '1.5rem' },
        h2: { marginBottom: '1.25rem' },
        h3: { marginBottom: '1rem' },
      },
    },
  },
});