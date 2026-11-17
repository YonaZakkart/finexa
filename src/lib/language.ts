export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function getBrowserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') {
    return [];
  }

  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
}

export function detectLanguage(
  languages: readonly string[] = getBrowserLanguages()
): SupportedLanguage {
  for (const language of languages) {
    const code = language.toLowerCase().split('-')[0];
    if (code === 'es' || code === 'en') {
      return code;
    }
  }

  return 'en';
}
