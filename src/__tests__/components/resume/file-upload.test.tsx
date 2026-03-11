import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUpload } from '@/app/components/resume/file-upload';
import { useResumeStore } from '@/app/store/resume-store';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: { user: { userId: 42 } }, status: 'authenticated' }),
}));

jest.mock('@/app/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockXHRInstance = {
  open: jest.fn(),
  setRequestHeader: jest.fn(),
  send: jest.fn(),
  status: 200,
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn((event: string, callback: () => void) => {
    if (event === 'load') {
      setTimeout(callback, 0);
    }
  }),
};

const MockXMLHttpRequest = jest.fn(() => mockXHRInstance);
(global as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = MockXMLHttpRequest;

beforeEach(() => {
  useResumeStore.getState().resetAll();
  jest.clearAllMocks();
});

afterEach(() => {
  useResumeStore.getState().resetAll();
});

function createMockFile(
  name = 'resume.pdf',
  type = 'application/pdf',
  size = 1024 * 100
): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

describe('FileUpload', () => {
  it('should render the drop zone', () => {
    render(<FileUpload />);
    expect(screen.getByRole('region', { name: /file drop zone/i })).toBeInTheDocument();
  });

  it('should render the Choose File button', () => {
    render(<FileUpload />);
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
  });

  it('should render accepted formats hint', () => {
    render(<FileUpload />);
    expect(screen.getByText(/PDF, DOCX, TXT/)).toBeInTheDocument();
    expect(screen.getByText(/15 MB/)).toBeInTheDocument();
  });

  it('should show error for invalid file type', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    const invalidFile = createMockFile('malware.exe', 'application/x-msdownload');

    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.uploadStatus).toBe('error');
      expect(useResumeStore.getState().upload.errorMessage).toContain('Invalid file type');
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('should show error for file exceeding 15MB', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    const oversizedFile = createMockFile('huge.pdf', 'application/pdf', 16 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.errorMessage).toContain('too large');
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('should set selectedFile in store on valid file selection', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/test.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 99 } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    const validFile = createMockFile('resume.pdf', 'application/pdf');

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.selectedFile).toEqual({
        name: 'resume.pdf',
        size: validFile.size,
        type: 'application/pdf',
      });
    });
  });

  it('should call presigned-url API then uploads API on valid file', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/test.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 99 } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile()] } });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/uploads/presigned-url', expect.objectContaining({
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      }));
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/uploads', expect.objectContaining({
        file_name: 'resume.pdf',
        mime_type: 'application/pdf',
        user_id: 42,
      }));
    });
  });

  it('should set uploadStatus to uploaded after successful upload', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/test.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 99 } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile()] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.uploadStatus).toBe('uploaded');
      expect(useResumeStore.getState().upload.uploadId).toBe(99);
    });
  });

  it('should show error when presigned URL request fails', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post.mockResolvedValueOnce({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile()] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.uploadStatus).toBe('error');
      expect(useResumeStore.getState().upload.errorMessage).toBe('Server error');
    });
  });

  it('should show uploaded file name and remove button after successful upload', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/test.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 99 } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile('my-resume.pdf')] } });

    await waitFor(() => {
      expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  it('should reset upload state when remove button is clicked', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/test.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 99 } });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile()] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));

    await waitFor(() => {
      expect(useResumeStore.getState().upload.selectedFile).toBeNull();
      expect(useResumeStore.getState().upload.uploadStatus).toBe('idle');
    });
  });

  it('should apply drag-over styles when dragging over drop zone', () => {
    render(<FileUpload />);

    const dropZone = screen.getByRole('region', { name: /file drop zone/i });
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });

    expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
  });

  it('should remove drag-over styles when dragging leaves drop zone', () => {
    render(<FileUpload />);

    const dropZone = screen.getByRole('region', { name: /file drop zone/i });
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });

    expect(screen.getByText('Drop your resume here')).toBeInTheDocument();

    fireEvent.dragLeave(dropZone, { relatedTarget: null });

    expect(screen.queryByText('Drop your resume here')).not.toBeInTheDocument();
  });

  it('should process dropped file', async () => {
    const { apiClient } = require('@/app/lib/api-client');
    apiClient.post
      .mockResolvedValueOnce({ success: true, data: { uploadUrl: 'https://s3.test/url', fileKey: 'uploads/42/dropped.pdf' } })
      .mockResolvedValueOnce({ success: true, data: { upload_id: 100 } });

    render(<FileUpload />);

    const dropZone = screen.getByRole('region', { name: /file drop zone/i });
    const droppedFile = createMockFile('dropped.pdf');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [droppedFile] },
    });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.selectedFile?.name).toBe('dropped.pdf');
    });
  });

  it('should show error when user is not authenticated', async () => {
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValueOnce({ data: null, status: 'unauthenticated' });

    render(<FileUpload />);

    const input = screen.getByLabelText(/upload resume file/i);
    fireEvent.change(input, { target: { files: [createMockFile()] } });

    await waitFor(() => {
      expect(useResumeStore.getState().upload.errorMessage).toContain('Authentication required');
    });
  });
});
