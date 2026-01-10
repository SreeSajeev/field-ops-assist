import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'primary' | 'accent';
  className?: string;
}

const variantStyles = {
  default: 'bg-card hover:shadow-md',
  warning: 'bg-warning/8 border-warning/20 hover:bg-warning/12',
  success: 'bg-success/8 border-success/20 hover:bg-success/12',
  danger: 'bg-destructive/8 border-destructive/20 hover:bg-destructive/12',
  primary: 'stat-card-primary border-0',
  accent: 'stat-card-accent border-0',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-warning/20 text-warning',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
  primary: 'bg-white/20 text-white',
  accent: 'bg-white/20 text-white',
};

const textVariantStyles = {
  default: '',
  warning: '',
  success: '',
  danger: '',
  primary: 'text-white',
  accent: 'text-white',
};

export function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  const isPrimary = variant === 'primary' || variant === 'accent';
  
  return (
    <Card className={cn(
      'card-interactive border transition-all duration-200',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              'text-sm font-medium',
              isPrimary ? 'text-white/80' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={cn(
                'text-3xl font-bold tracking-tight',
                textVariantStyles[variant]
              )}>
                {value}
              </p>
              {trend && (
                <span 
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5',
                    trend.isPositive 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className={cn(
                'mt-1.5 text-xs',
                isPrimary ? 'text-white/60' : 'text-muted-foreground'
              )}>
                {description}
              </p>
            )}
          </div>
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            iconVariantStyles[variant]
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
