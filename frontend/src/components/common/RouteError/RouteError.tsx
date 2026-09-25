import React, { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ROUTES } from '../../../constants/routes';

const RELOAD_FLAG = 'lux:chunk-reload';

/** A new deploy replaced the code-split file this tab was about to load. */
export const isStaleChunkError = (error: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i
    .test(String((error as Error)?.message ?? error));

/**
 * Reloads once to pick up the latest deploy. The session flag stops a reload
 * loop if the file is genuinely missing; it is cleared after a successful load.
 */
export function reloadForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearReloadFlag() {
  try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* storage unavailable */ }
}

/** Route-level error page (replaces React Router's developer screen). */
export default function RouteError() {
  const error = useRouteError();
  const stale = isStaleChunkError(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (stale) reloadForNewVersion();
    else console.error('Route error:', error);
  }, [error, stale]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--ink)', color: 'var(--cream)', px: 3, textAlign: 'center' }}>
      <Box sx={{ maxWidth: 460 }}>
        <Typography sx={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>LUX ATELIER</Typography>
        <Typography variant="h2" sx={{ fontSize: '2rem !important', fontWeight: 500, mt: 3, mb: 1.5 }}>
          {stale ? 'We just updated the store' : notFound ? 'Page not found' : 'Something went wrong'}
        </Typography>
        <Typography sx={{ color: 'var(--muted-on-dark)', mb: 4 }}>
          {stale
            ? 'A newer version is available. Reload to continue where you left off.'
            : notFound ? 'The page you were looking for does not exist.' : 'Please try again. If it keeps happening, come back in a few minutes.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => { clearReloadFlag(); window.location.reload(); }} sx={{ background: 'var(--gold) !important', color: 'var(--ink) !important', borderRadius: 0, px: 3 }}>
            Reload
          </Button>
          <Button href={ROUTES.HOME} sx={{ color: 'var(--cream) !important', border: '1px solid rgba(242,237,228,0.4)', borderRadius: 0, px: 3 }}>
            Back to the store
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
