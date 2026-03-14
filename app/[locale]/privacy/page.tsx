import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('privacy');
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('dataWeCollect')}</h2>
          <p className="text-gray-600">
            {t('dataWeCollectIntro')}
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>{t('dataItems.account')}</li>
            <li>{t('dataItems.resume')}</li>
            <li>{t('dataItems.analysis')}</li>
            <li>{t('dataItems.consultation')}</li>
            <li>{t('dataItems.analytics')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('howWeUseData')}</h2>
          <p className="text-gray-600">
            {t('howWeUseDataText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('yourRights')}</h2>
          <p className="text-gray-600">{t('yourRightsIntro')}</p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>{t('rights.access')}</li>
            <li>{t('rights.erasure')}</li>
            <li>{t('rights.rectification')}</li>
            <li>{t('rights.portability')}</li>
          </ul>
          <p className="text-gray-600 mt-2">
            {t('exerciseRights')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('cookies')}</h2>
          <p className="text-gray-600">
            {t('cookiesText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('dataSecurity')}</h2>
          <p className="text-gray-600">
            {t('dataSecurityText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">{t('contact')}</h2>
          <p className="text-gray-600">
            {t('contactText')}{" "}
            <a href="mailto:privacy@resumeboost.com" className="text-blue-600 hover:underline">
              privacy@resumeboost.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
