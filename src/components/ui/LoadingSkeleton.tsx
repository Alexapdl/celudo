"use client";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export default function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`container space-y-3 py-8 ${className}`}>
      <div className="h-6 w-40 rounded-lg bg-white/4 animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-white/3 animate-pulse"
          style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/6 bg-white/2 p-5 space-y-3 animate-pulse">
      <div className="h-4 w-16 rounded bg-white/5" />
      <div className="h-6 w-32 rounded bg-white/5" />
      <div className="h-3 w-full rounded bg-white/3" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/6 bg-white/2 p-4 text-center space-y-2 animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="h-5 w-8 mx-auto rounded bg-white/5" />
          <div className="h-6 w-16 mx-auto rounded bg-white/5" />
          <div className="h-3 w-12 mx-auto rounded bg-white/3" />
        </div>
      ))}
    </div>
  );
}
