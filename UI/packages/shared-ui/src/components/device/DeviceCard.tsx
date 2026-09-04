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
  originalPrice?: number;
  storage?: string;
  conditionLabel?: string;
  /** APP-P1-03: mark same-city stock with a badge */
  sameCity?: boolean;
  onClick?: () => void;
}

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent Condition',
  B: 'Good Condition',
  C: 'Fair Condition',
  D: 'As Is',
};

const brandGradients: Record<string, string> = {
  Apple: 'from-slate-100 to-slate-200',
  Samsung: 'from-blue-50 to-indigo-100',
  Xiaomi: 'from-amber-50 to-yellow-100',
  OnePlus: 'from-red-50 to-rose-100',
  OPPO: 'from-emerald-50 to-teal-100',
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
  originalPrice,
  storage,
  conditionLabel,
  sameCity,
  onClick,
}) => {
  const gradient = brandGradients[brand] || 'from-surface-high to-surface-container';
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const condition = conditionLabel || GRADE_LABELS[grade] || `Grade ${grade}`;

  return (
    <Card variant="hover" onClick={onClick} className="overflow-hidden group !p-3">
      <div className={`aspect-[4/3] bg-gradient-to-br ${gradient} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden`}>
        {imageUrl ? (
          <img src={imageUrl} alt={`${brand} ${model}`} className="w-full h-full object-contain p-2" />
        ) : (
          <div className="relative z-10 text-center">
            <Smartphone size={28} className="text-text-secondary/40 mx-auto mb-1" />
            <p className="text-eyebrow text-text-muted font-medium">{brand}</p>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-primary-50 text-primary-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {condition}
        </div>
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-body font-semibold text-text-primary truncate leading-snug">
          {brand} {model}
        </h3>
        {storage && (
          <p className="text-caption text-text-muted">{storage}</p>
        )}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-lead font-bold text-primary-500">
            ₹{new Intl.NumberFormat('en-IN').format(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-caption text-text-muted line-through">
              ₹{new Intl.NumberFormat('en-IN').format(originalPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <GradeBadge grade={grade} />
          {sameCity ? (
            <span className="text-caption font-semibold text-primary-600" data-testid="same-city-badge">
              · Same City · {city}
            </span>
          ) : (
            <span className="text-caption text-text-muted">{city}</span>
          )}
        </div>
      </div>
    </Card>
  );
};
