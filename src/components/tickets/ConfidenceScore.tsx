import { cn } from '@/lib/utils';

interface ConfidenceScoreProps {
  score: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceScore({ score, showLabel = true, size = 'md' }: ConfidenceScoreProps) {
  if (score === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getConfidenceLevel = (score: number) => {
    if (score >= 95) return { level: 'high', label: 'High', color: 'confidence-high' };
    if (score >= 80) return { level: 'medium', label: 'Medium', color: 'confidence-medium' };
    return { level: 'low', label: 'Low', color: 'confidence-low' };
  };

  const { label, color } = getConfidenceLevel(score);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', sizeClasses[size])}>
      <span className={cn('font-semibold tabular-nums', color)}>
        {score.toFixed(0)}%
      </span>
      {showLabel && (
        <span className={cn('text-muted-foreground', size === 'sm' && 'hidden')}>
          ({label})
        </span>
      )}
    </div>
  );
}
