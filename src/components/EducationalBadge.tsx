import React from 'react';

type BadgeType = 'PROTOTYPE' | 'SIMULATED CRASH' | 'RULE-BASED ANALYSIS' | 'DEMO DATA' | 'EXPERIMENTAL' | 'LIVE BUFFER' | 'CRASH CONTEXT';

interface EducationalBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md';
}

export const EducationalBadge: React.FC<EducationalBadgeProps> = ({ type, size = 'sm' }) => {
  const configs: Record<BadgeType, { bg: string; text: string; border: string; dot: string }> = {
    'PROTOTYPE': {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    'SIMULATED CRASH': {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400 animate-ping',
    },
    'RULE-BASED ANALYSIS': {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    'DEMO DATA': {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
    },
    'EXPERIMENTAL': {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      dot: 'bg-indigo-400',
    },
    'LIVE BUFFER': {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
    },
    'CRASH CONTEXT': {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
  };

  const c = configs[type] || configs.PROTOTYPE;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}
      title="Educational prototype indicator"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {type}
    </span>
  );
};
