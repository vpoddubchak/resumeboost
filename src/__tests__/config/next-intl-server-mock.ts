/* eslint-disable @typescript-eslint/no-explicit-any */
import messages from '@/messages/en.json';

function resolveKey(ns: string | undefined, key: string, values?: Record<string, unknown>): string {
  const fullKey = ns ? `${ns}.${key}` : key;
  const parts = fullKey.split('.');
  let result: any = messages;
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return fullKey;
    }
  }
  if (typeof result !== 'string') return fullKey;
  if (values) {
    return result.replace(/\{(\w+)\}/g, (_: string, name: string) =>
      values[name] !== undefined ? String(values[name]) : `{${name}}`
    );
  }
  return result;
}

export async function getTranslations(namespace?: string) {
  return (key: string, values?: Record<string, unknown>) => resolveKey(namespace, key, values);
}

export function setRequestLocale(_locale: string) {
  // no-op in tests
}
