import { createTheme } from '@mui/material/styles';
import { BRAND } from '../constants/colors';

const DISPLAY = '"Cormorant Garamond", "Times New Roman", serif';
const SANS = '"Jost", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

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
    fontFamily: SANS,
    h1: { fontFamily: DISPLAY, fontWeight: 700, fontSize: '3.5rem', lineHeight: 1.2 },
    h2: { fontFamily: DISPLAY, fontWeight: 600, fontSize: '2.5rem', lineHeight: 1.3 },
    h3: { fontFamily: DISPLAY, fontWeight: 600, fontSize: '2rem', lineHeight: 1.3 },
    h4: { fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
    h5: { fontFamily: DISPLAY, fontWeight: 500, fontSize: '1.25rem', lineHeight: 1.4 },
    h6: { fontFamily: SANS, fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
    body1: { fontFamily: SANS, fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontFamily: SANS, fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontFamily: SANS, fontWeight: 500, fontSize: '1rem' },
    subtitle2: { fontFamily: SANS, fontWeight: 500, fontSize: '0.875rem' },
    button: { fontFamily: SANS, fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' },
    caption: { fontFamily: SANS, fontSize: '0.75rem' },
    overline: { fontFamily: SANS, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.18em', lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: '12px 28px',
          boxShadow: 'none',
          letterSpacing: '0.04em',
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: BRAND.DARK,
          color: BRAND.WHITE,
          '&:hover': { backgroundColor: BRAND.DARK_DEEP },
        },
        outlined: {
          borderColor: BRAND.DARK,
          color: BRAND.DARK,
          '&:hover': { backgroundColor: BRAND.DARK, color: BRAND.WHITE, borderColor: BRAND.DARK },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
          border: `1px solid ${BRAND.BORDER}`,
          transition: 'box-shadow 0.25s ease',
          '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 4 },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
        elevation3: { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.GOLD },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.GOLD, borderWidth: 2 },
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 16, fontWeight: 500 } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.WHITE,
          color: BRAND.DARK,
          boxShadow: 'none',
          borderBottom: `1px solid ${BRAND.BORDER}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 12px',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: 'rgba(200, 164, 110, 0.14)', // gold transparent
            color: BRAND.GOLD_DARK,
            '& .MuiListItemIcon-root': {
              color: BRAND.GOLD_DARK,
            }
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        },
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