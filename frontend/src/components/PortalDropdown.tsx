import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PortalDropdown({
  anchorRef,
  options,
  value,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement>;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return createPortal(
    <div
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="rounded-xl bg-zinc-900 border border-white/10 shadow-xl overflow-y-auto max-h-56"
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(opt); onClose(); }}
          className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/8
            ${value === opt ? "bg-[rgb(var(--brand))]/15 text-[rgb(var(--brand))]" : "text-white/80"}`}
        >
          {opt}
        </button>
      ))}
    </div>,
    document.body
  );
}

export function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null!);

  return (
    <div>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-left flex items-center justify-between transition text-sm
          ${open ? "border-[rgb(var(--brand))]/60 ring-2 ring-[rgb(var(--brand))]/30" : "border-white/10 hover:border-white/20"}`}
      >
        <span className="text-white">{value}</span>
        <span className="text-white/40 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <PortalDropdown
          anchorRef={anchorRef}
          options={options}
          value={value}
          onSelect={(v) => { onChange(v); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}