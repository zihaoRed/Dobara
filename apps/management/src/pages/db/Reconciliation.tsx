import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input } from '@dobara/ui';
import { FileText, Search, ArrowRight } from 'lucide-react';

const stores = [
  { id: 'st-mum-1', name: 'MobileXchange Andheri' },
  { id: 'st-del-1', name: 'GadgetMart CP' },
  { id: 'st-blr-1', name: 'Fonfix Koramangala' },
];

const Reconciliation: React.FC = () => {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState('');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  const handleGenerate = () => {
    if (!storeId) return;
    navigate(`/db/reconciliation/${storeId}/${startDate}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-h3 font-heading">Reconciliation</h2>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <FileText size={18} /> Generate Statement
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Store</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Input
              label="From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={<FileText size={18} />}
            disabled={!storeId}
            onClick={handleGenerate}
          >
            Generate Reconciliation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reconciliation;
