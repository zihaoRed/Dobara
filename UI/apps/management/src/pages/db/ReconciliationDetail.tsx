import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import {
  buildReconLines,
  DB_STORES,
  downloadText,
  exportReconCsv,
  openReconPrint,
} from '../../lib/dbStore';

const ReconciliationDetail: React.FC = () => {
  const { storeId = '', period = '' } = useParams<{ storeId: string; period: string }>();
  const navigate = useNavigate();
  const [start, end] = period.includes('_') ? period.split('_') : [period, period];
  const storeName = DB_STORES.find((s) => s.id === storeId)?.name || storeId;
  const [printHint, setPrintHint] = useState('');

  const lines = useMemo(() => buildReconLines(storeId, start, end || start), [storeId, start, end]);

  const recyclingTotal = lines.filter((d) => d.type === 'recycling').reduce((sum, d) => sum + d.amount, 0);
  const purchaseTotal = lines.filter((d) => d.type === 'purchase').reduce((sum, d) => sum + d.amount, 0);
  const netSettlement = recyclingTotal - purchaseTotal;

  const onExportCsv = () => {
    const csv = exportReconCsv(storeName, start, end || start, lines);
    downloadText(`recon_${storeId}_${start}_${end || start}.csv`, csv);
  };

  const onPrintPdf = () => {
    const ok = openReconPrint(storeName, start, end || start, lines);
    setPrintHint(ok ? 'Print dialog opened — choose “Save as PDF” if needed.' : 'Pop-up blocked. Allow pop-ups and try again.');
  };

  return (
    <div className="space-y-4" data-testid="recon-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db/reconciliation')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Reconciliation detail</h2>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-body font-semibold">{storeName}</p>
          <p className="text-caption text-text-muted">Period: {start} → {end || start}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center space-y-1">
            <p className="text-caption text-text-muted">Recycling total</p>
            <p className="text-h3 font-heading text-primary-500" data-testid="recon-recycle">
              ₹{recyclingTotal.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <p className="text-caption text-text-muted">B2B purchase</p>
            <p className="text-h3 font-heading text-accent-500" data-testid="recon-purchase">
              ₹{purchaseTotal.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="text-center">
          <p className="text-caption text-text-muted">Net settlement</p>
          <p
            className={`text-h2 font-heading ${netSettlement >= 0 ? 'text-dobara-success' : 'text-dobara-error'}`}
            data-testid="recon-net"
          >
            {netSettlement >= 0 ? '+' : '−'}₹{Math.abs(netSettlement).toLocaleString('en-IN')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Transactions ({lines.length})</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {lines.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
              <div className="min-w-0">
                <p className="text-body truncate">{d.description}</p>
                <p className="text-caption text-text-muted">{d.date}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={d.type === 'recycling' ? 'success' : 'accent'}>
                  {d.type === 'recycling' ? 'Recycling' : 'Purchase'}
                </Badge>
                <span className="text-body font-semibold">₹{d.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          icon={<Download size={18} />}
          data-testid="export-csv"
          onClick={onExportCsv}
        >
          Export CSV
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          icon={<Printer size={18} />}
          data-testid="export-print"
          onClick={onPrintPdf}
        >
          Print / PDF
        </Button>
      </div>
      {printHint && (
        <p className="text-caption text-text-muted text-center" data-testid="print-hint">
          {printHint}
        </p>
      )}
    </div>
  );
};

export default ReconciliationDetail;
