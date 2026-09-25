interface ProgressBarProps {
  step: number; // 1-indexed
  total: number;
}

export function ProgressBar({ step, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((step / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-muted mb-1.5">
        <span>
          Question {step} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
