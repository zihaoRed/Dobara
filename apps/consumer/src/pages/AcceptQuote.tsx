import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PriceDisplay, GradeBadge, Modal } from '@dobara/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import type { TGrade } from '@dobara/utils';

export function AcceptQuote() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<{
    deviceSummary: { brand: string; model: string; imei: string };
    grade: TGrade;
    price: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then((r) => r.json())
      .then((d) => setReport(d.report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      navigate('/home/order/success/ORD-ACCEPTED');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    setShowRejectModal(false);
    try {
      navigate('/home');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-body text-text-secondary">Loading quote...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-8">
          <p className="text-text-muted">Report not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      <Card>
        <h2 className="text-h3 font-heading mb-1">Your Offer</h2>
        <p className="text-caption text-text-muted mb-4">
          {report.deviceSummary.brand} {report.deviceSummary.model}
        </p>

        <div className="bg-primary-50 rounded-xl p-6 text-center mb-4">
          <p className="text-caption text-primary-700 mb-2">Final Offer Price</p>
          <PriceDisplay amount={report.price} size="xl" />
          <div className="mt-3 flex justify-center">
            <GradeBadge grade={report.grade} size="md" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-caption text-text-muted">
            By accepting, you agree to sell your device at the offered price.
            The amount will be transferred to your account within 24 hours.
          </p>
        </div>
      </Card>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            onClick={() => setShowRejectModal(true)}
          >
            <XCircle size={20} /> Reject
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            loading={actionLoading}
            onClick={handleAccept}
          >
            <CheckCircle size={20} /> Accept Offer
          </Button>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Offer?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Are you sure you want to reject this offer? Your device will be returned to you.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={actionLoading}
              onClick={handleReject}
            >
              Yes, Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
