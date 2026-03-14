'use client';

import { useTranslations } from 'next-intl';
import { useResumeStore, selectJobDescription } from '@/app/store/resume-store';

export function JobDescriptionInput() {
  const t = useTranslations('resume');
  const jobDescription = useResumeStore(selectJobDescription);
  const setJobDescription = useResumeStore((state) => state.setJobDescription);

  const charCount = jobDescription.length;
  const MAX_CHARS = 10000;
  const MIN_CHARS = 10;

  return (
    <div className="space-y-2">
      <label htmlFor="job-description" className="block text-sm font-medium text-gray-300">
        {t('jobDescriptionLabel')} <span className="text-red-400">*</span>
      </label>
      <textarea
        id="job-description"
        name="job-description"
        rows={6}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder={t('jobDescriptionPlaceholder')}
        maxLength={MAX_CHARS}
        className={[
          'w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 resize-none transition-colors',
          'text-sm leading-relaxed',
          charCount > 0 && charCount < MIN_CHARS
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500',
        ].join(' ')}
        aria-describedby="job-description-hint job-description-count"
        aria-invalid={charCount > 0 && charCount < MIN_CHARS}
      />
      <div className="flex justify-between items-center">
        <p id="job-description-hint" className="text-xs text-gray-500">
          {charCount > 0 && charCount < MIN_CHARS
            ? t('jobDescriptionMinChars', { min: MIN_CHARS })
            : t('jobDescriptionHint')}
        </p>
        <p
          id="job-description-count"
          className={`text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}
          aria-live="polite"
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
