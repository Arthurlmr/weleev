import { Sparkles } from 'lucide-react';

interface EnrichedBadgeProps {
  variant?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export function EnrichedBadge({ variant = 'default', showIcon = true }: EnrichedBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconSize = {
    sm: 10,
    default: 12,
    lg: 14,
  };

  return (
    <div
      className={`inline-flex items-center gap-1 bg-lumine-accent/10 text-lumine-accent rounded-full ${sizeClasses[variant]} font-medium border border-lumine-accent/20`}
    >
      {showIcon && <Sparkles size={iconSize[variant]} />}
      <span>Enrichi par LUMINᵉ</span>
    </div>
  );
}
