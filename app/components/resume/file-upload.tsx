'use client';

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useResumeStore, selectUploadStatus, selectSelectedFile } from '@/app/store/resume-store';
import { useUIStore } from '@/app/store/ui-store';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/app/lib/validations';
import { apiClient } from '@/app/lib/api-client';
import type { SelectedFile } from '@/app/store/types';

const ALLOWED_EXTENSIONS = '.pdf,.docx,.txt';
const ALLOWED_TYPES_DISPLAY = 'PDF, DOCX, TXT';
const MAX_FILE_SIZE_MB = 15;

interface PresignedUrlData {
  uploadUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadRecord {
  upload_id: number;
}

function uploadToS3WithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')));

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const {
    setSelectedFile,
    setUploadProgress,
    setUploadError,
    setUploadId,
    resetUpload,
  } = useResumeStore();

  const uploadStatus = useResumeStore(selectUploadStatus);
  const selectedFile = useResumeStore(selectSelectedFile);
  const setLoading = useUIStore((state) => state.setLoading);

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES_DISPLAY}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_FILE_SIZE_MB} MB`;
    }
    if (file.name.length > 255) {
      return 'File name too long (max 255 characters)';
    }
    return null;
  }, []);

  const startUpload = useCallback(
    async (file: File) => {
      const userId = session?.user?.userId;
      if (!userId) {
        setUploadError('Authentication required. Please sign in.');
        return;
      }

      setLoading('upload', true);

      try {
        const urlResponse = await apiClient.post<PresignedUrlData>('/api/uploads/presigned-url', {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        if (!urlResponse.success) {
          setUploadError(urlResponse.error.message);
          return;
        }

        const { uploadUrl, fileKey } = urlResponse.data;

        await uploadToS3WithProgress(uploadUrl, file, (progress) => setUploadProgress(progress));

        const dbResponse = await apiClient.post<UploadRecord>('/api/uploads', {
          user_id: userId,
          file_name: file.name,
          file_path: fileKey,
          file_size: file.size,
          mime_type: file.type,
        });

        if (!dbResponse.success) {
          setUploadError(dbResponse.error.message);
          return;
        }

        setUploadId(dbResponse.data.upload_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setUploadError(message);
      } finally {
        setLoading('upload', false);
      }
    },
    [session, setUploadProgress, setUploadError, setUploadId, setLoading]
  );

  const processFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }

      const selectedFileData: SelectedFile = { name: file.name, size: file.size, type: file.type };
      setSelectedFile(selectedFileData);
      setLocalFile(file);

      await startUpload(file);
    },
    [validateFile, setSelectedFile, setUploadError, startUpload]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      e.target.value = '';
    },
    [processFile]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleRemoveFile = useCallback(() => {
    resetUpload();
    setLocalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetUpload]);

  const isUploading = uploadStatus === 'uploading';
  const isUploaded = uploadStatus === 'uploaded';
  const hasFile = !!selectedFile;

  if (isUploaded && selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-800 border border-green-700 rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-8 h-8 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type.split('/').pop()?.toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemoveFile}
          aria-label="Remove file"
          className="ml-3 p-2 text-gray-400 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Resume File <span className="text-red-400">*</span>
      </label>

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="region"
        aria-label="File drop zone"
        aria-describedby="file-upload-hint"
        className={[
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-xl',
          'px-6 py-10 text-center cursor-pointer',
          'transition-colors duration-200',
          isUploading ? 'pointer-events-none opacity-75' : '',
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : hasFile
            ? 'border-gray-600 bg-gray-800/50'
            : 'border-gray-600 bg-gray-800/30 hover:border-blue-500 hover:bg-blue-500/5',
        ].join(' ')}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isDragOver ? (
          <>
            <svg className="w-12 h-12 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-400 font-medium">Drop your resume here</p>
          </>
        ) : (
          <>
            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-300 font-medium mb-1">
              Drag & drop your resume here
            </p>
            <p className="text-gray-500 text-sm mb-4">or</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
            >
              Choose File
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          capture={undefined}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload resume file"
          tabIndex={-1}
        />
      </div>

      <p id="file-upload-hint" className="text-xs text-gray-500">
        Accepted formats: {ALLOWED_TYPES_DISPLAY} · Max size: {MAX_FILE_SIZE_MB} MB
      </p>

      {/* Mobile: separate input with camera/gallery capture */}
      <div className="sm:hidden">
        <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 cursor-pointer hover:bg-gray-700 min-h-[48px] transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Camera or Gallery
          <input
            type="file"
            accept={ALLOWED_EXTENSIONS}
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload from camera or gallery"
          />
        </label>
      </div>
    </div>
  );
}
