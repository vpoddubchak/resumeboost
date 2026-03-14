'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { useUIStore } from '@/app/store/ui-store';
import { apiClient } from '@/app/lib/api-client';

export interface AnalysisResponseData {
  analysisId: number;
  score: number;
  analysisData: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  createdAt: string;
}

interface AnalysisProgressProps {
  onComplete: (data: AnalysisResponseData) => void;
  onError: (message: string) => void;
  uploadId: number;
  jobDescription: string;
}

const STAGE_KEYS = [
  { key: 'stageRetrieving', threshold: 25 },
  { key: 'stageExtracting', threshold: 50 },
  { key: 'stageAnalyzing', threshold: 90 },
  { key: 'stageSaving', threshold: 100 },
] as const;

function getStageKey(progress: number): string {
  for (const stage of STAGE_KEYS) {
    if (progress <= stage.threshold) {
      return stage.key;
    }
  }
  return STAGE_KEYS[STAGE_KEYS.length - 1].key;
}

export function AnalysisProgress({
  onComplete,
  onError,
  uploadId,
  jobDescription,
}: AnalysisProgressProps) {
  const t = useTranslations('resume');
  const locale = useLocale();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const setLoading = useUIStore((state) => state.setLoading);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearProgressTimers = useCallback(() => {
    for (const timer of progressTimersRef.current) {
      clearTimeout(timer);
    }
    progressTimersRef.current = [];
  }, []);

  const simulateProgress = useCallback(() => {
    clearProgressTimers();
    setProgress(0);

    // Stage 1: 0→25% in 1s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(25), 1000)
    );
    // Stage 2: 25→50% at 2s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(50), 2000)
    );
    // Stage 3: 50→70% at 5s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(70), 5000)
    );
    // Stage 3: 70→80% at 10s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(80), 10000)
    );
    // Stage 3: 80→85% at 15s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(85), 15000)
    );
    // Stage 3: 85→88% at 20s
    progressTimersRef.current.push(
      setTimeout(() => setProgress(88), 20000)
    );
  }, [clearProgressTimers]);

  const triggerAnalysis = useCallback(async () => {
    setError(null);
    setLoading('analysis', true);
    simulateProgress();

    abortControllerRef.current = new AbortController();

    try {
      const response = await apiClient.post<AnalysisResponseData>(
        '/api/analyses/run',
        { upload_id: uploadId, job_description: jobDescription, locale },
        { signal: abortControllerRef.current.signal }
      );

      clearProgressTimers();
      if (!isMountedRef.current) return;

      if (response.success) {
        setProgress(100);
        setLoading('analysis', false);
        onComplete(response.data);
      } else {
        setLoading('analysis', false);
        const errorMessage = response.error?.message || 'Analysis failed. Please try again.';
        setError(errorMessage);
        onError(errorMessage);
      }
    } catch (err) {
      clearProgressTimers();
      if (!isMountedRef.current) return;
      setLoading('analysis', false);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      onError(errorMessage);
    }
  }, [uploadId, jobDescription, onComplete, onError, setLoading, simulateProgress, clearProgressTimers]);

  useEffect(() => {
    triggerAnalysis();

    return () => {
      clearProgressTimers();
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setError(null);
    setProgress(0);
    triggerAnalysis().finally(() => {
      if (isMountedRef.current) setIsRetrying(false);
    });
  }, [triggerAnalysis]);

  const stageLabel = t(getStageKey(progress));

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-6" role="alert">
        <div className="flex justify-center">
          <svg className="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t('somethingWentWrong')}</h2>
          <p className="text-base text-gray-400 mt-2">{t('pleaseTryAgain')}</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="mx-auto min-h-[48px] px-8 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Retry analysis"
        >
          {isRetrying ? t('retrying') : t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('analyzingTitle')}</h1>
        <p className="text-base text-gray-400 mt-1" aria-live="polite">
          {stageLabel}
        </p>
      </div>

      <div className="flex justify-center">
        <LoadingSpinner size="lg" label={stageLabel} />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-gray-500" aria-live="polite">
        {progress < 100 ? t('percentComplete', { progress }) : t('analysisComplete')}
      </p>
    </div>
  );
}

export default AnalysisProgress;
