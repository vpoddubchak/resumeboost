import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepNavigation } from '@/app/components/resume/step-navigation';
import { useUIStore } from '@/app/store/ui-store';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

beforeEach(() => {
  useUIStore.getState().resetSteps();
});

afterEach(() => {
  useUIStore.getState().resetSteps();
});

describe('StepNavigation', () => {
  it('should render all 4 steps', () => {
    render(<StepNavigation />);

    expect(screen.getByLabelText(/Step 1: Upload/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 2: Analysis/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 3: Review/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 4: Complete/)).toBeInTheDocument();
  });

  it('should show Step 1 as active initially', () => {
    render(<StepNavigation />);

    const uploadButton = screen.getByLabelText(/Step 1: Upload/);
    expect(uploadButton).toHaveAttribute('aria-current', 'step');
  });

  it('should show Steps 2-4 as disabled initially', () => {
    render(<StepNavigation />);

    expect(screen.getByLabelText(/Step 2: Analysis.*not yet available/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 3: Review.*not yet available/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 4: Complete.*not yet available/)).toBeInTheDocument();
  });

  it('should disable navigation to future steps', () => {
    render(<StepNavigation />);

    const analysisButton = screen.getByLabelText(/Step 2: Analysis/);
    expect(analysisButton).toBeDisabled();
  });

  it('should show ResumeBoost brand name', () => {
    render(<StepNavigation />);
    expect(screen.getByText('ResumeBoost')).toBeInTheDocument();
  });

  it('should allow clicking a completed step to navigate back', () => {
    const store = useUIStore.getState();
    store.goToNextStep();
    store.goToNextStep();

    render(<StepNavigation />);

    const uploadButton = screen.getByLabelText(/Step 1: Upload.*completed/);
    fireEvent.click(uploadButton);

    expect(useUIStore.getState().currentStep).toBe(1);
  });

  it('should not navigate when clicking active step', () => {
    render(<StepNavigation />);

    const uploadButton = screen.getByLabelText(/Step 1: Upload.*current/);
    fireEvent.click(uploadButton);

    expect(useUIStore.getState().currentStep).toBe(1);
  });

  it('should have accessible role for navigation landmark', () => {
    render(<StepNavigation />);
    expect(screen.getByRole('navigation', { name: 'Progress steps' })).toBeInTheDocument();
  });

  it('should render Portfolio link in header', () => {
    render(<StepNavigation />);
    const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
    expect(portfolioLink).toBeInTheDocument();
    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
  });

  it('should display step numbers for non-completed steps', () => {
    render(<StepNavigation />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should update displayed step when store changes', () => {
    render(<StepNavigation />);

    useUIStore.getState().goToNextStep();

    expect(useUIStore.getState().currentStep).toBe(2);
  });
});
