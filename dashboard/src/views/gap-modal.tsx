import "../styles/firewall-contribute.css";
import { useEffect, useRef } from "react";
import { WrenchIcon, XIcon } from "@phosphor-icons/react";
import type { Finding } from "../firewall/audit";
import { IMPACT } from "../firewall/impact";
import type { FirewallLocale } from "../firewall/locale";

const METERS = [["Hackable", "hack"], ["Weak", "weak"], ["Expensive", "cost"]] as const;

export function GapModal({ f, onClose, locale = "en" }: { f: Finding; onClose: () => void; locale?: FirewallLocale }) {
  const tr = locale === "tr";
  const box = useRef<HTMLDivElement>(null);
  const im = IMPACT[f.id];
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    box.current?.focus();
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div className="cm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm gm" role="dialog" aria-modal="true" aria-labelledby="gm-title" ref={box} tabIndex={-1} data-sev={f.severity}>
        <button className="cm-x" type="button" onClick={onClose} aria-label={tr ? "Kapat" : "Close"}><XIcon size={16} weight="bold" /></button>
        <span className="cm-eyebrow">{f.category} · {tr ? "önem" : "severity"} {f.severity}/5</span>
        <h2 id="gm-title" className="gm-title">{f.title}</h2>

        {im ? (
          <>
            <div className="gm-flow" style={{ ["--n" as string]: im.path.length }} aria-label={`${tr ? "Yol" : "Path"}: ${im.path.join(tr ? " → " : " to ")}`}>
              {im.path.map((n, i) => (
                <div key={i} className="gm-node" data-state={i < im.gap ? "ok" : i === im.gap ? "gap" : "hit"} style={{ animationDelay: `${i * 0.35}s` }}>
                  <i />
                  <span>{n}</span>
                </div>
              ))}
              <b className="gm-dot" aria-hidden="true" />
            </div>
            <p className="gm-scn">{im.scenario}</p>
            <div className="gm-meters">
              {METERS.map(([label, k], r) => (
                <div key={k} className="gm-meter">
                  <span>{tr ? { Hackable: "Saldırıya açık", Weak: "Zayıf", Expensive: "Maliyetli" }[label] : label}</span>
                  <div>{[1, 2, 3, 4, 5].map((n) => <i key={n} data-on={n <= im[k]} style={{ animationDelay: `${0.5 + r * 0.15 + n * 0.06}s` }} />)}</div>
                </div>
              ))}
            </div>
            <p className="gm-price">{im.price}</p>
          </>
        ) : (
          <p className="gm-scn">{f.why}</p>
        )}

        <p className="gm-fix"><WrenchIcon size={14} weight="bold" /> {f.fix}</p>
      </div>
    </div>
  );
}
