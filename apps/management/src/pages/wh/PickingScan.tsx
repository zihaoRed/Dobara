import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle, ScanLine, Package } from 'lucide-react';

const mockItems = [
  { imei: '350000000000001', scanned: false },
  { imei: '350000000000003', scanned: false },
  { imei: '350000000000005', scanned: false },
  { imei: '350000000000010', scanned: false },
  { imei: '350000000000020', scanned: false },
];

const PickingScan: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [scanInput, setScanInput] = useState('');
  const [items, setItems] = useState(mockItems);
  const [completed, setCompleted] = useState(false);

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const found = items.find((item) => item.imei === scanInput.trim() && !item.scanned);
    if (found) {
      setItems((prev) =>
        prev.map((i) => (i.imei === found.imei ? { ...i, scanned: true } : i))
      );
      setScanInput('');
      // Check if all scanned
      const remaining = items.filter((i) => i.imei !== found.imei && !i.scanned).length;
      if (remaining === 0) {
        setCompleted(true);
      }
    }
  };

  const scannedCount = items.filter((i) => i.scanned).length;
  const totalCount = items.length;
  const allScanned = scannedCount === totalCount || completed;

  if (completed) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Picking Complete!</h3>
          <p className="text-body text-text-secondary">
            All {totalCount} devices scanned for order {orderId}
          </p>
          <Button onClick={() => navigate('/wh')}>Back to Warehouse</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/wh/picking')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Picking Scan</h2>
      </div>

      {/* Progress */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-body font-semibold">{orderId}</p>
            <Badge variant={allScanned ? 'success' : 'warning'}>
              {scannedCount}/{totalCount} Scanned
            </Badge>
          </div>
          <div className="w-full bg-surface-high rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(scannedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scan Input */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Scan IMEI</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="IMEI"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Scan device IMEI..."
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
          <Button
            variant="primary"
            className="w-full"
            icon={<ScanLine size={18} />}
            disabled={!scanInput.trim()}
            onClick={handleScan}
          >
            Scan Device
          </Button>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Devices ({scannedCount}/{totalCount})</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.map((item) => (
            <div
              key={item.imei}
              className={`flex items-center gap-2 p-2 rounded-md ${
                item.scanned ? 'bg-dobara-success-light' : 'bg-surface-low'
              }`}
            >
              {item.scanned ? (
                <CheckCircle size={16} className="text-dobara-success" />
              ) : (
                <Package size={16} className="text-text-muted" />
              )}
              <span className="text-body font-mono">{item.imei}</span>
              {item.scanned && <span className="text-caption text-dobara-success ml-auto">Scanned ✓</span>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PickingScan;
