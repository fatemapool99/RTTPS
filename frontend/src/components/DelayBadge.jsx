import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

const DelayBadge = ({ delayMinutes = 0, status, size = 'md' }) => {
  const delay = Number(delayMinutes || 0);

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let Icon = CheckCircle2;
  let text = 'On Time';

  if (status === 'Cancelled') {
    colorClasses = 'bg-rose-100 text-rose-800 border-rose-300';
    Icon = AlertOctagon;
    text = 'Cancelled';
  } else if (delay >= 45) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = AlertOctagon;
    text = `Delayed ${delay}m`;
  } else if (delay >= 15) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
    text = `Delayed ${delay}m`;
  } else if (delay > 0) {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
    Icon = Clock;
    text = `+${delay}m`;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{text}</span>
    </span>
  );
};

export default DelayBadge;
