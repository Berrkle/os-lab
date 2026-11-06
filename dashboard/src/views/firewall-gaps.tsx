import { useEffect, useState } from "react";
import { ChatsCircleIcon, ChalkboardTeacherIcon, WrenchIcon } from "@phosphor-icons/react";
import { GapModal } from "./gap-modal";
import { auditCompany, type Finding } from "../firewall/audit";
import type { Company } from "../firewall/types";
import type { FirewallLocale } from "../firewall/locale";

const SEV = ["", "low", "minor", "medium", "high", "critical"];
const R = 52;
const C = 2 * Math.PI * R;

function Ring({ score, locale }: { score: number; locale: FirewallLocale }) {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    setOn(true);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setN(Math.round(score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const tone = score >= 70 ? "ok" : score >= 45 ? "mid" : "bad";
  return (
    <div className="fwg-ring" data-tone={tone} role="img" aria-label={locale === "tr" ? `Sağlık puanı 100 üzerinden ${score}` : `Health score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" width="132" height="132">
        <circle cx="60" cy="60" r={R} className="fwg-ring-track" />
        <circle cx="60" cy="60" r={R} className="fwg-ring-bar" strokeDasharray={C} strokeDashoffset={on ? C * (1 - score / 100) : C} transform="rotate(-90 60 60)" />
      </svg>
      <strong>{n}</strong>
      <span>{locale === "tr" ? "sağlık" : "health"}</span>
    </div>
  );
}

function Card({ f, i, hot, setHot, onImpact, locale }: { f: Finding; i: number; hot: boolean; setHot: (v: number | null) => void; onImpact: () => void; locale: FirewallLocale }) {
  const [open, setOpen] = useState(false);
  const tr = locale === "tr";
  const Icon = f.source === "asked" ? ChatsCircleIcon : ChalkboardTeacherIcon;
  return (
    <article
      className="fwg-card"
      data-sev={f.severity}
      data-hot={hot}
      style={{ animationDelay: `${i * 70}ms` }}
      onMouseEnter={() => setHot(i)}
      onMouseLeave={() => setHot(null)}
    >
      <div className="fwg-card-top">
        <span className="fwg-rank">{String(i + 1).padStart(2, "0")}</span>
        <span className="fwg-cat">{f.category}</span>
        <span className="fwg-sev" aria-label={tr ? `Önem derecesi ${f.severity}/5` : `Severity ${SEV[f.severity]}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} data-on={n <= f.severity} style={{ transitionDelay: `${i * 70 + n * 60}ms` }} />
          ))}
        </span>
      </div>
      <h3>{f.title}</h3>
      <p className="fwg-evidence">{f.evidence}</p>
      {f.instances && f.instances.length > 0 && (
        <ul className="fwg-inst">
          {f.instances.slice(0, 3).map((t, n) => <li key={n}>{t}</li>)}
          {f.instances.length > 3 && !open && <li className="fwg-more-n">+{f.instances.length - 3} {tr ? "diğer" : "more"}</li>}
        </ul>
      )}
      <div className="fwg-src"><Icon size={13} weight="duotone" /> {f.source === "asked" ? (tr ? "Grupta soruldu" : "Asked in the group") : (tr ? "Derste anlatıldı" : "Taught in class")} · {f.ref}</div>
      <button type="button" className="fwg-impact" onClick={onImpact}>{tr ? "Etkisini gör" : "Why it hurts"} →</button>
      <button type="button" className="fwg-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? (tr ? "Ayrıntıları gizle" : "Hide details") : f.instances && f.instances.length > 3 ? (tr ? `Tüm ${f.instances.length} örnek · çözüm` : `All ${f.instances.length} · how to fix`) : (tr ? "Nasıl düzeltilir?" : "How to fix")}
      </button>
      <div className="fwg-fold" data-open={open}>
        <div>
          {f.instances && f.instances.length > 3 && (
            <ul className="fwg-inst fwg-inst-all">{f.instances.slice(3).map((t, n) => <li key={n}>{t}</li>)}</ul>
          )}
          <p className="fwg-why">{f.why}</p>
          <p className="fwg-fix"><WrenchIcon size={13} weight="bold" /> {f.fix}</p>
        </div>
      </div>
    </article>
  );
}

export function GapsTab({ company, locale = "en" }: { company: Company; locale?: FirewallLocale }) {
  const tr = locale === "tr";
  const audit = auditCompany(company);
  const [hot, setHot] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const [modal, setModal] = useState<Finding | null>(() => {
    const m = typeof location !== "undefined" ? /^#gap-(\w+)$/.exec(location.hash) : null;
    return m ? audit.findings.find((f) => f.id === m[1]) ?? null : null;
  });
  const shown = all ? audit.findings : audit.findings.slice(0, 10);
  const asked = audit.findings.filter((f) => f.source === "asked").length;
  return (
    <section className="fwg" aria-label={tr ? "Eksikler ve açıklar" : "Gaps and missing pieces"}>
      <div className="fwg-head">
        <Ring score={audit.score} locale={locale} />
        <div>
          <span className="fw-eyebrow">02 / {tr ? "Açık denetimi" : "Gap audit"}</span>
          <h2>{audit.total === 0 ? (tr ? "Eksik bulunmadı" : "Nothing missing") : (tr ? `${audit.total} açıkta ${audit.issues} sorun` : `${audit.issues} issues across ${audit.total} gaps`)}</h2>
          <p>
            {tr ? `BGT207 grubunda sorulanlar ve ders kayıtlarında anlatılanlar doğrultusunda ${audit.checks} kontrol yapıldı. Etkilenen tüm şubeler, güvenlik duvarları ve kurallar önem sırasına göre listelenir.` : `Checked against what was asked in the BGT207 group and taught in the recordings: ${audit.checks} checks run. Every affected branch, firewall and rule is listed, worst first.`}
          </p>
          <div className="fwg-legend">
            <span><ChatsCircleIcon size={13} weight="duotone" /> {asked} {tr ? "ödevden" : "from the brief"}</span>
            <span><ChalkboardTeacherIcon size={13} weight="duotone" /> {audit.total - asked} {tr ? "derslerden" : "from lectures"}</span>
          </div>
        </div>
      </div>

      {shown.length > 0 && (
        <div className="fwg-matrix" style={{ ["--n" as string]: audit.findings.length }} role="table" aria-label={tr ? "Her açığın etkilediği şubeler" : "Which branch each gap touches"}>
          <div className="fwg-mrow fwg-mhead" role="row">
            <span />
            {shown.map((_, i) => <span key={i} data-hot={hot === i}>{i + 1}</span>)}
          </div>
          {company.branches.map((b, r) => (
            <div className="fwg-mrow" role="row" key={b.id}>
              <span className="fwg-mname" title={b.name}>{b.name}</span>
              {shown.map((f, i) => {
                const hit = f.branches.length === 0 || f.branches.includes(b.id);
                return (
                  <span
                    key={f.id}
                    className="fwg-cell"
                    data-hit={hit}
                    data-wide={f.branches.length === 0}
                    data-sev={f.severity}
                    data-hot={hot === i}
                    style={{ animationDelay: `${(r * 10 + i) * 28}ms` }}
                    title={hit ? `${f.title}${f.branches.length === 0 ? (tr ? " (şirket genelinde)" : " (company-wide)") : ""}` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="fwg-grid">
        {shown.map((f, i) => <Card key={f.id} f={f} i={i} hot={hot === i} setHot={setHot} onImpact={() => setModal(f)} locale={locale} />)}
      </div>
      {audit.findings.length > 10 && (
        <button type="button" className="fwg-all" onClick={() => setAll((v) => !v)}>
          {all ? (tr ? "İlk 10'u göster" : "Show the top 10") : (tr ? `${audit.total} açığın tümünü göster` : `Show all ${audit.total} gaps`)}
        </button>
      )}
      {modal ? <GapModal f={modal} onClose={() => setModal(null)} locale={locale} /> : null}
    </section>
  );
}
