'use client';

import { useUIStore, selectCurrentStep } from '@/app/store/ui-store';
import { useResumeStore, selectUploadStatus, selectJobDescription } from '@/app/store/resume-store';
import { StepNavigation } from '@/app/components/resume/step-navigation';
import { FileUpload } from '@/app/components/resume/file-upload';
import { JobDescriptionInput } from '@/app/components/resume/job-description-input';
import { UploadProgress } from '@/app/components/resume/upload-progress';

function UploadStep() {
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
        <h1 className="text-2xl font-bold text-white">Upload Your Resume</h1>
        <p className="text-base text-gray-400 mt-1">
          Upload your resume and paste the job description to get personalized AI analysis
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
        Analyze Resume
      </button>

      {!isReadyToAnalyze && (
        <p className="text-center text-xs text-gray-500" aria-live="polite">
          {uploadStatus !== 'uploaded' && jobDescription.trim().length === 0
            ? 'Upload your resume and enter job description to continue'
            : uploadStatus !== 'uploaded'
            ? 'Waiting for resume upload to complete...'
            : 'Enter a job description to continue'}
        </p>
      )}
    </div>
  );
}

function AnalysisStep() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Analyzing Your Resume</h1>
      <p className="text-base text-gray-400">AI analysis in progress — coming in Story 1.2</p>
    </div>
  );
}

function ReviewStep() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Review Results</h1>
      <p className="text-base text-gray-400">Results display — coming in Story 1.3</p>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Book a Consultation</h1>
      <p className="text-base text-gray-400">Consultation booking — coming in Story 3.1</p>
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
