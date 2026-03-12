'use client';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { svg: 80, r: 30, stroke: 6, text: 'text-lg' },
  md: { svg: 100, r: 38, stroke: 7, text: 'text-xl' },
  lg: { svg: 120, r: 46, stroke: 8, text: 'text-2xl' },
} as const;

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981'; // green-400
  if (score >= 50) return '#F59E0B'; // yellow-400
  return '#EF4444'; // red-400
}

function getScoreColorClass(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

export function ScoreRing({ score, size = 'md', className = '' }: ScoreRingProps) {
  const { svg: svgSize, r, stroke, text: textClass } = SIZE_MAP[size];
  const circumference = 2 * Math.PI * r;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference * (1 - clampedScore / 100);
  const color = getScoreColor(clampedScore);
  const colorClass = getScoreColorClass(clampedScore);
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
        role="img"
        aria-label={`Match score: ${clampedScore} percent`}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#374151"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span
        className={`absolute ${textClass} font-bold ${colorClass}`}
        aria-hidden="true"
      >
        {clampedScore}%
      </span>
    </div>
  );
}

export default ScoreRing;
