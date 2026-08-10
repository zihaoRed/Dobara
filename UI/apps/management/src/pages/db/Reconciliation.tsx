import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input } from '@dobara/ui';
import { FileText, ArrowLeft } from 'lucide-react';
import { DB_STORES } from '../../lib/dbStore';

const Reconciliation: React.FC = () => {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(DB_STORES[0].id);
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  const handleGenerate = () => {
    if (!storeId || !startDate || !endDate) return;
    navigate(`/db/reconciliation/${storeId}/${startDate}_${endDate}`);
  };

  return (
    <div className="space-y-4" data-testid="reconciliation">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Reconciliation</h2>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <FileText size={18} /> Generate statement
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Store</label>
            <select
              data-testid="recon-store"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
            >
              {DB_STORES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Input
              data-testid="recon-start"
              label="From"
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            />
            <Input
              data-testid="recon-end"
              label="To"
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={<FileText size={18} />}
            disabled={!storeId}
            data-testid="recon-generate"
            onClick={handleGenerate}
          >
            Generate reconciliation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reconciliation;
