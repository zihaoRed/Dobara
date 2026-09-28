import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Badge } from '@dobara/ui';
import { Plus, CreditCard, Trash2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

/** APP-P0-05 支付方式管理 — 绑定/解绑 UPI ID + 银行卡只读展示（demo localStorage）。 */

const KEY = 'dobara_payment_methods';
interface IMethod {
  id: string;
  upiId?: string;
  bank?: string;
  isDefault: boolean;
}

const DEMO: IMethod[] = [
  { id: 'pm-upi-1', upiId: 'rahul@okhdfcbank', isDefault: true },
  { id: 'pm-card-1', bank: 'HDFC Bank Debit Card ****1234', isDefault: false },
];

function load(): IMethod[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEMO;
    const parsed = JSON.parse(raw) as IMethod[];
    return parsed.length ? parsed : DEMO;
  } catch {
    return DEMO;
  }
}

function save(list: IMethod[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function isUpiId(v: string): boolean {
  const at = v.indexOf('@');
  return at > 0 && at < v.length - 1;
}

export function PaymentMethods() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<IMethod[]>(load);
  const [addOpen, setAddOpen] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [removeTarget, setRemoveTarget] = useState<IMethod | null>(null);

  const addUpi = () => {
    const v = upiId.trim();
    if (!isUpiId(v)) {
      setError('Enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    const isFirst = methods.every((m) => !m.upiId);
    const next = [...methods, { id: `pm-upi-${Date.now()}`, upiId: v, isDefault: isFirst }];
    setMethods(next);
    save(next);
    setUpiId('');
    setError('');
    setAddOpen(false);
  };

  const remove = (target: IMethod) => {
    const next = methods.filter((m) => m.id !== target.id);
    // If we removed the default UPI, promote the first remaining UPI to default
    if (target.isDefault) {
      const firstUpi = next.find((m) => m.upiId);
      if (firstUpi) firstUpi.isDefault = true;
    }
    setMethods(next);
    save(next);
    setRemoveTarget(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="payment-methods">
      <PageHeader title="Payment Methods" onBack={() => navigate('/account')} />

      <div className="space-y-3">
        {methods.map((m) => (
          <Card key={m.id} variant="flat" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-text-primary">
                {m.upiId ? m.upiId : m.bank}
              </p>
              <p className="text-caption text-text-muted">
                {m.upiId ? 'UPI' : 'Saved card (read-only)'}
              </p>
            </div>
            {m.isDefault && <Badge variant="success">Default</Badge>}
            {m.upiId && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                data-testid={`unbind-${m.id}`}
                onClick={() => setRemoveTarget(m)}
              >
                Unbind
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Button variant="secondary" size="lg" className="w-full" icon={<Plus size={18} />} onClick={() => setAddOpen(true)} data-testid="add-upi">
        Add UPI ID
      </Button>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add UPI ID" size="sm">
        <Input
          label="UPI ID (name@bank)"
          placeholder="yourname@okhdfcbank"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          error={error}
          data-testid="upi-input"
        />
        <Button className="w-full mt-4" variant="primary" onClick={addUpi} data-testid="save-upi">
          Save
        </Button>
      </Modal>

      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Unbind UPI ID" size="sm">
        <p className="text-body text-text-secondary mb-4">
          Unbind <b>{removeTarget?.upiId}</b>? You'll need to re-add it to use it again.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => removeTarget && remove(removeTarget)} data-testid="confirm-unbind">
            Unbind
          </Button>
        </div>
      </Modal>
    </div>
  );
}
