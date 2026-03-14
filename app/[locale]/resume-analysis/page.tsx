'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useUIStore, selectCurrentStep } from '@/app/store/ui-store';
import { useResumeStore, selectUploadStatus, selectJobDescription, selectAnalysisResult } from '@/app/store/resume-store';
import { StepNavigation } from '@/app/components/resume/step-navigation';
import { FileUpload } from '@/app/components/resume/file-upload';
import { JobDescriptionInput } from '@/app/components/resume/job-description-input';
import { UploadProgress } from '@/app/components/resume/upload-progress';
import { AnalysisProgress } from '@/app/components/resume/analysis-progress';
import { AnalysisResults } from '@/app/components/resume/analysis-results';
import { CategoryBreakdown } from '@/app/components/resume/category-breakdown';
import type { CategoryScore } from '@/app/components/resume/category-breakdown';
import type { AnalysisResponseData } from '@/app/components/resume/analysis-progress';
import type { AnalysisResult } from '@/app/store/types';

function UploadStep() {
  const t = useTranslations('resume');
  const uploadStatus = useResumeStore(selectUploadStatus);
  const jobDescription = useResumeStore(selectJobDescription);
  const goToNextStep = useUIStore((state) => state.goToNextStep);

  const isReadyToAnalyze = uploadStatus === 'uploaded' && jobDescription.trim().length > 0;

  const handleAnalyze = () => {
    if (isReadyToAnalyze) {
      goToNextStep();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('uploadTitle')}</h1>
        <p className="text-base text-gray-400 mt-1">
          {t('uploadDescription')}
        </p>
      </div>

      <FileUpload />
      <UploadProgress />
      <JobDescriptionInput />

      <button
        onClick={handleAnalyze}
        disabled={!isReadyToAnalyze}
        aria-disabled={!isReadyToAnalyze}
        className={[
          'w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200',
          'min-h-[48px] flex items-center justify-center gap-2',
          isReadyToAnalyze
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {t('analyzeResume')}
      </button>

      {!isReadyToAnalyze && (
        <p className="text-center text-xs text-gray-500" aria-live="polite">
          {uploadStatus !== 'uploaded' && jobDescription.trim().length === 0
            ? t('uploadBothRequired')
            : uploadStatus !== 'uploaded'
            ? t('waitingForUpload')
            : t('enterJobDescription')}
        </p>
      )}
    </div>
  );
}

function AnalysisStep() {
  const t = useTranslations('resume');
  const uploadId = useResumeStore((state) => state.upload.uploadId);
  const jobDescription = useResumeStore(selectJobDescription);
  const setAnalysisResult = useResumeStore((state) => state.setAnalysisResult);
  const goToNextStep = useUIStore((state) => state.goToNextStep);

  // Guard: if uploadId is null, show error
  if (!uploadId) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">{t('missingUploadTitle')}</h1>
        <p className="text-base text-gray-400">{t('missingUploadDescription')}</p>
        <button
          onClick={() => useUIStore.getState().setCurrentStep(1)}
          className="mx-auto min-h-[48px] px-8 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200"
        >
          {t('goBackToUpload')}
        </button>
      </div>
    );
  }

  const handleComplete = (data: AnalysisResponseData) => {
    const analysisResult: AnalysisResult = {
      analysisId: data.analysisId,
      score: data.score,
      analysisData: data.analysisData,
      recommendations: data.recommendations,
      createdAt: data.createdAt,
    };
    setAnalysisResult(analysisResult);
    goToNextStep();
  };

  const handleError = (_message: string) => {
    // Error is displayed by AnalysisProgress component internally
    // Parent only needs to know for logging/telemetry purposes
  };

  return (
    <AnalysisProgress
      onComplete={handleComplete}
      onError={handleError}
      uploadId={uploadId}
      jobDescription={jobDescription}
    />
  );
}

function ReviewStep() {
  const t = useTranslations('resume');
  const analysis = useResumeStore(selectAnalysisResult);
  const goToNextStep = useUIStore((state) => state.goToNextStep);
  const setCurrentStep = useUIStore((state) => state.setCurrentStep);

  if (!analysis) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-4" role="alert">
        <h1 className="text-2xl font-bold text-white">{t('missingAnalysisTitle')}</h1>
        <p className="text-base text-gray-400">{t('missingAnalysisDescription')}</p>
        <button
          onClick={() => setCurrentStep(1)}
          className="mx-auto min-h-[48px] px-8 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
        >
          {t('goBackToUpload')}
        </button>
      </div>
    );
  }

  const matchScore = analysis.score ?? 0;
  const data = (analysis.analysisData ?? {}) as Record<string, unknown>;
  const strengths = (data.strengths as string[] | undefined) ?? [];
  const weaknesses = (data.weaknesses as string[] | undefined) ?? [];
  const recommendations = (data.recommendations as string[] | undefined) ?? [];

  const categories = useMemo(() => {
    const defaultItem = { score: 0, matched: [] as string[], gaps: [] as string[], analysis: '' };

    // Backward compat: old records have categoryScores (flat numbers), new have categoryBreakdown
    const cb = data.categoryBreakdown as {
      skills: { score: number; matched: string[]; gaps: string[]; analysis: string };
      experience: { score: number; matched: string[]; gaps: string[]; analysis: string };
      qualifications: { score: number; matched: string[]; gaps: string[]; analysis: string };
    } | undefined;

    const legacy = data.categoryScores as {
      skills: number; experience: number; qualifications: number;
    } | undefined;

    const skills = cb?.skills ?? { ...defaultItem, score: legacy?.skills ?? 0 };
    const experience = cb?.experience ?? { ...defaultItem, score: legacy?.experience ?? 0 };
    const qualifications = cb?.qualifications ?? { ...defaultItem, score: legacy?.qualifications ?? 0 };

    return [
      { key: 'skills', label: t('skillsMatch'), ...skills },
      { key: 'experience', label: t('experienceMatch'), ...experience },
      { key: 'qualifications', label: t('qualificationsMatch'), ...qualifications },
    ] satisfies CategoryScore[];
  // eslint-disable-next-line react-hooks/exhaustive-deps -- data ref is stable from Zustand store
  }, [analysis.analysisData]);

  return (
    <div className="w-full space-y-6">
      <AnalysisResults
        matchScore={matchScore}
        strengths={strengths}
        weaknesses={weaknesses}
        recommendations={recommendations}
        categoryBreakdown={<CategoryBreakdown categories={categories} />}
      />

      <div className="w-full max-w-2xl mx-auto space-y-3">
        <button
          onClick={() => goToNextStep()}
          className="w-full min-h-[48px] py-3 px-6 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
        >
          {t('bookConsultation')}
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          className="w-full min-h-[48px] py-3 px-6 rounded-xl font-semibold text-base bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
        >
          {t('backToAnalysis')}
        </button>
      </div>
    </div>
  );
}

function CompleteStep() {
  const t = useTranslations('resume');
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">{t('bookConsultationTitle')}</h1>
      <p className="text-base text-gray-400">{t('bookConsultationComingSoon')}</p>
    </div>
  );
}

export default function ResumeAnalysisPage() {
  const currentStep = useUIStore(selectCurrentStep);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <StepNavigation />
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 sm:py-12">
        {currentStep === 1 && <UploadStep />}
        {currentStep === 2 && <AnalysisStep />}
        {currentStep === 3 && <ReviewStep />}
        {currentStep === 4 && <CompleteStep />}
      </main>
    </div>
  );
}
