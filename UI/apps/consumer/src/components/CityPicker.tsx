import React, { useMemo, useState } from 'react';
import { Modal, Button } from '@dobara/ui';
import { MapPin, Search, Check, AlertTriangle } from 'lucide-react';
import {
  getUserCity, setUserCity, clearUserCity, citiesByStock,
  locateCity, setLocatedCity, getLocatedCity, isUnserved, hasManualCity,
  markAskedForLocation, hasBeenAskedForLocation, NATIONAL_CITY,
} from '../lib/userCity';

/**
 * APP-P1-03 — city picker bottom sheet.
 * Sections (per PRD): location entry → search (when >10 cities) → located city row →
 * nationwide → served cities by stock. Unserved located cities are shown but not selectable.
 */
export function CityPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState('');
  const [askOpen, setAskOpen] = useState(false);

  const current = getUserCity();
  const located = getLocatedCity();
  const cities = useMemo(() => citiesByStock(), []);
  const showSearch = cities.length > 10;

  const filtered = showSearch && search.trim()
    ? cities.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : cities;

  const close = () => {
    setSearch('');
    setNotice('');
    onClose();
  };

  const pick = (city: string) => {
    setUserCity(city);
    close();
  };

  const pickNational = () => {
    clearUserCity();
    close();
  };

  const runLocate = async () => {
    setLocating(true);
    setNotice('');
    const city = await locateCity();
    setLocating(false);
    if (!city) {
      setNotice('Could not get your location — please pick a city below.');
      return;
    }
    setLocatedCity(city);
    setNotice(
      isUnserved(city)
        ? `${city} isn't served yet — showing nationwide stock.`
        : `Located: ${city}`,
    );
  };

  /** First tap shows the purpose explainer; only then does the system prompt appear. */
  const onLocationTap = () => {
    if (hasBeenAskedForLocation()) {
      void runLocate();
      return;
    }
    setAskOpen(true);
  };

  const allowLocation = () => {
    markAskedForLocation();
    setAskOpen(false);
    void runLocate();
  };

  return (
    <>
      <Modal open={open} onClose={close} title="Select city" size="sm">
        <div className="space-y-3" data-testid="city-picker">
          <button
            type="button"
            data-testid="city-use-location"
            onClick={onLocationTap}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border border-border hover:bg-surface-low text-left"
          >
            <MapPin size={16} className="text-primary-500" />
            <span className="text-body font-medium">{locating ? 'Locating…' : 'Use my location'}</span>
          </button>

          {notice && (
            <p className="text-caption text-text-secondary" data-testid="city-locate-notice">{notice}</p>
          )}

          {showSearch && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                data-testid="city-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city"
                className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-surface-container text-caption"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto -mx-1" data-testid="city-list">
            {/* Located city row — only when we actually have one */}
            {located && !search.trim() && (
              <CityRow
                name={located}
                sub={isUnserved(located) ? 'Not served yet' : 'Current location'}
                unserved={isUnserved(located)}
                selected={!hasManualCity() && current === located}
                onSelect={() => !isUnserved(located) && pick(located)}
                testId="city-row-located"
              />
            )}

            {!search.trim() && (
              <CityRow
                name={NATIONAL_CITY}
                sub="Browse all cities"
                selected={current === NATIONAL_CITY}
                onSelect={pickNational}
                testId="city-row-national"
              />
            )}

            {filtered.map((c) => (
              <CityRow
                key={c.name}
                name={c.name}
                sub={`${c.devices} devices`}
                selected={current === c.name}
                onSelect={() => pick(c.name)}
                testId={`city-row-${c.name}`}
              />
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-caption text-text-muted text-center">No cities found</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Purpose explainer — precedes the system permission prompt (APP-P1-03) */}
      <Modal open={askOpen} onClose={() => setAskOpen(false)} title="Use your location?" size="sm">
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Allowing location lets us show devices stocked in your city first, which ships faster.
            We only keep the city name — never your coordinates.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAskOpen(false)} data-testid="city-location-decline">
              Not now
            </Button>
            <Button variant="primary" className="flex-1" onClick={allowLocation} data-testid="city-location-allow">
              Allow location
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CityRow({
  name, sub, selected, unserved = false, onSelect, testId,
}: {
  name: string;
  sub: string;
  selected: boolean;
  unserved?: boolean;
  onSelect: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onSelect}
      disabled={unserved}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left ${
        unserved ? 'opacity-60 cursor-not-allowed' : 'hover:bg-surface-low'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium truncate">{name}</p>
        <p className="text-eyebrow text-text-muted truncate">
          {unserved && <AlertTriangle size={10} className="inline mr-1 text-dobara-warning" />}
          {sub}
        </p>
      </div>
      {selected && <Check size={16} className="text-primary-500 shrink-0" />}
    </button>
  );
}
