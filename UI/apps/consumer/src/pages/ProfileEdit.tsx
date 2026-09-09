import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Badge } from '@dobara/ui';
import { Camera, Check, Info } from 'lucide-react';
import { getUser, setUser } from '../App';
import { maskPhone } from '@dobara/utils';

/** APP-P1 个人信息管理 — edit avatar & nickname; phone is read-only.
 *  Avatar stored as data-URL in localStorage (demo); nickname ≤ 20 chars. */

const PROFILE_KEY = 'dobara_user_profile';
const MAX_NICKNAME = 20;

interface IProfileExtra {
  avatar?: string; // data URL
  nickname?: string;
}

export function loadProfileExtra(phone: string): IProfileExtra {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, IProfileExtra>;
      return all[phone] || {};
    }
  } catch { /* ignore */ }
  return {};
}

export function saveProfileExtra(phone: string, extra: IProfileExtra) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, IProfileExtra> : {};
    all[phone] = { ...all[phone], ...extra };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

/** Square-crop helper: center-crops the picked image to a square canvas (max 512px). */
function cropSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const size = Math.min(side, 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas unavailable'));
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2, side, side,
          0, 0, size, size,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('bad image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function ProfileEdit() {
  const navigate = useNavigate();
  const user = getUser() || { phone: '', name: 'User' };
  const extra = loadProfileExtra(user.phone);
  const [avatar, setAvatar] = useState<string | undefined>(extra.avatar);
  const [nickname, setNickname] = useState(extra.nickname || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }
    try {
      const dataUrl = await cropSquare(file);
      setAvatar(dataUrl);
      setError('');
    } catch {
      setError('Could not process that image — try another one');
    } finally {
      e.target.value = '';
    }
  };

  const onNicknameChange = (v: string) => {
    // ≤ 20 chars (PRD); emoji count as single chars via Array.from
    const chars = Array.from(v);
    setNickname(chars.slice(0, MAX_NICKNAME).join(''));
  };

  const save = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      // Nickname optional — clearing it falls back to masked phone display
      saveProfileExtra(user.phone, { avatar, nickname: '' });
      setUser(user.phone, user.phone); // name falls back to phone-based default
    } else {
      saveProfileExtra(user.phone, { avatar, nickname: trimmed });
      setUser(user.phone, trimmed);
    }
    setSaved(true);
    setTimeout(() => navigate('/account'), 700);
  };

  const nicknameLen = Array.from(nickname).length;

  return (
    <div className="max-w-lg mx-auto py-5 space-y-4" data-testid="profile-edit">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <h1 className="text-h3 font-bold text-text-primary">Edit Profile</h1>

      {/* Avatar — camera / gallery, square-cropped, instant preview */}
      <Card className="!rounded-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-testid="avatar-picker"
            className="relative w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden shrink-0 active:opacity-90"
            aria-label="Change avatar"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-h2 font-bold text-white">
                {(extra.nickname || user.name || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-surface-container border border-border flex items-center justify-center">
              <Camera size={14} className="text-text-secondary" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="text-body font-medium text-text-primary">Avatar</p>
            <p className="text-caption text-text-muted">
              Take a photo or pick from gallery — auto-cropped to a square
            </p>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(undefined)}
                className="text-caption text-dobara-error mt-1"
                data-testid="avatar-remove"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPickAvatar}
        />
      </Card>

      {/* Nickname — optional, ≤20 chars, falls back to masked phone */}
      <Card className="!rounded-xl space-y-3">
        <Input
          data-testid="nickname-input"
          label="Nickname"
          value={nickname}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNicknameChange(e.target.value)}
          placeholder="Shown on your account — leave empty to use your phone number"
          hint={`${nicknameLen}/${MAX_NICKNAME} characters · emoji supported`}
        />
        <div className="flex items-start gap-2 rounded-md bg-surface-low p-3">
          <Info size={16} className="text-text-muted shrink-0 mt-0.5" />
          <p className="text-caption text-text-muted">
            If left empty, your masked phone number ({user.phone ? maskPhone(user.phone) : '—'}) is displayed instead.
          </p>
        </div>
      </Card>

      {/* Phone — read-only account identifier */}
      <Card className="!rounded-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-body font-medium text-text-primary">Phone Number</p>
            <p className="text-caption text-text-muted font-mono">
              {user.phone ? maskPhone(user.phone) : '—'}
            </p>
          </div>
          <Badge variant="neutral">Read-only</Badge>
        </div>
        <p className="text-caption text-text-muted mt-2 border-t border-border pt-2">
          Your phone number is your account ID and cannot be changed here. Contact support to transfer the account.
        </p>
      </Card>

      {error && <p className="text-caption text-dobara-error" data-testid="profile-edit-error">{error}</p>}
      {saved && (
        <p className="text-caption text-dobara-success flex items-center gap-1" data-testid="profile-edit-saved">
          <Check size={14} /> Saved — taking you back…
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/account')}>Cancel</Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={save}
          disabled={saved}
          data-testid="profile-edit-save"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
