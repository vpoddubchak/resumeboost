'use client';

import { useUIStore, selectCurrentStep } from '@/app/store/ui-store';
import type { StepKey, StepNumber } from '@/app/store/types';

const STEPS: { key: StepKey; label: string; number: StepNumber }[] = [
  { key: 'upload', label: 'Upload', number: 1 },
  { key: 'analysis', label: 'Analysis', number: 2 },
  { key: 'review', label: 'Review', number: 3 },
  { key: 'complete', label: 'Complete', number: 4 },
];

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function StepNavigation() {
  const currentStep = useUIStore(selectCurrentStep);
  const steps = useUIStore((state) => state.steps);
  const setCurrentStep = useUIStore((state) => state.setCurrentStep);

  const handleStepClick = (key: StepKey, stepNumber: StepNumber) => {
    if (steps[key] === 'completed') {
      setCurrentStep(stepNumber);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white font-bold text-lg">ResumeBoost</span>
      </div>

      <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Progress steps">
        {STEPS.map((step, index) => {
          const status = steps[step.key];
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          const isDisabled = status === 'disabled';

          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.key, step.number)}
                disabled={isDisabled}
                aria-current={isActive ? 'step' : undefined}
                aria-disabled={isDisabled}
                aria-label={`Step ${step.number}: ${step.label}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ' (not yet available)'}`}
                className={[
                  'flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'min-h-[44px] min-w-[44px] justify-center sm:justify-start',
                  isActive ? 'bg-blue-600 text-white' : '',
                  isCompleted ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800 cursor-pointer' : '',
                  isDisabled ? 'text-gray-600 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                    isActive ? 'bg-white text-blue-600' : '',
                    isCompleted ? 'bg-blue-500 text-white' : '',
                    isDisabled ? 'bg-gray-700 text-gray-500' : '',
                  ].join(' ')}
                >
                  {isCompleted ? <CheckIcon /> : step.number}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={`w-4 sm:w-6 h-0.5 mx-0.5 sm:mx-1 ${isCompleted ? 'bg-blue-500' : 'bg-gray-700'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
