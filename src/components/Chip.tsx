interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  disabled?: boolean;
}

export function Chip({ label, selected, onClick, emoji, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`tap-target inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground hover:border-primary"
      }`}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {label}
    </button>
  );
}
