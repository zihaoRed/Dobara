import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, GradeBadge, StatusBadge, Button, SearchBar, Skeleton, EmptyState } from '@dobara/ui';
import { ClipboardList, Eye } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import type { IDevice, IBrand, IModel } from '@dobara/utils';

// Import mock data helpers (used at runtime via MSW, these are for local display)
const mockBrands: Record<string, string> = { apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', oneplus: 'OnePlus', oppo: 'OPPO' };
const mockModels: Record<string, string> = {
  iphone12: 'iPhone 12', iphone13: 'iPhone 13', iphone14: 'iPhone 14',
  galaxys21: 'Galaxy S21', galaxys22: 'Galaxy S22',
  mi11: 'Mi 11', nord2: 'Nord 2', reno6: 'Reno 6',
};
const getBrandName = (id: string) => mockBrands[id] || id;
const getModelName = (id: string) => mockModels[id] || id;

const ReviewList: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/ops/review')
      .then((r) => r.json())
      .then((data: { devices: IDevice[] }) => setDevices(data.devices))
      .finally(() => setLoading(false));
  }, []);

  const filtered = devices.filter((d) => {
    if (!search) return true;
    const brand = getBrandName(d.brandId);
    const model = getModelName(d.modelId);
    const label = `${brand} ${model} ${d.imei}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Review Workbench</h1>
          <p className="text-body text-text-muted mt-1">Review and approve device listings</p>
        </div>
        <Badge variant="warning" size="md">{devices.length} Pending</Badge>
      </div>

      <Card className="mb-4" variant="flat">
        <div className="flex items-center gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by brand, model or IMEI..." className="w-80" />
        </div>
      </Card>

      <Card variant="default">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="w-full" height="48px" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} strokeWidth={1.5} />}
            title="No Pending Reviews"
            description={search ? 'No devices match your search.' : 'All devices have been reviewed.'}
          />
        ) : (
          <DataTable
            data={filtered}
            keyField="imei"
            columns={[
              {
                key: 'device',
                header: 'Device',
                render: (d) => {
                  const brand = getBrandName(d.brandId);
                  const model = getModelName(d.modelId);
                  return (
                    <div>
                      <div className="font-semibold text-text-primary">{brand} {model}</div>
                      <div className="text-caption text-text-muted font-mono">{d.imei}</div>
                    </div>
                  );
                },
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (d) => <GradeBadge grade={d.grade} />,
              },
              {
                key: 'price',
                header: 'Price',
                render: (d) => (
                  <div className="font-semibold text-text-primary">₹ {d.price.toLocaleString()}</div>
                ),
              },
              {
                key: 'city',
                header: 'City',
                render: (d) => <span className="text-text-secondary">{d.city}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (d) => <StatusBadge status={d.status === 'pending_review' ? 'pending' : 'completed'} customLabel="Pending Review" />,
              },
              {
                key: 'action',
                header: '',
                render: (d) => (
                  <Button size="sm" variant="secondary" icon={<Eye size={16} />} onClick={() => navigate(`/review/${d.imei}`)}>
                    Review
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default ReviewList;
