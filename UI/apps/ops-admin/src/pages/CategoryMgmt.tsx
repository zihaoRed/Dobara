import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge, Skeleton, EmptyState, Modal, Input } from '@dobara/ui';
import { Plus, PackageSearch, ChevronRight, ImageIcon } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import type { IBrand, IModel } from '@dobara/utils';

const GRADE_KEY = 'dobara_ops_grade_standards';
const ACTIVE_KEY = 'dobara_ops_model_active';

const DEFAULT_GRADE_BLURB = `Grade A: Near-mint, minor micro-scratches only, battery typically ≥90%.
Grade B: Light wear, small scratches, functional imperfections within policy.
Grade C: Visible wear / dents, functional OK after deductions.
Grade D: Heavy cosmetic damage; still sellable after ops adjust + markup floor.`;

function loadGradeBlurb(): string {
  try {
    return localStorage.getItem(GRADE_KEY) || DEFAULT_GRADE_BLURB;
  } catch {
    return DEFAULT_GRADE_BLURB;
  }
}

function loadActiveMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

const CategoryMgmt: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(() => loadActiveMap());
  const [gradeBlurb, setGradeBlurb] = useState(() => loadGradeBlurb());
  const [gradeDraft, setGradeDraft] = useState(() => loadGradeBlurb());

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

  const isActive = (id: string) => activeMap[id] !== false;

  const toggleActive = (id: string) => {
    setActiveMap((prev) => {
      const next = { ...prev, [id]: !isActive(id) };
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const id = `brand-local-${Date.now()}`;
    setBrands((prev) => [...prev, { id, name: newBrandName.trim() }]);
    setNewBrandName('');
    setShowAddBrand(false);
  };

  const saveGrade = () => {
    setGradeBlurb(gradeDraft);
    localStorage.setItem(GRADE_KEY, gradeDraft);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Category Management</h1>
          <p className="text-body text-text-muted mt-1">Manage brands and device model specifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus size={18} />} onClick={() => setShowAddBrand(true)}>
            Add Brand
          </Button>
          <Button variant="primary" icon={<Plus size={18} />}>
            Add Model
          </Button>
        </div>
      </div>

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

      <Card variant="default" className="mb-4">
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-full" height="48px" />
              ))}
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
                        <Badge key={s} variant="info" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (m) => (
                    <Badge variant={isActive(m.id) ? 'success' : 'neutral'}>
                      {isActive(m.id) ? 'Active' : 'Inactive'}
                    </Badge>
                  ),
                },
                {
                  key: 'action',
                  header: '',
                  render: (m) => (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(m.id)}>
                        {isActive(m.id) ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<ChevronRight size={16} />}
                        onClick={() => navigate(`/category/${m.id}`)}
                      >
                        Edit Specs
                      </Button>
                    </div>
                  ),
                  className: 'text-right',
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Grade standards A–D</h3>
          </CardHeader>
          <CardContent>
            <textarea
              value={gradeDraft}
              onChange={(e) => setGradeDraft(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface-container text-body text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-caption text-text-muted">Saved locally for ops reference</p>
              <Button
                size="sm"
                variant="primary"
                onClick={saveGrade}
                disabled={gradeDraft === gradeBlurb}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary flex items-center gap-2">
              <ImageIcon size={18} /> Product image library
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-body text-text-secondary">
              Hero / main product images are uploaded during the ops review workbench when listing a
              device. Category management does not host the image library; use Review Workbench →
              adjust & list to attach the mall main image for each SKU.
            </p>
            <p className="text-caption text-text-muted mt-3">
              Tip: keep brand-level style guides consistent; model-level assets live with the listing.
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal open={showAddBrand} onClose={() => setShowAddBrand(false)} title="Add Brand" size="sm">
        <div className="space-y-4">
          <Input
            label="Brand name"
            placeholder="e.g. Realme"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddBrand(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddBrand}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryMgmt;
