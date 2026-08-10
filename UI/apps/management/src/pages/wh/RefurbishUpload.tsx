import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, ProgressBar } from '@dobara/ui';
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react';

const RefurbishUpload: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [dataOverwriteConfirmed, setDataOverwriteConfirmed] = useState(false);

  useEffect(() => {
    if (uploading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [uploading]);

  const handleConfirmSubmit = () => {
    if (dataOverwriteConfirmed) {
      setConfirmed(true);
    }
  };

  if (confirmed) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Data Submitted!</h3>
          <p className="text-body text-text-secondary">
            Refurbish quality data for <span className="font-mono">{imei}</span> has been overwritten and saved.
          </p>
          <Button onClick={() => navigate('/wh')}>Back to Warehouse</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/wh/inbound/${imei}/refurbish`)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Upload & Confirm</h2>
      </div>

      {/* Upload Progress */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Upload size={18} /> Uploading Data
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProgressBar value={Math.min(progress, 100)} variant="success" />
          <p className="text-caption text-text-muted text-center">
            {uploading ? `Uploading... ${Math.round(Math.min(progress, 100))}%` : 'Upload complete!'}
          </p>
          <div className="text-caption text-text-body space-y-1">
            <p>• Photos: {progress > 30 ? '✓' : '⋯'}</p>
            <p>• Hardware data: {progress > 60 ? '✓' : '⋯'}</p>
            <p>• Appearance report: {progress > 90 ? '✓' : '⋯'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Overwrite Confirmation */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Data Overwrite Confirmation</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body text-text-secondary">
            Uploading will overwrite existing quality data for device <span className="font-mono">{imei}</span>.
            Please confirm this action.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dataOverwriteConfirmed}
              onChange={(e) => setDataOverwriteConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary-500"
            />
            <span className="text-body">I confirm I want to overwrite the data</span>
          </label>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!dataOverwriteConfirmed || uploading}
            onClick={handleConfirmSubmit}
          >
            Confirm & Submit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefurbishUpload;
