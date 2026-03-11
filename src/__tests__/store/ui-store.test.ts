import { useUIStore } from '@/app/store/ui-store';

// Reset store between tests
beforeEach(() => {
  useUIStore.getState().resetSteps();
  useUIStore.getState().resetLoading();
});

describe('UI Store', () => {
  describe('initial state', () => {
    it('should start on step 1', () => {
      expect(useUIStore.getState().currentStep).toBe(1);
    });

    it('should have upload as active and rest as disabled', () => {
      const { steps } = useUIStore.getState();
      expect(steps.upload).toBe('active');
      expect(steps.analysis).toBe('disabled');
      expect(steps.review).toBe('disabled');
      expect(steps.complete).toBe('disabled');
    });

    it('should have all loading states as false', () => {
      const { loading } = useUIStore.getState();
      expect(loading.upload).toBe(false);
      expect(loading.analysis).toBe(false);
      expect(loading.saving).toBe(false);
      expect(loading.pageTransition).toBe(false);
    });
  });

  describe('step navigation', () => {
    describe('goToNextStep', () => {
      it('should advance from step 1 to step 2', () => {
        useUIStore.getState().goToNextStep();
        const state = useUIStore.getState();
        expect(state.currentStep).toBe(2);
        expect(state.steps.upload).toBe('completed');
        expect(state.steps.analysis).toBe('active');
      });

      it('should advance sequentially through all 4 steps', () => {
        useUIStore.getState().goToNextStep(); // 1→2
        useUIStore.getState().goToNextStep(); // 2→3
        useUIStore.getState().goToNextStep(); // 3→4

        const state = useUIStore.getState();
        expect(state.currentStep).toBe(4);
        expect(state.steps.upload).toBe('completed');
        expect(state.steps.analysis).toBe('completed');
        expect(state.steps.review).toBe('completed');
        expect(state.steps.complete).toBe('active');
      });

      it('should not advance beyond step 4', () => {
        useUIStore.getState().goToNextStep(); // 1→2
        useUIStore.getState().goToNextStep(); // 2→3
        useUIStore.getState().goToNextStep(); // 3→4
        useUIStore.getState().goToNextStep(); // should stay at 4
        expect(useUIStore.getState().currentStep).toBe(4);
      });
    });

    describe('goToPreviousStep', () => {
      it('should not go below step 1', () => {
        useUIStore.getState().goToPreviousStep();
        expect(useUIStore.getState().currentStep).toBe(1);
      });

      it('should go back to completed step', () => {
        useUIStore.getState().goToNextStep(); // 1→2
        useUIStore.getState().goToPreviousStep(); // 2→1

        const state = useUIStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.steps.upload).toBe('active');
      });
    });

    describe('setCurrentStep', () => {
      it('should not navigate to disabled steps', () => {
        useUIStore.getState().setCurrentStep(3); // step 3 is disabled
        expect(useUIStore.getState().currentStep).toBe(1); // stays at 1
      });

      it('should navigate to completed steps', () => {
        useUIStore.getState().goToNextStep(); // 1→2
        useUIStore.getState().goToNextStep(); // 2→3
        useUIStore.getState().setCurrentStep(1); // back to 1

        const state = useUIStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.steps.upload).toBe('active');
      });
    });

    describe('completeStep', () => {
      it('should mark step as completed and enable next', () => {
        useUIStore.getState().completeStep('upload');
        const state = useUIStore.getState();
        expect(state.steps.upload).toBe('completed');
        expect(state.steps.analysis).toBe('active');
        expect(state.currentStep).toBe(2);
      });

      it('should complete last step without error', () => {
        useUIStore.getState().completeStep('upload');
        useUIStore.getState().completeStep('analysis');
        useUIStore.getState().completeStep('review');
        useUIStore.getState().completeStep('complete');
        const state = useUIStore.getState();
        expect(state.steps.complete).toBe('completed');
      });
    });

    describe('resetSteps', () => {
      it('should reset all steps to initial state', () => {
        useUIStore.getState().goToNextStep();
        useUIStore.getState().goToNextStep();
        useUIStore.getState().resetSteps();

        const state = useUIStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.steps.upload).toBe('active');
        expect(state.steps.analysis).toBe('disabled');
        expect(state.steps.review).toBe('disabled');
        expect(state.steps.complete).toBe('disabled');
      });
    });
  });

  describe('loading states', () => {
    it('should set individual loading state', () => {
      useUIStore.getState().setLoading('upload', true);
      expect(useUIStore.getState().loading.upload).toBe(true);
      expect(useUIStore.getState().loading.analysis).toBe(false);
    });

    it('should reset all loading states', () => {
      useUIStore.getState().setLoading('upload', true);
      useUIStore.getState().setLoading('analysis', true);
      useUIStore.getState().resetLoading();
      const { loading } = useUIStore.getState();
      expect(loading.upload).toBe(false);
      expect(loading.analysis).toBe(false);
    });
  });

  describe('skeleton states', () => {
    it('should set individual skeleton state', () => {
      useUIStore.getState().setSkeleton('card', true);
      expect(useUIStore.getState().skeletons.card).toBe(true);
      expect(useUIStore.getState().skeletons.text).toBe(false);
    });
  });
});
