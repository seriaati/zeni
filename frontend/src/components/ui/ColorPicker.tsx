import { useState, useRef } from 'react';
import { Pipette } from 'lucide-react';
import { COLOR_GROUPS } from '../../lib/colors';

type Props = {
  value: string | null;
  onChange: (color: string | null) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const nativePickerRef = useRef<HTMLInputElement>(null);

  const handleGroupClick = (label: string) => {
    setExpandedGroup((prev) => (prev === label ? null : label));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    }
  };

  const handleNativePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomInput(v);
    onChange(v);
  };

  const isCustom = value !== null && !COLOR_GROUPS.some((g) => g.shades.includes(value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button
          title="No color"
          onClick={() => { onChange(null); setExpandedGroup(null); }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'white',
            border: `3px solid ${value === null ? 'var(--ink)' : 'var(--cream-darker)'}`,
            cursor: 'pointer',
            outline: value === null ? '2px solid white' : 'none',
            outlineOffset: '-4px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--ink-faint)', fontWeight: 700, lineHeight: 1,
          }}>∅</span>
        </button>

        {COLOR_GROUPS.map((group) => {
          const representative = group.shades[0];
          const groupSelected = group.shades.includes(value ?? '');
          const isOpen = expandedGroup === group.label;
          return (
            <button
              key={group.label}
              title={group.label}
              onClick={() => handleGroupClick(group.label)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: representative,
                border: `3px solid ${groupSelected || isOpen ? 'var(--ink)' : 'transparent'}`,
                cursor: 'pointer',
                outline: groupSelected || isOpen ? '2px solid white' : 'none',
                outlineOffset: '-4px',
                flexShrink: 0,
                transition: 'border-color 0.12s',
              }}
            />
          );
        })}

        <button
          title="Custom color"
          onClick={() => { setExpandedGroup(null); nativePickerRef.current?.click(); }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isCustom ? (value ?? 'white') : 'white',
            border: `3px solid ${isCustom ? 'var(--ink)' : 'var(--cream-darker)'}`,
            cursor: 'pointer',
            outline: isCustom ? '2px solid white' : 'none',
            outlineOffset: '-4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'border-color 0.12s',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Pipette size={12} color={isCustom ? (value ? getContrastColor(value) : 'var(--ink-mid)') : 'var(--ink-faint)'} />
          <input
            ref={nativePickerRef}
            type="color"
            value={value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#888888'}
            onChange={handleNativePick}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            tabIndex={-1}
          />
        </button>
      </div>

      {expandedGroup && (() => {
        const group = COLOR_GROUPS.find((g) => g.label === expandedGroup)!;
        return (
          <div style={{
            display: 'flex',
            gap: 6,
            padding: '8px 10px',
            background: 'var(--cream-dark)',
            borderRadius: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>
              {group.label}
            </span>
            {group.shades.map((shade) => (
              <button
                key={shade}
                title={shade}
                onClick={() => { onChange(shade); setExpandedGroup(null); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: shade,
                  border: `3px solid ${value === shade ? 'var(--ink)' : 'transparent'}`,
                  cursor: 'pointer',
                  outline: value === shade ? '2px solid white' : 'none',
                  outlineOffset: '-4px',
                  flexShrink: 0,
                  transition: 'border-color 0.12s',
                }}
              />
            ))}
          </div>
        );
      })()}

      {isCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: value ?? 'transparent', border: '1px solid var(--cream-darker)', flexShrink: 0 }} />
          <input
            className="input"
            placeholder="#rrggbb"
            value={customInput || value || ''}
            onChange={handleCustomInputChange}
            style={{ height: 32, fontSize: 13, fontFamily: 'monospace', width: 110 }}
            maxLength={7}
          />
        </div>
      )}
    </div>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#333333' : '#ffffff';
}
