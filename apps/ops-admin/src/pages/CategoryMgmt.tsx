import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge, Skeleton, EmptyState } from '@dobara/ui';
import { Plus, PackageSearch, ChevronRight } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import type { IBrand, IModel } from '@dobara/utils';

const CategoryMgmt: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ops/categories')
      .then((r) => r.json())
      .then((data: { brands: IBrand[]; models: IModel[] }) => {
        setBrands(data.brands);
        setModels(data.models);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredModels = selectedBrand
    ? models.filter((m) => m.brandId === selectedBrand)
    : models;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Category Management</h1>
          <p className="text-body text-text-muted mt-1">Manage brands and device model specifications</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />}>Add Model</Button>
      </div>

      {/* Brand Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={selectedBrand === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSelectedBrand(null)}
        >
          All
        </Button>
        {brands.map((b) => (
          <Button
            key={b.id}
            variant={selectedBrand === b.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedBrand(b.id)}
          >
            {b.name}
          </Button>
        ))}
      </div>

      <Card variant="default">
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full" height="48px" />)}
            </div>
          ) : filteredModels.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={48} strokeWidth={1.5} />}
              title="No Models Found"
              description="No models match the selected filter"
            />
          ) : (
            <DataTable
              data={filteredModels}
              keyField="id"
              columns={[
                {
                  key: 'brand',
                  header: 'Brand',
                  render: (m) => {
                    const b = brands.find((bb) => bb.id === m.brandId);
                    return <span className="font-semibold text-text-primary">{b?.name || m.brandId}</span>;
                  },
                },
                {
                  key: 'name',
                  header: 'Model',
                  render: (m) => <span className="text-text-secondary">{m.name}</span>,
                },
                {
                  key: 'year',
                  header: 'Year',
                  render: (m) => <Badge variant="neutral">{m.releaseYear}</Badge>,
                },
                {
                  key: 'storage',
                  header: 'Storage Options',
                  render: (m) => (
                    <div className="flex gap-1">
                      {m.storageOptions.map((s) => (
                        <Badge key={s} variant="info" size="sm">{s}</Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'colors',
                  header: 'Colors',
                  render: (m) => <span className="text-caption text-text-muted">{m.colors.length} options</span>,
                },
                {
                  key: 'action',
                  header: '',
                  render: (m) => (
                    <Button size="sm" variant="secondary" icon={<ChevronRight size={16} />} onClick={() => navigate(`/category/${m.id}`)}>
                      Edit Specs
                    </Button>
                  ),
                  className: 'text-right',
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryMgmt;
