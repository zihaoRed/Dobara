import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Tabs } from '@dobara/ui';
import { Save } from 'lucide-react';

const PricingConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('formula');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Pricing Configuration</h1>
        <p className="text-body text-text-muted mt-1">Manage pricing formulas and parameters</p>
      </div>

      <Tabs
        tabs={[
          { key: 'formula', label: 'Pricing Formula' },
          { key: 'coefficients', label: 'Grade Coefficients' },
          { key: 'thresholds', label: 'Thresholds' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <Card variant="default" className="mt-4">
        <CardContent>
          {activeTab === 'formula' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-low rounded-md font-mono text-body text-text-secondary">
                Final Price = Base Price × Grade Coeff × Age Factor × Condition Factor - Deductions
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Base Price Margin (%)" type="number" defaultValue={15} />
                <Input label="Age Depreciation Rate (%/year)" type="number" defaultValue={8} />
                <Input label="Max Deduction Cap (₹)" type="number" defaultValue={5000} />
                <Input label="Minimum Listing Price (₹)" type="number" defaultValue={5000} />
              </div>
            </div>
          )}

          {activeTab === 'coefficients' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Grade A Coefficient" type="number" defaultValue={1.0} step={0.01} />
                <Input label="Grade B Coefficient" type="number" defaultValue={0.85} step={0.01} />
                <Input label="Grade C Coefficient" type="number" defaultValue={0.65} step={0.01} />
                <Input label="Grade D Coefficient" type="number" defaultValue={0.45} step={0.01} />
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Battery Health Min (%)" type="number" defaultValue={80} />
                <Input label="Screen Scratch Tolerance (level)" type="number" defaultValue={2} />
                <Input label="Body Dent Count Max" type="number" defaultValue={3} />
                <Input label="Repair Count Max" type="number" defaultValue={2} />
                <Input label="Max Device Age (years)" type="number" defaultValue={5} />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="primary" icon={<Save size={18} />}>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingConfig;
