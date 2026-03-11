import { create } from 'zustand';
import type {
  ResumeStore,
  SelectedFile,
  UploadStatus,
  UploadState,
  AnalysisResult,
} from './types';

const initialUpload: UploadState = {
  selectedFile: null,
  uploadProgress: 0,
  uploadStatus: 'idle',
  uploadId: null,
  errorMessage: null,
};

export const useResumeStore = create<ResumeStore>()((set) => ({
  upload: { ...initialUpload },
  analysis: null,
  jobDescription: '',

  setSelectedFile: (file: SelectedFile | null) =>
    set((state) => ({
      upload: {
        ...state.upload,
        selectedFile: file,
        uploadStatus: file ? 'selecting' : 'idle',
        errorMessage: null,
      },
    })),

  setUploadProgress: (progress: number) =>
    set((state) => ({
      upload: {
        ...state.upload,
        uploadProgress: progress,
        uploadStatus: 'uploading',
      },
    })),

  setUploadStatus: (status: UploadStatus) =>
    set((state) => ({
      upload: { ...state.upload, uploadStatus: status },
    })),

  setUploadId: (id: number | null) =>
    set((state) => ({
      upload: {
        ...state.upload,
        uploadId: id,
        uploadStatus: id ? 'uploaded' : state.upload.uploadStatus,
      },
    })),

  setUploadError: (message: string | null) =>
    set((state) => ({
      upload: {
        ...state.upload,
        errorMessage: message,
        uploadStatus: message ? 'error' : state.upload.uploadStatus,
        uploadProgress: 0,
      },
    })),

  setAnalysisResult: (result: AnalysisResult | null) =>
    set({ analysis: result }),

  setJobDescription: (description: string) =>
    set({ jobDescription: description }),

  resetUpload: () =>
    set({ upload: { ...initialUpload } }),

  resetAll: () =>
    set({
      upload: { ...initialUpload },
      analysis: null,
      jobDescription: '',
    }),
}));

// Memoized selectors for derived state
export const selectUploadStatus = (state: ResumeStore) => state.upload.uploadStatus;
export const selectUploadProgress = (state: ResumeStore) => state.upload.uploadProgress;
export const selectSelectedFile = (state: ResumeStore) => state.upload.selectedFile;
export const selectUploadError = (state: ResumeStore) => state.upload.errorMessage;
export const selectAnalysisResult = (state: ResumeStore) => state.analysis;
export const selectAnalysisScore = (state: ResumeStore) => state.analysis?.score ?? null;
export const selectHasAnalysis = (state: ResumeStore) => state.analysis !== null;
export const selectJobDescription = (state: ResumeStore) => state.jobDescription;
