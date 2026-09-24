import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { CheckCircle, Clock, UserCheck, ArrowLeft, Truck, XCircle, ShieldCheck } from 'lucide-react';

type TStatus = 'pending_checkout' | 'verifying' | 'verified' | 'failed';

const STEPS: { key: TStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: 'pending_checkout',
    label: 'Pending verification',
    desc: 'Store owner enters new-phone sale price; waiting for customer App confirm',
    icon: <UserCheck size={24} />,
  },
  {
    key: 'verifying',
    label: 'Verifying',
    desc: 'Customer confirmed on App — finalizing trade-in checkout',
    icon: <Clock size={24} />,
  },
  {
    key: 'verified',
    label: 'Verified',
    desc: 'Trade-in complete — hand device to DB for warehouse shipment',
    icon: <CheckCircle size={24} />,
  },
];

/** TAB-P0-16 — data-wipe checklist (per platform), clerk guides the user through each step. */
const WIPE_STEPS: Record<'ios' | 'android', { key: string; label: string; guide: string }[]> = {
  ios: [
    { key: 'account', label: '退出 Apple ID / iCloud', guide: '设置 → Apple ID → 退出登录（关闭查找）' },
    { key: 'screenlock', label: '移除屏幕锁', guide: '设置 → 面容/触控 ID 与密码' },
    { key: 'sim', label: '移除 SIM / SD / eSIM', guide: '取出卡槽' },
    { key: 'erase', label: '抹掉所有内容和设置', guide: '设置 → 通用 → 传输或还原 → 抹掉' },
  ],
  android: [
    { key: 'account', label: '退出 Google 账号', guide: '设置 → 账户 → 移除账号' },
    { key: 'screenlock', label: '移除屏幕锁', guide: '设置 → 安全' },
    { key: 'sim', label: '移除 SIM / SD / eSIM', guide: '取出卡槽' },
    { key: 'erase', label: '恢复出厂设置', guide: '设置 → 系统 → 重置 → 抹掉所有数据' },
  ],
};

/** TAB-P0-05 — verification timeline + hand to DB */
export default function VerificationStatus() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TStatus>('pending_checkout');
  const [handedToDb, setHandedToDb] = useState(false);
  // 数据清除（TAB-P0-16）——核销/发仓库前置
  const [wipePlatform, setWipePlatform] = useState<'ios' | 'android'>('ios');
  const [wipeChecks, setWipeChecks] = useState<Record<string, boolean>>({});
  const [wipeVerified, setWipeVerified] = useState(false);
  const [wipeDone, setWipeDone] = useState(false);
  const [wipeFailed, setWipeFailed] = useState(false);

  const wipeSteps = WIPE_STEPS[wipePlatform];
  const wipeAllChecked = wipeSteps.every((s) => wipeChecks[s.key]) && wipeVerified;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/trade-in/${sessionId}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { status?: string };
        if (cancelled) return;
        if (data.status === 'confirmed') {
          setStatus('verified');
        } else if (data.status === 'awaiting_user_confirm') {
          setStatus((prev) => (prev === 'verified' || prev === 'failed' ? prev : 'pending_checkout'));
        }
      } catch { /* demo fallback buttons remain */ }
    };
    void poll();
    const id = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  const activeIdx = status === 'failed' ? -1 : STEPS.findIndex((s) => s.key === status);

  return (
    <div className="p-4 sm:p-6" data-testid="verification-status">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/session/${sessionId}/report`)}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Verification Status</h1>
      </div>

      {/* 数据清除（TAB-P0-16）——核销/发仓库前置 */}
      <Card variant="flat" className="mb-4 border-primary-200" data-testid="data-wipe">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-primary-600" />
          <h2 className="text-h4 font-heading">Data Wipe</h2>
          <div className="ml-auto flex gap-1">
            {(['ios', 'android'] as const).map((p) => (
              <button
                key={p}
                type="button"
                data-testid={`wipe-platform-${p}`}
                onClick={() => setWipePlatform(p)}
                className={`px-2.5 py-1 rounded-md text-eyebrow font-semibold uppercase border transition-colors ${
                  wipePlatform === p
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border text-text-muted hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <p className="text-caption text-text-muted mb-3">
          报价已接受。引导用户本人在旧机上完成清除（退出账号需用户本人操作），逐项勾选并验证后再核销/发仓库。
        </p>
        {wipeSteps.map((s) => (
          <label key={s.key} className="flex items-start gap-2 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!wipeChecks[s.key]}
              onChange={(e) => setWipeChecks((prev) => ({ ...prev, [s.key]: e.target.checked }))}
              className="mt-0.5 accent-primary-500 w-4 h-4"
            />
            <span className="flex-1">
              <span className="text-body font-medium">{s.label}</span>
              <span className="block text-caption text-text-muted">{s.guide}</span>
            </span>
          </label>
        ))}
        <label className="flex items-center gap-2 pt-2 mt-2 border-t border-border cursor-pointer">
          <input
            type="checkbox"
            checked={wipeVerified}
            onChange={(e) => setWipeVerified(e.target.checked)}
            className="accent-primary-500 w-4 h-4"
          />
          <span className="text-caption font-semibold">
            验证通过：重启后{wipePlatform === 'ios' ? '进入「你好」无激活锁' : '进入初始向导无 FRP 锁'}
          </span>
        </label>
        <div className="flex gap-2 mt-3">
          <Button
            variant="primary"
            size="sm"
            disabled={!wipeAllChecked || wipeDone}
            data-testid="wipe-complete"
            onClick={() => setWipeDone(true)}
          >
            清除完成
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWipeFailed(true)}>
            暂缓（忘记密码）
          </Button>
        </div>
        {wipeFailed && !wipeDone && (
          <p className="text-caption text-dobara-warning mt-2">
            已暂缓：引导用户找回密码后继续清除，设备暂存门店。
          </p>
        )}
        {wipeDone && (
          <p className="text-caption text-dobara-success mt-2" data-testid="wipe-done">
            ✓ 已清除，可继续核销与发仓库。
          </p>
        )}
      </Card>

      {status === 'failed' && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <XCircle size={16} /> Verification failed / timed out
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setStatus('pending_checkout')}>
            Reset demo
          </Button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {STEPS.map((step, i) => {
          const isPast = activeIdx > i;
          const isActive = activeIdx === i;
          return (
            <Card key={step.key} variant="flat">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isPast || (step.key === 'verified' && status === 'verified')
                      ? 'bg-dobara-success-light text-dobara-success'
                      : isActive
                      ? 'bg-dobara-info-light text-dobara-info'
                      : 'bg-surface-high text-text-muted'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lead font-semibold text-text-primary">{step.label}</h3>
                  <p className="text-caption text-text-muted">{step.desc}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-caption font-semibold ${
                    isPast || (isActive && step.key === 'verified')
                      ? 'bg-dobara-success-light text-[#064e3b]'
                      : isActive
                      ? 'bg-dobara-info-light text-[#1e3a8a]'
                      : 'bg-surface-high text-text-muted'
                  }`}
                >
                  {isPast ? 'Done' : isActive ? 'Current' : 'Pending'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="sm" variant="ghost" data-testid="sim-verifying" onClick={() => setStatus('verifying')}>
          Simulate user confirmed
        </Button>
        <Button size="sm" variant="ghost" data-testid="sim-verified" onClick={() => setStatus('verified')}>
          Simulate verified
        </Button>
        <Button size="sm" variant="ghost" data-testid="sim-failed" onClick={() => setStatus('failed')}>
          Simulate failed
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={status !== 'verified' || handedToDb || !wipeDone}
          data-testid="hand-to-db"
          icon={<Truck size={18} />}
          onClick={() => setHandedToDb(true)}
        >
          {handedToDb ? 'Handed to DB' : 'Hand to DB'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Done
        </Button>
      </div>
    </div>
  );
}
