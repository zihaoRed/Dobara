import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { Plus, Phone, Shield, Clock } from 'lucide-react';

interface Clerk {
  id: string;
  name: string;
  phone: string;
  role: string;
  lastActive: string;
  monthlyInspections: number;
}

const mockClerks: Clerk[] = [
  { id: 'c-1', name: 'Amit Singh', phone: '+91-9876543203', role: 'clerk', lastActive: '2 hours ago', monthlyInspections: 32 },
  { id: 'c-2', name: 'Sunil Yadav', phone: '+91-9876543209', role: 'clerk', lastActive: '1 day ago', monthlyInspections: 28 },
  { id: 'c-3', name: 'Meena Devi', phone: '+91-9876543210', role: 'senior_clerk', lastActive: '5 min ago', monthlyInspections: 45 },
];

const ClerkList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-heading">Clerks</h2>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => navigate('/owner/clerks/add')}>
          Add Clerk
        </Button>
      </div>

      {mockClerks.map((clerk) => (
        <Card key={clerk.id} variant="hover" onClick={() => navigate(`/owner/clerks/${clerk.id}`)}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-body font-semibold">{clerk.name}</p>
                <div className="flex items-center gap-1 text-caption text-text-body">
                  <Phone size={12} />
                  <span>{clerk.phone}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{clerk.role}</Badge>
                  <span className="text-caption text-text-muted flex items-center gap-1">
                    <Clock size={12} />
                    {clerk.lastActive}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-caption text-text-muted">Monthly Inspections</p>
                <p className="text-h4 font-heading text-primary-500">{clerk.monthlyInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClerkList;
