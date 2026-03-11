import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UploadProgress } from '@/app/components/resume/upload-progress';
import { useResumeStore } from '@/app/store/resume-store';

beforeEach(() => {
  useResumeStore.getState().resetAll();
});

afterEach(() => {
  useResumeStore.getState().resetAll();
});

describe('UploadProgress', () => {
  it('should render nothing when upload status is idle', () => {
    const { container } = render(<UploadProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('should show file name and size when a file is selected', () => {
    useResumeStore.getState().setSelectedFile({ name: 'resume.pdf', size: 512000, type: 'application/pdf' });

    render(<UploadProgress />);

    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    expect(screen.getByText('500.0 KB')).toBeInTheDocument();
  });

  it('should show progress bar during upload', () => {
    useResumeStore.getState().setSelectedFile({ name: 'resume.pdf', size: 1024, type: 'application/pdf' });
    useResumeStore.getState().setUploadProgress(45);

    render(<UploadProgress />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getAllByText('Uploading...').length).toBeGreaterThanOrEqual(1);
  });

  it('should show success message when upload completes', () => {
    useResumeStore.getState().setSelectedFile({ name: 'resume.pdf', size: 1024, type: 'application/pdf' });
    useResumeStore.getState().setUploadId(42);

    render(<UploadProgress />);

    expect(screen.getByText('Resume uploaded successfully')).toBeInTheDocument();
  });

  it('should show error message on upload failure', () => {
    useResumeStore.getState().setSelectedFile({ name: 'resume.pdf', size: 1024, type: 'application/pdf' });
    useResumeStore.getState().setUploadError('Network error');

    render(<UploadProgress />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should format file sizes correctly', () => {
    useResumeStore.getState().setSelectedFile({ name: 'big.pdf', size: 5 * 1024 * 1024, type: 'application/pdf' });

    render(<UploadProgress />);

    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
  });

  it('should show spinner during uploading state', () => {
    useResumeStore.getState().setSelectedFile({ name: 'resume.pdf', size: 1024, type: 'application/pdf' });
    useResumeStore.getState().setUploadProgress(10);

    render(<UploadProgress />);

    expect(screen.getByLabelText('Uploading...')).toBeInTheDocument();
  });
});
