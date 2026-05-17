import { useState, useCallback } from 'react'

export function Controls() {
  const [opacity, setOpacity] = useState(1.0)

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setOpacity(val)
    window.api.setOpacity(val)
  }, [])

  return (
    <div
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--panel-divider)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <SliderRow
        label="투명도"
        value={opacity}
        min={0.4}
        max={1.0}
        step={0.05}
        display={opacity.toFixed(2)}
        onChange={handleOpacity}
      />
    </div>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function SliderRow({ label, value, min, max, step, display, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <span
        style={{
          width: 40,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--control-label-fg)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            WebkitAppearance: 'none',
            appearance: 'none',
            height: 4,
            borderRadius: 999,
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, var(--control-track-fill) ${pct}%, var(--control-track) ${pct}%)`,
          }}
        />
      </div>
      <span
        style={{
          width: 32,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--control-label-fg)',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {display}
      </span>
    </div>
  )
}
