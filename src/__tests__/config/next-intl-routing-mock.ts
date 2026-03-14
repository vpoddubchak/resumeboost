// Mock for next-intl/routing — prevents ESM parse errors in Jest
export function defineRouting(config: { locales: string[]; defaultLocale: string }) {
  return config;
}
