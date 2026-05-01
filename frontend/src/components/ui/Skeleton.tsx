import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const TableSkeleton = () => (
  <div className="rounded bg-white outline outline-1 outline-slate-200">
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    {[1, 2, 3, 4, 5].map((row) => (
      <div key={row} className="border-t border-slate-100 px-6 py-4">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-8 w-8 rounded-sm" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
    <Skeleton className="h-4 w-24 mb-4" />
    <Skeleton className="h-12 w-32 mb-2" />
    <Skeleton className="h-4 w-48" />
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const DetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-32" />
    </div>
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);
