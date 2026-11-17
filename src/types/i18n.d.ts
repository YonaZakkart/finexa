import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: Record<string, string>;
      dashboard: Record<string, string>;
      expenses: Record<string, string>;
      debts: Record<string, string>;
      summary: Record<string, string>;
      onboarding: Record<string, string>;
    };
  }
}
