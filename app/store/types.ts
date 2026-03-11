// Shared TypeScript types for all Zustand stores

// ============================================================
// Auth Store Types
// ============================================================

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// ============================================================
// UI Store Types
// ============================================================

export type StepKey = 'upload' | 'analysis' | 'review' | 'complete';
export type StepStatus = 'disabled' | 'active' | 'completed';
export type StepNumber = 1 | 2 | 3 | 4;

export const STEP_ORDER: readonly StepKey[] = ['upload', 'analysis', 'review', 'complete'] as const;

export const STEP_NUMBER_MAP: Record<StepKey, StepNumber> = {
  upload: 1,
  analysis: 2,
  review: 3,
  complete: 4,
} as const;

export interface StepStates {
  upload: StepStatus;
  analysis: StepStatus;
  review: StepStatus;
  complete: StepStatus;
}

export interface LoadingStates {
  upload: boolean;
  analysis: boolean;
  saving: boolean;
  pageTransition: boolean;
}

export interface SkeletonStates {
  card: boolean;
  text: boolean;
  image: boolean;
  tableRow: boolean;
}

export interface UIState {
  currentStep: StepNumber;
  steps: StepStates;
  loading: LoadingStates;
  skeletons: SkeletonStates;
}

export interface UIActions {
  setCurrentStep: (step: StepNumber) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeStep: (step: StepKey) => void;
  resetSteps: () => void;
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  resetLoading: () => void;
  setSkeleton: (key: keyof SkeletonStates, value: boolean) => void;
}

export type UIStore = UIState & UIActions;

// ============================================================
// Resume Store Types
// ============================================================

export type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'uploaded' | 'error';

export interface SelectedFile {
  name: string;
  size: number;
  type: string;
}

export interface UploadState {
  selectedFile: SelectedFile | null;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  uploadId: number | null;
  errorMessage: string | null;
}

export interface AnalysisResult {
  analysisId: number;
  score: number | null;
  analysisData: Record<string, unknown>;
  recommendations: Record<string, unknown> | null;
  createdAt: string;
}

export interface ResumeState {
  upload: UploadState;
  analysis: AnalysisResult | null;
  jobDescription: string;
}

export interface ResumeActions {
  setSelectedFile: (file: SelectedFile | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploadStatus: (status: UploadStatus) => void;
  setUploadId: (id: number | null) => void;
  setUploadError: (message: string | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setJobDescription: (description: string) => void;
  resetUpload: () => void;
  resetAll: () => void;
}

export type ResumeStore = ResumeState & ResumeActions;
