import { useResumeStore } from '@/app/store/resume-store';
import type { SelectedFile, AnalysisResult } from '@/app/store/types';

// Reset store between tests
beforeEach(() => {
  useResumeStore.getState().resetAll();
});

describe('Resume Store', () => {
  const mockFile: SelectedFile = {
    name: 'resume.pdf',
    size: 1024000,
    type: 'application/pdf',
  };

  const mockAnalysis: AnalysisResult = {
    analysisId: 1,
    score: 85,
    analysisData: { sections: ['experience', 'skills'] },
    recommendations: { improve: ['Add metrics'] },
    createdAt: '2026-03-11T10:00:00Z',
  };

  describe('initial state', () => {
    it('should have idle upload state', () => {
      const { upload } = useResumeStore.getState();
      expect(upload.selectedFile).toBeNull();
      expect(upload.uploadProgress).toBe(0);
      expect(upload.uploadStatus).toBe('idle');
      expect(upload.uploadId).toBeNull();
      expect(upload.errorMessage).toBeNull();
    });

    it('should have null analysis', () => {
      expect(useResumeStore.getState().analysis).toBeNull();
    });

    it('should have empty job description', () => {
      expect(useResumeStore.getState().jobDescription).toBe('');
    });
  });

  describe('file selection', () => {
    it('should set selected file and status to selecting', () => {
      useResumeStore.getState().setSelectedFile(mockFile);
      const { upload } = useResumeStore.getState();
      expect(upload.selectedFile).toEqual(mockFile);
      expect(upload.uploadStatus).toBe('selecting');
      expect(upload.errorMessage).toBeNull();
    });

    it('should clear selected file and reset to idle', () => {
      useResumeStore.getState().setSelectedFile(mockFile);
      useResumeStore.getState().setSelectedFile(null);
      const { upload } = useResumeStore.getState();
      expect(upload.selectedFile).toBeNull();
      expect(upload.uploadStatus).toBe('idle');
    });
  });

  describe('upload progress', () => {
    it('should set upload progress and status to uploading', () => {
      useResumeStore.getState().setUploadProgress(50);
      const { upload } = useResumeStore.getState();
      expect(upload.uploadProgress).toBe(50);
      expect(upload.uploadStatus).toBe('uploading');
    });

    it('should track progress from 0 to 100', () => {
      useResumeStore.getState().setUploadProgress(0);
      expect(useResumeStore.getState().upload.uploadProgress).toBe(0);
      useResumeStore.getState().setUploadProgress(100);
      expect(useResumeStore.getState().upload.uploadProgress).toBe(100);
    });
  });

  describe('upload completion', () => {
    it('should set upload id and status to uploaded', () => {
      useResumeStore.getState().setUploadId(42);
      const { upload } = useResumeStore.getState();
      expect(upload.uploadId).toBe(42);
      expect(upload.uploadStatus).toBe('uploaded');
    });

    it('should handle null upload id', () => {
      useResumeStore.getState().setUploadId(42);
      useResumeStore.getState().setUploadId(null);
      expect(useResumeStore.getState().upload.uploadId).toBeNull();
    });
  });

  describe('upload error', () => {
    it('should set error message and status to error', () => {
      useResumeStore.getState().setUploadError('File too large');
      const { upload } = useResumeStore.getState();
      expect(upload.errorMessage).toBe('File too large');
      expect(upload.uploadStatus).toBe('error');
      expect(upload.uploadProgress).toBe(0);
    });

    it('should clear error', () => {
      useResumeStore.getState().setUploadError('File too large');
      useResumeStore.getState().setUploadError(null);
      expect(useResumeStore.getState().upload.errorMessage).toBeNull();
    });
  });

  describe('analysis result', () => {
    it('should set analysis result', () => {
      useResumeStore.getState().setAnalysisResult(mockAnalysis);
      expect(useResumeStore.getState().analysis).toEqual(mockAnalysis);
    });

    it('should clear analysis result', () => {
      useResumeStore.getState().setAnalysisResult(mockAnalysis);
      useResumeStore.getState().setAnalysisResult(null);
      expect(useResumeStore.getState().analysis).toBeNull();
    });
  });

  describe('job description', () => {
    it('should set job description', () => {
      useResumeStore.getState().setJobDescription('Senior developer role');
      expect(useResumeStore.getState().jobDescription).toBe('Senior developer role');
    });
  });

  describe('reset', () => {
    it('should reset upload state only', () => {
      useResumeStore.getState().setSelectedFile(mockFile);
      useResumeStore.getState().setUploadProgress(50);
      useResumeStore.getState().setAnalysisResult(mockAnalysis);
      useResumeStore.getState().setJobDescription('test');

      useResumeStore.getState().resetUpload();

      expect(useResumeStore.getState().upload.selectedFile).toBeNull();
      expect(useResumeStore.getState().upload.uploadProgress).toBe(0);
      expect(useResumeStore.getState().analysis).toEqual(mockAnalysis);
      expect(useResumeStore.getState().jobDescription).toBe('test');
    });

    it('should reset all state', () => {
      useResumeStore.getState().setSelectedFile(mockFile);
      useResumeStore.getState().setAnalysisResult(mockAnalysis);
      useResumeStore.getState().setJobDescription('test');

      useResumeStore.getState().resetAll();

      expect(useResumeStore.getState().upload.selectedFile).toBeNull();
      expect(useResumeStore.getState().analysis).toBeNull();
      expect(useResumeStore.getState().jobDescription).toBe('');
    });
  });
});
