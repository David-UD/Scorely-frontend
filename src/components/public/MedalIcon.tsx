type MedalRank = 1 | 2 | 3;

interface MedalIconProps {
  rank: MedalRank;
  className?: string;
}

const MEDAL_COLORS: Record<MedalRank, { face: string; trim: string; ribbon: string }> = {
  1: { face: "#F6C14E", trim: "#B08A1F", ribbon: "#D97706" },
  2: { face: "#D7DCE2", trim: "#8B95A3", ribbon: "#94A3B8" },
  3: { face: "#E0A36A", trim: "#9C5A1F", ribbon: "#C2703D" },
};

export default function MedalIcon({ rank, className = "" }: MedalIconProps) {
  const colors = MEDAL_COLORS[rank];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid={`medal-${rank}`}>
      <polygon points="12,10.5 5,2 19,2" fill={colors.ribbon} />
      <circle cx="12" cy="15.2" r="6.3" fill={colors.face} stroke={colors.trim} strokeWidth="1.2" />
      <circle cx="12" cy="15.2" r="4.6" fill="none" stroke={colors.trim} strokeWidth="0.9" />
      <path
        d="M12 12.9l.55 1.13 1.24.18-.9.87.21 1.23-1.1-.58-1.1.58.21-1.23-.9-.87 1.24-.18L12 12.9z"
        fill={colors.trim}
      />
    </svg>
  );
}