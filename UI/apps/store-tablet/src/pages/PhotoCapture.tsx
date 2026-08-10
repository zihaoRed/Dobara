import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '@dobara/ui';
import { Camera } from 'lucide-react';
import { PHOTO_ANGLES } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-01 — sequential 10-angle capture with overlay guide */
export default function PhotoCapture() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(10).fill(null));
  const [active, setActive] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filledCount = photos.filter(Boolean).length;
  const nextRequired = photos.findIndex((p) => !p);
  const currentIndex = nextRequired === -1 ? active : nextRequired;

  useEffect(() => {
    if (nextRequired >= 0) setActive(nextRequired);
  }, [nextRequired]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const idx = nextRequired === -1 ? active : nextRequired;
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (filledCount < 10) return;
    markStepComplete(sessionId, 'photo');
    navigate(`/session/${sessionId}/video`);
  };

  return (
    <div className="p-4 sm:p-6" data-testid="photo-capture">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Photo Capture</h1>
      <p className="text-body text-text-body mb-4">
        Capture angles in order. Current: <b>{PHOTO_ANGLES[currentIndex]}</b> ({currentIndex + 1}/10)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_280px] gap-4 mb-4">
        <Card className="relative aspect-[4/3] max-h-[min(480px,55dvh)] w-full mx-auto overflow-hidden p-0 bg-surface-high flex items-center justify-center">
          {photos[currentIndex] ? (
            <img src={photos[currentIndex]!} alt={PHOTO_ANGLES[currentIndex]} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-6">
              <div className="mx-auto mb-3 w-32 h-44 sm:w-40 sm:h-56 border-2 border-dashed border-primary-400 rounded-2xl opacity-70" />
              <p className="text-caption text-primary-700 font-semibold">Overlay guide · {PHOTO_ANGLES[currentIndex]}</p>
              <p className="text-eyebrow text-text-muted mt-1">Align device to the silhouette, then capture</p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              data-testid="capture-photo"
              onClick={() => fileRef.current?.click()}
              icon={<Camera size={18} />}
            >
              {photos[currentIndex] ? 'Retake' : 'Capture'} {PHOTO_ANGLES[currentIndex]}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </Card>

        <div className="min-w-0">
          <p className="text-eyebrow text-text-muted mb-2">Gallery</p>
          <div className="grid grid-cols-5 md:grid-cols-2 gap-2 max-h-[min(360px,40dvh)] md:max-h-[min(420px,55dvh)] overflow-y-auto">
            {PHOTO_ANGLES.map((angle, i) => {
              const locked = i > (nextRequired === -1 ? 9 : nextRequired);
              return (
                <button
                  key={angle}
                  type="button"
                  disabled={locked && !photos[i]}
                  onClick={() => {
                    if (photos[i] || i === nextRequired) setActive(i);
                  }}
                  className={`aspect-square rounded-md border overflow-hidden text-left ${
                    i === currentIndex ? 'ring-2 ring-primary-500' : 'border-border'
                  } ${locked && !photos[i] ? 'opacity-40' : ''}`}
                >
                  {photos[i] ? (
                    <img src={photos[i]!} alt={angle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-high flex items-center justify-center px-1">
                      <span className="text-[10px] text-text-muted text-center">{i + 1}. {angle}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ProgressBar value={filledCount} max={10} color="primary" size="md" showLabel />
        <p className="text-caption text-text-muted mt-1 text-center">{filledCount}/10 photos captured</p>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}`)}>Back</Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid="demo-fill-photos"
          onClick={() => {
            // Demo helper: mark all angles captured without real camera
            const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            setPhotos(Array(10).fill(placeholder));
          }}
        >
          Demo: Fill All
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={filledCount < 10}
          data-testid="photos-continue"
          onClick={handleSubmit}
        >
          Confirm & Continue to Video
        </Button>
      </div>
    </div>
  );
}
