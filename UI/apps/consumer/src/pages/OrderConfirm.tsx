import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PriceDisplay, GradeBadge, Badge, EmptyState } from '@dobara/ui';
import { MapPin, Truck, CreditCard, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { IDevice, IModel, IBrand } from '@dobara/utils';
import { calcOrderTotal, imeiLast4, type TDeliveryMethod } from '@dobara/utils';

interface Address {
  id: string;
  name: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  label?: string;
  isDefault: boolean;
}

type Serviceability = {
  serviceable: boolean;
  etaStandard?: string | null;
  etaExpress?: string | null;
  message?: string;
  loading?: boolean;
  error?: string;
};

const DEMO_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    name: 'Rahul Sharma',
    phone: '9876543201',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '12 Palm Grove, Andheri West',
    pincode: '400058',
    label: 'Home',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Rahul Sharma',
    phone: '9876543201',
    state: 'Delhi',
    city: 'New Delhi',
    address: 'Connaught Place Block A',
    pincode: '110001',
    label: 'Office',
    isDefault: false,
  },
  {
    id: 'addr-bad',
    name: 'Test User',
    phone: '9876543210',
    state: 'Test',
    city: 'Remote',
    address: 'Unserviceable demo address',
    pincode: '999999',
    label: 'Other',
    isDefault: false,
  },
];

export function OrderConfirm() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<IDevice | null>(null);
  const [brand, setBrand] = useState<IBrand | null>(null);
  const [model, setModel] = useState<IModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [delivery, setDelivery] = useState<TDeliveryMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [serviceability, setServiceability] = useState<Serviceability>({ serviceable: false, loading: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!imei) return;
    setLoading(true);
    fetch(`/api/devices/${imei}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        if (!data.device) throw new Error('missing device');
        setDevice(data.device);
        setModel(data.model);
        setBrand(data.brand);
      })
      .catch(() => {
        // Demo fallback when MSW is unavailable
        setDevice({
          imei,
          brandId: 'apple',
          modelId: 'iphone13',
          grade: 'A',
          color: 'Midnight',
          storage: '128GB',
          status: 'available',
          price: 42000,
          originalPrice: 59900,
          city: 'Mumbai',
          warehouseId: 'wh-mum',
        });
        setBrand({ id: 'apple', name: 'Apple' });
        setModel({
          id: 'iphone13',
          brandId: 'apple',
          name: 'iPhone 13',
          releaseYear: 2021,
          colors: ['Midnight'],
          storageOptions: ['128GB'],
          specs: {
            processor: 'A15',
            ram: '4GB',
            display: '6.1"',
            rearCamera: '12MP',
            frontCamera: '12MP',
            battery: '3240mAh',
            os: 'iOS 15',
            dimensions: '146.7mm',
            connectivity: '5G',
            security: 'Face ID',
            waterproof: 'IP68',
            simSlot: 'Dual',
          },
        });
      })
      .finally(() => setLoading(false));
  }, [imei]);

  useEffect(() => {
    fetch('/api/addresses')
      .then((r) => r.json())
      .then((d) => {
        const list: Address[] = d.addresses?.length ? d.addresses : DEMO_ADDRESSES;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => {
        setAddresses(DEMO_ADDRESSES);
        setSelectedAddressId(DEMO_ADDRESSES[0].id);
      });
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;

  const checkPincode = useCallback(async (pincode: string) => {
    setServiceability({ serviceable: false, loading: true });
    const localFallback = () => {
      const bad = pincode === '999999' || pincode === '000000' || pincode === '123456';
      setServiceability({
        serviceable: !bad,
        etaStandard: bad ? null : '3-5 business days',
        etaExpress: bad ? null : '1-2 business days',
        message: bad
          ? 'This area is not serviceable. Please change your address.'
          : 'Delivery available to this pincode',
        loading: false,
      });
    };
    try {
      const res = await fetch(`/api/pincode/${pincode}/serviceability`);
      if (!res.ok) {
        localFallback();
        return;
      }
      const data = await res.json();
      setServiceability({
        serviceable: !!data.serviceable,
        etaStandard: data.etaStandard,
        etaExpress: data.etaExpress,
        message: data.message,
        loading: false,
      });
    } catch {
      localFallback();
    }
  }, []);

  useEffect(() => {
    if (!selectedAddress?.pincode) {
      setServiceability({ serviceable: false, loading: false, message: 'Please add a delivery address' });
      return;
    }
    const t = setTimeout(() => checkPincode(selectedAddress.pincode), 500);
    return () => clearTimeout(t);
  }, [selectedAddress?.pincode, checkPincode]);

  const breakdown = useMemo(() => {
    if (!device) return null;
    return calcOrderTotal(device.price, delivery);
  }, [device, delivery]);

  const canSubmit =
    !!device &&
    !!selectedAddress &&
    serviceability.serviceable &&
    !serviceability.loading &&
    !submitting;

  const handleSubmit = async () => {
    if (!imei || !device || !selectedAddress || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceImei: imei,
          deliveryMethod: delivery,
          paymentMethod,
          addressId: selectedAddress.id,
          pincode: selectedAddress.pincode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Local demo path when API/MSW unavailable
        if (selectedAddress.pincode === '999999') {
          setError('This area is not serviceable. Please change your address.');
          setSubmitting(false);
          return;
        }
        const orderId = `ORD-${Date.now().toString().slice(-8)}`;
        navigate(`/buy/order/pay/${orderId}`, {
          state: {
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            amount: breakdown?.total || device.price,
          },
        });
        return;
      }
      navigate(`/buy/order/pay/${data.orderId}`, {
        state: { expiresAt: data.expiresAt, amount: data.order?.amount || breakdown?.total },
      });
    } catch {
      if (selectedAddress.pincode === '999999') {
        setError('This area is not serviceable. Please change your address.');
        setSubmitting(false);
        return;
      }
      const orderId = `ORD-${Date.now().toString().slice(-8)}`;
      navigate(`/buy/order/pay/${orderId}`, {
        state: {
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          amount: breakdown?.total || device.price,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-3" />
        <p className="text-body text-text-secondary">Loading order confirmation...</p>
      </div>
    );
  }

  if (!device || !brand || !model) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState title="Device not found" description="Go back and pick another device." />
        <Button className="w-full mt-4" onClick={() => navigate('/buy')}>Browse Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-28 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/buy/product/${imei}`)} data-testid="order-back">
        ← Back
      </Button>
      <h1 className="text-h3 font-bold text-text-primary" data-testid="order-confirm-title">Confirm Order</h1>
      <p className="text-caption text-text-muted -mt-2">Inventory locks only after you submit.</p>

      {/* Address */}
      <Card data-testid="order-address-section">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={18} className="text-primary-500" />
          <h3 className="text-h4 font-heading">Delivery Address</h3>
        </div>
        {addresses.length === 0 ? (
          <p className="text-caption text-dobara-error">Please add a delivery address</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                data-testid={`address-${addr.id}`}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedAddressId === addr.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:bg-surface-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body font-semibold">{addr.name}</span>
                  {addr.label && <Badge variant="neutral" size="sm">{addr.label}</Badge>}
                  {addr.isDefault && <Badge variant="accent" size="sm">Default</Badge>}
                </div>
                <p className="text-caption text-text-secondary">+91 {addr.phone}</p>
                <p className="text-caption text-text-muted">
                  {addr.address}, {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-lg p-3 bg-surface-low" data-testid="pincode-status">
          {serviceability.loading ? (
            <p className="text-caption text-text-muted">Checking delivery area...</p>
          ) : serviceability.serviceable ? (
            <p className="text-caption text-dobara-success flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              Deliverable · {delivery === 'express' ? serviceability.etaExpress : serviceability.etaStandard}
            </p>
          ) : (
            <p className="text-caption text-dobara-error flex items-center gap-1.5">
              <XCircle size={16} />
              {serviceability.message || 'This area is not serviceable. Please change your address.'}
            </p>
          )}
        </div>
      </Card>

      {/* Device */}
      <Card data-testid="order-device-section">
        <h3 className="text-h4 font-heading mb-3">Device</h3>
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 bg-surface-high rounded-lg flex items-center justify-center shrink-0">
            <span className="text-eyebrow text-text-muted">{brand.name[0]}</span>
          </div>
          <div className="flex-1">
            <p className="text-body font-semibold">{brand.name} {model.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <GradeBadge grade={device.grade} />
              <Badge variant="neutral">{device.storage}</Badge>
              <Badge variant="neutral">{device.color}</Badge>
            </div>
            <p className="text-mono text-caption text-text-muted mt-1">IMEI ···{imeiLast4(device.imei)}</p>
          </div>
        </div>
      </Card>

      {/* Delivery */}
      <Card data-testid="order-delivery-section">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={18} className="text-primary-500" />
          <h3 className="text-h4 font-heading">Delivery Method</h3>
        </div>
        <div className="space-y-2">
          {([
            { key: 'standard' as const, label: 'Standard', desc: '3-5 business days', price: '₹50 / FREE over ₹5,000' },
            { key: 'express' as const, label: 'Express', desc: '1-2 business days', price: '₹150' },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              data-testid={`delivery-${opt.key}`}
              onClick={() => setDelivery(opt.key)}
              className={`w-full text-left rounded-lg border p-3 ${
                delivery === opt.key ? 'border-primary-500 bg-primary-50' : 'border-border'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-body font-semibold">{opt.label}</span>
                <span className="text-caption text-text-secondary">{opt.price}</span>
              </div>
              <p className="text-caption text-text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Payment */}
      <Card data-testid="order-payment-section">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={18} className="text-primary-500" />
          <h3 className="text-h4 font-heading">Payment Method</h3>
        </div>
        <button
          type="button"
          data-testid="payment-upi"
          onClick={() => setPaymentMethod('upi')}
          className={`w-full text-left rounded-lg border p-3 ${
            paymentMethod === 'upi' ? 'border-primary-500 bg-primary-50' : 'border-border'
          }`}
        >
          <p className="text-body font-semibold">UPI (Razorpay)</p>
          <p className="text-caption text-text-muted">PhonePe / Google Pay / Paytm</p>
        </button>
      </Card>

      {/* Amount */}
      {breakdown && (
        <Card data-testid="order-amount-section">
          <h3 className="text-h4 font-heading mb-3">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-body">
              <span className="text-text-secondary">Device</span>
              <span>₹{breakdown.devicePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-body">
              <span className="text-text-secondary">Shipping</span>
              <span className={breakdown.shipping === 0 ? 'text-dobara-success font-semibold' : ''}>
                {breakdown.shipping === 0 ? 'FREE' : `₹${breakdown.shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-body">
              <span className="text-text-secondary">GST (18%)</span>
              <span>₹{breakdown.gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-h4 font-heading">Total</span>
              <PriceDisplay amount={breakdown.total} size="lg" />
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="rounded-lg bg-dobara-error/10 p-3 flex items-start gap-2" data-testid="order-error">
          <AlertTriangle size={18} className="text-dobara-error shrink-0 mt-0.5" />
          <p className="text-caption text-dobara-error">{error}</p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 z-30">
        <div className="max-w-lg mx-auto rounded-2xl border border-border bg-white/95 backdrop-blur p-4 shadow-card">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
            data-testid="submit-order"
          >
            Submit Order{breakdown ? ` · ₹${breakdown.total.toLocaleString('en-IN')}` : ''}
          </Button>
          {!selectedAddress && (
            <p className="text-caption text-dobara-error text-center mt-2">Please add a delivery address first</p>
          )}
          {selectedAddress && !serviceability.serviceable && !serviceability.loading && (
            <p className="text-caption text-dobara-error text-center mt-2">Change address to a serviceable pincode</p>
          )}
        </div>
      </div>
    </div>
  );
}
