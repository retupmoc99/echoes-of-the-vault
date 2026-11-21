import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled (not loaded from Google), so they work offline.
import '@fontsource-variable/inter';
import '@fontsource/cinzel/500.css';
import { App } from './ui/App';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
