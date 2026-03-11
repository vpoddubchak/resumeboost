'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading text...">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 ${className}`}
      role="status"
      aria-label="Loading card..."
    >
      <Skeleton className="mb-4 h-40 w-full rounded" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonImage({ className = '' }: SkeletonProps) {
  return (
    <Skeleton
      className={`h-48 w-full rounded-lg ${className}`}
    />
  );
}

export function SkeletonTableRow({ columns = 4, className = '' }: { columns?: number; className?: string }) {
  return (
    <div
      className={`flex items-center gap-4 border-b border-gray-100 py-3 ${className}`}
      role="status"
      aria-label="Loading row..."
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 flex-1"
        />
      ))}
    </div>
  );
}

export default Skeleton;
