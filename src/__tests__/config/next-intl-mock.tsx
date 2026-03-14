/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import messages from '@/messages/en.json';

/**
 * Resolve a nested key like "resume.steps.upload" from the messages object.
 */
function resolveKey(ns: string | undefined, key: string, values?: Record<string, unknown>): string {
  const fullKey = ns ? `${ns}.${key}` : key;
  const parts = fullKey.split('.');
  let result: any = messages;
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return fullKey; // fallback: return the key path
    }
  }
  if (typeof result !== 'string') return fullKey;
  // Interpolate {variable} placeholders
  if (values) {
    return result.replace(/\{(\w+)\}/g, (_: string, name: string) =>
      values[name] !== undefined ? String(values[name]) : `{${name}}`
    );
  }
  return result;
}

// Mock useTranslations
export function useTranslations(namespace?: string) {
  const t = (key: string, values?: Record<string, unknown>) => resolveKey(namespace, key, values);
  t.has = (key: string): boolean => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const parts = fullKey.split('.');
    let result: any = messages;
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return false;
      }
    }
    return typeof result === 'string';
  };
  return t;
}

// Mock useLocale
export function useLocale() {
  return 'en';
}

// Mock hasLocale
export function hasLocale(locales: string[], locale: string | undefined): locale is string {
  return typeof locale === 'string' && locales.includes(locale);
}

// Mock NextIntlClientProvider — just render children
export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
