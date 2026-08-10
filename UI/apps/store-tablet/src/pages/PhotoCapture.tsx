import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '@dobara/ui';
import { Camera } from 'lucide-react';
import { PHOTO_ANGLES } from '@dobara/utils';

export default function PhotoCapture() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(10).fill(null));
  const fileRefs = useRef<(HTMLInputElement | null)[]>(Array(10).fill(null));

  const filledCount = photos.filter(Boolean).length;

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
    }
  };

  const handleCellClick = (index: number) => {
    fileRefs.current[index]?.click();
  };

  const handleSubmit = () => {
    if (filledCount >= 10) {
      navigate(`/session/${sessionId}/video`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Photo Capture</h1>
      <p className="text-body text-text-body mb-6">
        Take photos from all 10 angles. All angles are required before proceeding.
      </p>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {PHOTO_ANGLES.map((angle, i) => (
          <Card
            key={i}
            variant="flat"
            className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all aspect-[4/3] flex flex-col items-center justify-center overflow-hidden p-0"
            onClick={() => handleCellClick(i)}
          >
            {photos[i] ? (
              <div className="relative w-full h-full">
                <img
                  src={photos[i]!}
                  alt={angle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 text-center">
                  {angle}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-text-muted">
                <Camera size={24} />
                <span className="text-[10px] text-center px-1 leading-tight">{angle}</span>
              </div>
            )}
            <input
              ref={(el) => { fileRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange(i, e)}
            />
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <ProgressBar
          value={filledCount}
          max={10}
          color="primary"
          size="md"
          showLabel
        />
        <p className="text-caption text-text-muted mt-1 text-center">
          {filledCount}/10 photos captured
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}`)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={filledCount < 10}
          onClick={handleSubmit}
        >
          Confirm &amp; Continue
        </Button>
      </div>
    </div>
  );
}
