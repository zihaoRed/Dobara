import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar, Badge } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { HARDWARE_CHECK_ITEMS } from '@dobara/utils';

type TResult = 'normal' | 'abnormal' | 'timeout' | 'pending';

interface ItemState {
  name: string;
  status: TResult;
  value: string;
}

const defaultMockValues: Record<string, { status: TResult; value: string }> = {
  'IMEI / Serial Number': { status: 'normal', value: '350000000000001' },
  'Brand & Model': { status: 'normal', value: 'Apple iPhone 13' },
  'Battery Health': { status: 'normal', value: '87%' },
  'Screen Touch': { status: 'normal', value: 'All zones OK' },
  'Sensors': { status: 'normal', value: 'All responsive' },
  'Storage Capacity': { status: 'normal', value: '128GB (82GB free)' },
  'Camera': { status: 'normal', value: 'Front & rear OK' },
  'Speaker & Microphone': { status: 'normal', value: 'Both OK' },
  'Buttons': { status: 'normal', value: 'All responsive' },
};

const statusIcon = (s: TResult) => {
  switch (s) {
    case 'normal': return <CheckCircle size={16} className="text-dobara-success" />;
    case 'abnormal': return <XCircle size={16} className="text-dobara-error" />;
    case 'timeout': return <AlertTriangle size={16} className="text-dobara-warning" />;
    case 'pending': return <RefreshCw size={16} className="text-text-muted animate-spin" />;
  }
};

const statusBadge = (s: TResult) => {
  switch (s) {
    case 'normal': return <Badge variant="success">Normal</Badge>;
    case 'abnormal': return <Badge variant="error">Abnormal</Badge>;
    case 'timeout': return <Badge variant="warning">Timeout</Badge>;
    case 'pending': return <Badge variant="neutral">Testing...</Badge>;
  }
};

export default function HardwareResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemState[]>(() =>
    HARDWARE_CHECK_ITEMS.map((name) => ({
      name,
      status: 'pending' as TResult,
      value: '',
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentIndex >= items.length) {
      setDone(true);
      return;
    }
    const timeout = setTimeout(() => {
      setItems((prev) => {
        const next = [...prev];
        const mock = defaultMockValues[next[currentIndex]?.name];
        next[currentIndex] = {
          name: next[currentIndex].name,
          status: mock?.status ?? 'normal',
          value: mock?.value ?? 'OK',
        };
        return next;
      });
      setCurrentIndex((i) => i + 1);
    }, 600 + Math.random() * 800);
    return () => clearTimeout(timeout);
  }, [currentIndex, items.length]);

  const handleRetest = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'pending', value: '' };
      return next;
    });
    setTimeout(() => {
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'normal',
          value: defaultMockValues[items[index].name]?.value ?? 'OK',
        };
        return next;
      });
    }, 600 + Math.random() * 800);
  };

  const testedCount = items.filter((i) => i.status !== 'pending').length;

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Hardware Diagnostics</h1>
      <p className="text-body text-text-body mb-4">
        {done ? 'All tests completed.' : `Testing in progress... (${testedCount}/${items.length})`}
      </p>

      <div className="mb-6">
        <ProgressBar
          value={testedCount}
          max={items.length}
          color={done ? 'success' : 'primary'}
          size="md"
          showLabel
        />
      </div>

      <div className="space-y-2 mb-6">
        {items.map((item, i) => (
          <Card key={i} variant="flat" className="flex items-center gap-3 p-3">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              {statusIcon(item.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-caption font-semibold text-text-primary">{item.name}</div>
              {item.value && (
                <div className="text-[11px] text-text-muted font-mono truncate">{item.value}</div>
              )}
            </div>
            <div className="shrink-0">{statusBadge(item.status)}</div>
            {item.status !== 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw size={12} />}
                onClick={() => handleRetest(i)}
              >
                Retest
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}/video`)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!done}
          onClick={() => navigate(`/session/${sessionId}/invoice`)}
        >
          Continue to Invoice
        </Button>
      </div>
    </div>
  );
}
