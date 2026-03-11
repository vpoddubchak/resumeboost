import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobDescriptionInput } from '@/app/components/resume/job-description-input';
import { useResumeStore } from '@/app/store/resume-store';

beforeEach(() => {
  useResumeStore.getState().resetAll();
});

afterEach(() => {
  useResumeStore.getState().resetAll();
});

describe('JobDescriptionInput', () => {
  it('should render textarea with label', () => {
    render(<JobDescriptionInput />);

    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show placeholder text', () => {
    render(<JobDescriptionInput />);

    expect(screen.getByPlaceholderText(/paste the job description/i)).toBeInTheDocument();
  });

  it('should update store when text is entered', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Senior developer with 5 years experience' } });

    expect(useResumeStore.getState().jobDescription).toBe('Senior developer with 5 years experience');
  });

  it('should show character count', () => {
    render(<JobDescriptionInput />);

    expect(screen.getByText('0 / 10,000')).toBeInTheDocument();
  });

  it('should update character count on input', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(screen.getByText('11 / 10,000')).toBeInTheDocument();
  });

  it('should show validation hint when under minimum chars', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Short' } });

    expect(screen.getByText(/at least 10 characters required/i)).toBeInTheDocument();
  });

  it('should show default hint when empty', () => {
    render(<JobDescriptionInput />);

    expect(screen.getByText(/enter the full job description/i)).toBeInTheDocument();
  });

  it('should mark textarea as aria-invalid when under minimum', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Short' } });

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not mark textarea as aria-invalid when empty', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('should not mark textarea as aria-invalid when valid', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'This is a valid job description with enough characters' } });

    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('should have maxLength attribute set to 10000', () => {
    render(<JobDescriptionInput />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '10000');
  });
});
