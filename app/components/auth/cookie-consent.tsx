"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";
const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
};

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CookiePreferences;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = getCookiePreferences();
    if (!stored) {
      setVisible(true);
    } else {
      setPreferences(stored);
    }
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const toSave = { ...prefs, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toSave));
    setPreferences(toSave);
    setVisible(false);
    setShowSettings(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({ necessary: true, functional: true, analytics: true });
  }, [savePreferences]);

  const acceptNecessaryOnly = useCallback(() => {
    savePreferences({ necessary: true, functional: false, analytics: false });
  }, [savePreferences]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {!showSettings ? (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {t('message')}{" "}
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {t('managePreferences')}
                </button>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={acceptNecessaryOnly}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t('necessaryOnly')}
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('acceptAll')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{t('preferencesTitle')}</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('necessary')}</span>
                  <p className="text-xs text-gray-500">{t('necessaryDescription')}</p>
                </div>
                <input type="checkbox" checked disabled className="h-4 w-4 rounded" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('functional')}</span>
                  <p className="text-xs text-gray-500">{t('functionalDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, functional: e.target.checked }))
                  }
                  className="h-4 w-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('analytics')}</span>
                  <p className="text-xs text-gray-500">{t('analyticsDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, analytics: e.target.checked }))
                  }
                  className="h-4 w-4 rounded"
                />
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t('back')}
              </button>
              <button
                onClick={() => savePreferences(preferences)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('savePreferences')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
