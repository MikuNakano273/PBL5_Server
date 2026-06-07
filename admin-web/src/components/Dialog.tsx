import { useEffect, type ReactNode } from "react";

export default function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);
  return <div className="dialog-backdrop" onMouseDown={close}><section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><h2>{title}</h2>{children}</section></div>;
}
