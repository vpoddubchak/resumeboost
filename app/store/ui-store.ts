import { create } from 'zustand';
import type {
  UIStore,
  StepNumber,
  StepKey,
  StepStates,
  LoadingStates,
  SkeletonStates,
} from './types';
import { STEP_ORDER } from './types';

const initialSteps: StepStates = {
  upload: 'active',
  analysis: 'disabled',
  review: 'disabled',
  complete: 'disabled',
};

const initialLoading: LoadingStates = {
  upload: false,
  analysis: false,
  saving: false,
  pageTransition: false,
};

const initialSkeletons: SkeletonStates = {
  card: false,
  text: false,
  image: false,
  tableRow: false,
};

export const useUIStore = create<UIStore>()((set, get) => ({
  currentStep: 1,
  steps: { ...initialSteps },
  loading: { ...initialLoading },
  skeletons: { ...initialSkeletons },

  setCurrentStep: (step: StepNumber) => {
    const state = get();
    const targetKey = STEP_ORDER[step - 1];

    // Cannot navigate to disabled steps
    if (state.steps[targetKey] === 'disabled') return;

    const newSteps = { ...state.steps };

    // Mark target step as active
    for (const key of STEP_ORDER) {
      if (key === targetKey) {
        newSteps[key] = 'active';
      } else if (newSteps[key] === 'active') {
        // Keep completed steps as completed; revert active to disabled only if not completed
        // Actually, if navigating back, current active becomes whatever it was
        // The step we're leaving should stay completed if it was completed, otherwise disabled
      }
    }

    // Simpler logic: mark all steps before target as completed (if they were active/completed),
    // target as active, steps after target keep their status unless they were active
    for (let i = 0; i < STEP_ORDER.length; i++) {
      const key = STEP_ORDER[i];
      if (i < step - 1) {
        // Steps before target: mark completed if they aren't already disabled
        if (newSteps[key] !== 'disabled') {
          newSteps[key] = 'completed';
        }
      } else if (i === step - 1) {
        newSteps[key] = 'active';
      }
      // Steps after target: keep their current status
    }

    set({ currentStep: step, steps: newSteps });
  },

  goToNextStep: () => {
    const state = get();
    if (state.currentStep < 4) {
      const nextStep = (state.currentStep + 1) as StepNumber;
      const currentKey = STEP_ORDER[state.currentStep - 1];
      const nextKey = STEP_ORDER[nextStep - 1];

      set({
        currentStep: nextStep,
        steps: {
          ...state.steps,
          [currentKey]: 'completed',
          [nextKey]: 'active',
        },
      });
    }
  },

  goToPreviousStep: () => {
    const state = get();
    if (state.currentStep > 1) {
      const prevStep = (state.currentStep - 1) as StepNumber;
      const prevKey = STEP_ORDER[prevStep - 1];

      // Only navigate back if the previous step is completed
      if (state.steps[prevKey] === 'completed') {
        set({
          currentStep: prevStep,
          steps: {
            ...state.steps,
            [prevKey]: 'active',
          },
        });
      }
    }
  },

  completeStep: (step: StepKey) => {
    const state = get();
    const stepIndex = STEP_ORDER.indexOf(step);
    const nextKey = STEP_ORDER[stepIndex + 1];

    const newSteps = {
      ...state.steps,
      [step]: 'completed' as const,
    };

    // Enable the next step if it exists
    if (nextKey && newSteps[nextKey] === 'disabled') {
      newSteps[nextKey] = 'active';
    }

    const newCurrentStep = nextKey
      ? ((stepIndex + 2) as StepNumber)
      : state.currentStep;

    set({
      steps: newSteps,
      currentStep: newCurrentStep,
    });
  },

  resetSteps: () =>
    set({
      currentStep: 1,
      steps: { ...initialSteps },
    }),

  setLoading: (key: keyof LoadingStates, value: boolean) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  resetLoading: () =>
    set({ loading: { ...initialLoading } }),

  setSkeleton: (key: keyof SkeletonStates, value: boolean) =>
    set((state) => ({
      skeletons: { ...state.skeletons, [key]: value },
    })),
}));

// Memoized selectors for derived state
export const selectCurrentStep = (state: UIStore) => state.currentStep;
export const selectCurrentStepKey = (state: UIStore) => STEP_ORDER[state.currentStep - 1];
export const selectStepStatus = (step: StepKey) => (state: UIStore) => state.steps[step];
export const selectIsStepCompleted = (step: StepKey) => (state: UIStore) => state.steps[step] === 'completed';
export const selectIsAnyLoading = (state: UIStore) =>
  state.loading.upload || state.loading.analysis || state.loading.saving || state.loading.pageTransition;
export const selectLoadingState = (key: keyof LoadingStates) => (state: UIStore) => state.loading[key];
