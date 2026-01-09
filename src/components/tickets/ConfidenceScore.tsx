import React from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceScoreProps {
  score?: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceScore({
  score,
  showLabel = true,
  size = 'md',
}: ConfidenceScoreProps) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const numericScore = Number(score);

  const getConfidenceMeta = (value: number) => {
    if (value >= 95) return { label: 'High', color: 'confidence-high' };
    if (value >= 80) return { label: 'Medium', color: 'confidence-medium' };
    return { label: 'Low', color: 'confidence-low' };
  };

  const { label, color } = getConfidenceMeta(numericScore);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', sizeClasses[size])}>
      <span className={cn('font-semibold tabular-nums', color)}>
        {numericScore.toFixed(0)}%
      </span>

      {showLabel && size !== 'sm' && (
        <span className="text-muted-foreground">
          ({label})
        </span>
      )}
    </div>
  );
}
