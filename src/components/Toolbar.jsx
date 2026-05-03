import React from "react";

export default function Toolbar({
  zoom,
  onZoomChange,
  fontFamily,
  onFontChange,
  theme,
  onThemeChange,
  position,
  containerRef,
}) {
  const labelClassName = "text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-fg-muted)]";
  const selectClassName = "w-full rounded border px-2 py-1.5 text-sm cursor-pointer transition-colors border-[var(--color-border-default)] bg-[var(--color-canvas-inset)] text-[var(--color-fg-default)] hover:bg-[var(--color-neutral-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-emphasis)]";

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-64 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-canvas-overlay)] p-3 shadow-2xl shadow-black/15 select-none"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mb-3 border-b border-[var(--color-border-subtle)] pb-2 text-xs font-semibold text-[var(--color-fg-default)]">
        Ustawienia widoku
      </div>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className={labelClassName}>Motyw</span>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            title="Motyw"
            className={selectClassName}
          >
            <option value="light">Jasny</option>
            <option value="dark">Ciemny</option>
            <option value="system">Systemowy</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Powiekszenie</span>
          <select
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            title="Powieksz"
            className={selectClassName}
          >
            {[50, 75, 100, 125, 150, 175, 200].map((v) => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Font</span>
          <select
            value={fontFamily}
            onChange={(e) => onFontChange(e.target.value)}
            title="Font"
            className={selectClassName}
          >
            <option value="system-ui">System</option>
            <option value="Inter">Inter</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="-apple-system">Apple</option>
            <option value="Helvetica Neue">Helvetica</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier</option>
            <option value="JetBrains Mono">JetBrains</option>
            <option value="Fira Code">Fira Code</option>
          </select>
        </label>
      </div>
    </div>
  );
}
