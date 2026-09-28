import React from 'react';
import { Button } from '@dobara/ui';

/** Sticky top bar (back + title) — stays fixed while the page content scrolls. */
export function PageHeader({
  title,
  onBack,
  right,
  titleTestId,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
  titleTestId?: string;
}) {
  return (
    <div className="sticky top-0 z-20 -mt-4 pt-4 pb-2 bg-surface border-b border-border mb-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 shrink-0">
          ← Back
        </Button>
        {right && <span className="ml-auto shrink-0">{right}</span>}
      </div>
      <h1 className="text-h3 font-heading mt-1" data-testid={titleTestId}>{title}</h1>
    </div>
  );
}
