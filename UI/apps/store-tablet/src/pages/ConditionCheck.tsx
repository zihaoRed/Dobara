import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Tabs } from '@dobara/ui';
import { Wrench, Package, AlertTriangle } from 'lucide-react';
import { REPAIR_HISTORY_OPTIONS, ACCESSORY_OPTIONS, FUNCTIONAL_DEFECT_OPTIONS } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

/** CO-RPR / CO-ACC / CO-FNC clerk point-checks — fed into the pricing engine as deductions. */
export default function ConditionCheck() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState('repair');
  const [repairs, setRepairs] = useState<string[]>([]);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [functional, setFunctional] = useState<string[]>([]);

  const toggle = (list: string[], key: string) =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

  const repairPenalty = repairs.length >= 3;

  const persist = () => {
    try {
      sessionStorage.setItem(
        `dobara_condition_${sessionId}`,
        JSON.stringify({ repairHistory: repairs, accessoriesMissing: accessories, functionalDefects: functional }),
      );
    } catch { /* ignore */ }
  };

  const goInvoice = () => {
    persist();
    markStepComplete(sessionId, 'condition');
    navigate(`/session/${sessionId}/invoice`);
  };

  const OptionGroup = ({
    options,
    selected,
    onToggle,
  }: {
    options: readonly { key: string; label: string }[];
    selected: string[];
    onToggle: (key: string) => void;
  }) => (
    <div className="space-y-2">
      {options.map((o) => {
        const active = selected.includes(o.key);
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onToggle(o.key)}
            className={`w-full text-left px-3 py-2.5 rounded-md border text-caption font-medium transition-colors ${
              active
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-container'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="p-6" data-testid="condition-check">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Condition &amp; Accessories</h1>
      <p className="text-body text-text-body mb-4">
        Select anything that applies. These feed the pricing engine as repair / accessory / functional deductions.
      </p>

      <Tabs
        tabs={[
          { key: 'repair', label: `Repair History (${repairs.length})` },
          { key: 'accessory', label: `Accessories (${accessories.length})` },
          { key: 'functional', label: `Functional (${functional.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="mb-4"
      />

      {tab === 'repair' && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Repair History</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-caption text-text-muted mb-3">Based on user statement or visible traces (CO-RPR).</p>
            <OptionGroup
              options={REPAIR_HISTORY_OPTIONS}
              selected={repairs}
              onToggle={(k) => setRepairs((prev) => toggle(prev, k))}
            />
            {repairPenalty && (
              <div className="mt-3 rounded-md bg-dobara-warning-light text-[#78350f] px-3 py-2 text-caption font-semibold flex items-center gap-2">
                <AlertTriangle size={14} /> 3+ repairs selected — a multi-repair penalty will be added.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'accessory' && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Accessories Missing</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-caption text-text-muted mb-3">Check what the customer brought (CO-ACC).</p>
            <OptionGroup
              options={ACCESSORY_OPTIONS}
              selected={accessories}
              onToggle={(k) => setAccessories((prev) => toggle(prev, k))}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'functional' && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Functional Defects</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-caption text-text-muted mb-3">
              Cross-check with the hardware audit results (CO-FNC).
            </p>
            <OptionGroup
              options={FUNCTIONAL_DEFECT_OPTIONS}
              selected={functional}
              onToggle={(k) => setFunctional((prev) => toggle(prev, k))}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/hardware`)}>Back</Button>
        <Button variant="primary" size="lg" data-testid="condition-continue" onClick={goInvoice}>
          Continue to Invoice
        </Button>
      </div>
    </div>
  );
}
