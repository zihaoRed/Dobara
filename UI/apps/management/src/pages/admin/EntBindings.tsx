import React, { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge } from '@dobara/ui';
import { Building2 } from 'lucide-react';
import { maskPhone } from '@dobara/utils';

/**
 * SA-P0-02 企业账号绑定管理（05 PRD v3.12）。
 * 企业账号 = C 端手机号账号 + 注册时自助绑定门店（06 §2.12.2）——本页无"创建"动作，
 * 只做事后管理：查看绑定列表、停用/启用（停用后该用户企业模块入口消失、企业 API 拒绝）。
 */

interface EntBindingRow {
  id: string;
  userId: string;
  phone: string;
  userName: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  enterpriseName?: string;
  gstin?: string;
  billingContact?: string;
  source: 'registration' | 'settings';
  status: 'active' | 'disabled';
  boundAt: string;
}

export default function EntBindings() {
  const [rows, setRows] = useState<EntBindingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/ent/bindings')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { bindings: EntBindingRow[] }) => setRows(d.bindings ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (row: EntBindingRow) => {
    setBusyId(row.id);
    try {
      await fetch(`/api/ent/bindings/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status === 'active' ? 'disabled' : 'active' }),
      });
      load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card variant="default" data-testid="ent-bindings">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-h4 font-heading flex items-center gap-2">
              <Building2 size={18} /> Enterprise bindings (ROLE-ENT)
            </h2>
            <p className="text-caption text-text-muted mt-1">
              Self-registered on the consumer App (store chosen from pre-imported profiles) · disabling hides the
              enterprise module for that user; B2B orders and pending settlements are unaffected.
            </p>
          </div>
          <Badge variant="info" size="md">{rows.length}</Badge>
        </div>

        {loading ? (
          <p className="text-caption text-text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-caption text-text-muted">No enterprise bindings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Store', 'Enterprise info', 'Source', 'Status', ''].map((h) => (
                    <th key={h} className="px-3 py-2 text-eyebrow font-semibold text-text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0" data-testid={`ent-binding-${r.id}`}>
                    <td className="px-3 py-2">
                      <p className="text-body font-medium">{r.userName}</p>
                      <p className="text-caption text-text-muted font-mono">{maskPhone(r.phone)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-body">{r.storeName}</p>
                      <p className="text-caption text-text-muted font-mono">{r.storeCode}</p>
                    </td>
                    <td className="px-3 py-2 text-caption text-text-secondary">
                      {r.enterpriseName || '—'}
                      {r.gstin ? <span className="block text-text-muted font-mono">{r.gstin}</span> : null}
                      {r.billingContact ? <span className="block text-text-muted">{r.billingContact}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-caption">{r.source}</td>
                    <td className="px-3 py-2">
                      <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === r.id}
                        onClick={() => toggle(r)}
                      >
                        {r.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
