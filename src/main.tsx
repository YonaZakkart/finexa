import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getSettings } from './features/settings/settings.service';
import { initI18n } from './lib/i18n';
import { detectLanguage } from './lib/language';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

async function bootstrap(root: HTMLElement) {
  let language = detectLanguage();

  try {
    const settings = await getSettings();
    language = settings.language;
  } catch (error) {
    console.error('Failed to load settings; using the browser language', error);
  }

  await initI18n(language);

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap(rootElement);
