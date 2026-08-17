import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Skeleton } from '@dobara/ui';
import { ArrowLeft, Save } from 'lucide-react';
import type { IModel, IDeviceSpecs } from '@dobara/utils';

const SpecEdit: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<IModel | null>(null);
  const [specs, setSpecs] = useState<IDeviceSpecs | null>(null);

  useEffect(() => {
    if (!modelId) return;
    fetch(`/api/models/${modelId}`)
      .then((r) => r.json())
      .then((data: { model: IModel }) => {
        setModel(data.model);
        setSpecs({ ...data.model.specs });
      })
      .finally(() => setLoading(false));
  }, [modelId]);

  const updateSpec = (key: keyof IDeviceSpecs, value: string) => {
    if (!specs) return;
    setSpecs({ ...specs, [key]: value });
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="w-full" height="400px" /></div>;
  }

  if (!model || !specs) {
    return <div className="text-center py-16 text-text-muted">Model not found</div>;
  }

  const specFields: { key: keyof IDeviceSpecs; label: string }[] = [
    { key: 'processor', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'display', label: 'Display' },
    { key: 'rearCamera', label: 'Rear Camera' },
    { key: 'frontCamera', label: 'Front Camera' },
    { key: 'battery', label: 'Battery' },
    { key: 'os', label: 'Operating System' },
    { key: 'dimensions', label: 'Dimensions & Weight' },
    { key: 'connectivity', label: 'Connectivity' },
    { key: 'security', label: 'Security' },
    { key: 'waterproof', label: 'Waterproof Rating' },
    { key: 'simSlot', label: 'SIM Slot' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={() => window.history.back()} />
          <div>
            <h1 className="text-h2 font-heading text-text-primary">Edit Specifications</h1>
            <p className="text-body text-text-muted mt-1">{model.name} (ID: {model.id})</p>
          </div>
        </div>
        <Button variant="primary" icon={<Save size={18} />}>Save Changes</Button>
      </div>

      <Card variant="default">
        <CardHeader>
          <h3 className="text-h4 font-heading text-text-primary">Technical Specifications</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {specFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                value={specs[field.key as keyof IDeviceSpecs] || ''}
                onChange={(e) => updateSpec(field.key, e.target.value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecEdit;
