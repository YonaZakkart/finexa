import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getSettings } from './features/settings/settings.service';
import { changeLanguage, initI18n } from './lib/i18n';
import { detectLanguage } from './lib/language';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

async function bootstrap(root: HTMLElement) {
  const detectedLanguage = detectLanguage();
  await initI18n(detectedLanguage);

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  try {
    const settings = await getSettings();
    if (settings.language !== detectedLanguage) {
      await changeLanguage(settings.language);
    }
  } catch (error) {
    console.error('Failed to load settings; keeping the browser language', error);
  }
}

void bootstrap(rootElement);
