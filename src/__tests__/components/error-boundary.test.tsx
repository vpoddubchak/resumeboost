import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/app/components/error/error-boundary';
import { ErrorFallback } from '@/app/components/error/error-fallback';

// Component that throws an error for testing
function ProblemChild(): React.ReactNode {
  throw new Error('Test error');
}

// Suppress console.error from ErrorBoundary during tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should render fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should display feature name in error message', () => {
    render(
      <ErrorBoundary feature="resume analysis">
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/resume analysis/)).toBeInTheDocument();
  });

  it('should reset error state when try again is clicked', () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) throw new Error('Test error');
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the component
    shouldThrow = false;

    // Click try again
    fireEvent.click(screen.getByText('Try again'));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

describe('ErrorFallback', () => {
  it('should render error message', () => {
    render(<ErrorFallback error={null} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render try again button when onReset provided', () => {
    const onReset = jest.fn();
    render(<ErrorFallback error={null} onReset={onReset} />);
    const button = screen.getByText('Try again');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should not render try again button when onReset not provided', () => {
    render(<ErrorFallback error={null} />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('should include feature name in message', () => {
    render(<ErrorFallback error={null} feature="file upload" />);
    expect(screen.getByText(/file upload/)).toBeInTheDocument();
  });
});
