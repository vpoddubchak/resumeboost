'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/app/i18n/navigation';
import { routing } from '@/app/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.replace(pathname, { locale: newLocale as (typeof routing.locales)[number] });
  };

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t('switchLanguage')}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          role="radio"
          aria-checked={locale === loc}
          onClick={() => handleSwitch(loc)}
          className={[
            'px-2 py-1 text-xs font-semibold rounded transition-colors min-h-[32px] min-w-[32px]',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900 focus-visible:outline-none',
            locale === loc
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800',
          ].join(' ')}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
