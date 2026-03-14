'use client';

import { useTranslations } from 'next-intl';
import { useResumeStore, selectUploadProgress, selectUploadStatus, selectSelectedFile, selectUploadError } from '@/app/store/resume-store';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadProgress() {
  const t = useTranslations('resume');
  const uploadStatus = useResumeStore(selectUploadStatus);
  const uploadProgress = useResumeStore(selectUploadProgress);
  const selectedFile = useResumeStore(selectSelectedFile);
  const uploadError = useResumeStore(selectUploadError);

  if (uploadStatus === 'idle') return null;

  return (
    <div className="space-y-3">
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
          </div>
          {uploadStatus === 'uploaded' && (
            <div className="flex-shrink-0 text-green-400" aria-label="Upload complete">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {uploadStatus === 'uploading' && <LoadingSpinner size="sm" label={t('uploading')} />}
        </div>
      )}

      {uploadStatus === 'uploading' && (
        <div role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress: ${uploadProgress}%`}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{t('uploading')}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadStatus === 'uploaded' && (
        <p className="text-sm text-green-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {t('resumeUploadedSuccessfully')}
        </p>
      )}

      {uploadStatus === 'error' && uploadError && (
        <p role="alert" className="text-sm text-red-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {uploadError}
        </p>
      )}
    </div>
  );
}
