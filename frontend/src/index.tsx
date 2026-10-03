import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import './index.css';
import App from './App';
import { clearReloadFlag, reloadForNewVersion } from './components/common/RouteError/RouteError';

// Vite fires this when a code-split chunk from an older deploy is gone.
window.addEventListener('vite:preloadError', event => {
  if (reloadForNewVersion()) event.preventDefault();
});
// The page loaded fine, so a future stale-chunk error may reload again.
window.addEventListener('load', () => setTimeout(clearReloadFlag, 10000));
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '389021482805-4h3tmfj224kjo5gq9enb0puehfa4787g.apps.googleusercontent.com'}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
