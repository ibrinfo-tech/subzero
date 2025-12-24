import type { LoadingSpinnerProps } from '@/core/types/components/common';

export function LoadingSpinner({ label = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses =
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <div
        className={`animate-spin rounded-full border-2 border-primary/20 border-t-primary ${sizeClasses}`}
      />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
