import React from 'react';
import { Smartphone } from 'lucide-react';
import { GradeBadge } from './GradeBadge';
import { Card } from '../ui/Card';

interface DeviceCardProps {
  imei: string;
  brand: string;
  model: string;
  grade: 'A' | 'B' | 'C' | 'D';
  price: number;
  city: string;
  imageUrl?: string;
  onClick?: () => void;
}

const brandGradients: Record<string, string> = {
  Apple: 'from-slate-100 to-slate-200',
  Samsung: 'from-blue-50 to-indigo-100',
  Xiaomi: 'from-orange-50 to-amber-100',
  OnePlus: 'from-red-50 to-rose-100',
  OPPO: 'from-green-50 to-emerald-100',
  Google: 'from-sky-50 to-cyan-100',
  Vivo: 'from-violet-50 to-purple-100',
  Nothing: 'from-gray-100 to-slate-200',
};

export const DeviceCard: React.FC<DeviceCardProps> = ({
  brand,
  model,
  grade,
  price,
  city,
  imageUrl,
  onClick,
}) => {
  const gradient = brandGradients[brand] || 'from-surface-high to-surface-container';

  return (
    <Card variant="hover" onClick={onClick} className="overflow-hidden group">
      {/* Image area */}
      <div className={`aspect-[4/3] bg-gradient-to-br ${gradient} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden`}>
        {/* Subtle phone outline decoration */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-16 h-28 border-2 border-current rounded-xl flex items-center justify-center">
            <div className="w-10 h-20 border border-current rounded-md" />
          </div>
        </div>
        {/* Center content */}
        <div className="relative z-10 text-center">
          <Smartphone size={28} className="text-text-secondary/40 mx-auto mb-1" />
          <p className="text-eyebrow text-text-muted font-medium">{brand}</p>
        </div>
        {/* New badge */}
        <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
          QC Passed
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-body font-semibold text-text-primary truncate">
          {brand} {model}
        </h3>
        <div className="flex items-center justify-between">
          <GradeBadge grade={grade} />
          <span className="text-caption text-text-muted">{city}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-text-muted font-medium">₹</span>
          <span className="text-lead font-bold text-text-primary">
            {new Intl.NumberFormat('en-IN').format(price)}
          </span>
        </div>
      </div>
    </Card>
  );
};
