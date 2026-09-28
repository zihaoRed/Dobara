import { Modal } from '@dobara/ui';
import { MapPin, Check } from 'lucide-react';
import type { IStore } from '@dobara/utils';

/** APP-P1-01 — store picker bottom sheet (like the city picker). */
export function StorePicker({
  open, onClose, stores, selectedId, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  stores: IStore[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Select store" size="sm">
      <div className="space-y-1 max-h-72 overflow-y-auto -mx-1" data-testid="store-picker">
        {stores.map((s, idx) => {
          const selected = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`store-row-${s.id}`}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-surface-low`}
            >
              <MapPin size={16} className="text-primary-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium truncate">{s.name}</p>
                <p className="text-eyebrow text-text-muted truncate">{s.address}</p>
                <p className="text-eyebrow text-primary-600 mt-0.5">
                  {((idx + 1) * 1.2 + 0.8).toFixed(1)} km away
                </p>
              </div>
              {selected && <Check size={16} className="text-primary-500 shrink-0" />}
            </button>
          );
        })}
        {stores.length === 0 && (
          <p className="px-3 py-4 text-caption text-text-muted text-center">No stores in this city</p>
        )}
      </div>
    </Modal>
  );
}
