'use client';

import React, { type ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
}

export function ResumeAnalysisErrorBoundary({ children }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary feature="resume analysis">
      {children}
    </ErrorBoundary>
  );
}

export function PortfolioErrorBoundary({ children }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary feature="portfolio">
      {children}
    </ErrorBoundary>
  );
}

export function ConsultationErrorBoundary({ children }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary feature="consultation booking">
      {children}
    </ErrorBoundary>
  );
}

export function FileUploadErrorBoundary({ children }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary feature="file upload">
      {children}
    </ErrorBoundary>
  );
}
