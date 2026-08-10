import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input } from '@dobara/ui';
import { ArrowLeft, UserPlus } from 'lucide-react';

const ClerkAdd: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('clerk');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (phone && password) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-3">
          <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
            <UserPlus size={32} className="text-primary-500" />
          </div>
          <h3 className="text-h3 font-heading">Clerk Added!</h3>
          <p className="text-body text-text-secondary">{phone}</p>
          <p className="text-caption text-text-body">Role: {role === 'clerk' ? 'Clerk' : 'Senior Clerk'}</p>
          <Button onClick={() => navigate('/owner/clerks')}>Back to Clerks</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner/clerks')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Add Clerk</h2>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Clerk Details</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91-9876543210"
          />
          <Input
            label="Initial Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set initial password"
          />
          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="clerk">Clerk</option>
              <option value="senior_clerk">Senior Clerk</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!phone || !password}
            icon={<UserPlus size={18} />}
            onClick={handleSubmit}
          >
            Add Clerk
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClerkAdd;
