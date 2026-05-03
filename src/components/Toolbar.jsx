import React from "react";

export default function Toolbar({
  zoom,
  onZoomChange,
  fontFamily,
  onFontChange,
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-2 py-1.5 border-b border-gray-200 bg-white select-none">
      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        title="Powieksz"
        className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-100 focus:outline-none"
      >
        {[50, 75, 100, 125, 150, 175, 200].map((v) => (
          <option key={v} value={v}>{v}%</option>
        ))}
      </select>

      <select
        value={fontFamily}
        onChange={(e) => onFontChange(e.target.value)}
        title="Font"
        className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-100 focus:outline-none min-w-[100px]"
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
    </div>
  );
}
