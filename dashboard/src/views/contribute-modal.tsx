import { useEffect, useRef } from "react";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  BugIcon,
  FilesIcon,
  GitPullRequestIcon,
  HeartIcon,
  ListChecksIcon,
  ScrollIcon,
  SealCheckIcon,
  ShareNetworkIcon,
  XIcon
} from "@phosphor-icons/react";
import { COMPANIES } from "../firewall/companies.generated";

const REPO = "https://github.com/keyvanarasteh/os-lab";
const blob = (p: string) => `${REPO}/blob/master/${p}`;

const STEPS = [
  ["Copy", "cp -r firewall-lab/templates/company firewall-lab/companies/<slug>"],
  ["Fill", "company.json + README.md. Every rule gets a reason."],
  ["Validate", "python3 firewall-lab/scripts/validate.py <slug>"],
  ["Open a PR", "CI revalidates and rebuilds the catalog."]
] as const;

const LINKS = [
  { icon: ScrollIcon, label: "CONTRIBUTING", note: "How we work, branch and commit", href: blob("CONTRIBUTING.md") },
  { icon: HeartIcon, label: "CONTRIBUTORS", note: "Everyone who added a company", href: blob("firewall-lab/CONTRIBUTORS.md") },
  { icon: ListChecksIcon, label: "Standards", note: "Rules of a good submission, checklist", href: blob("firewall-lab/README.md#the-rules-of-a-good-submission") },
  { icon: FilesIcon, label: "Schema", note: "Field-by-field company.json contract", href: blob("firewall-lab/schema/README.md") },
  { icon: BookOpenIcon, label: "Knowledge notes", note: "Segmentation, rule order, products, monitoring", href: `${REPO}/tree/master/firewall-lab/knowledge` },
  { icon: GitPullRequestIcon, label: "PR template", note: "What every pull request must answer", href: blob(".github/PULL_REQUEST_TEMPLATE.md") },
  { icon: BugIcon, label: "Issue templates", note: "Bug · docs · feature request", href: `${REPO}/issues/new/choose` },
  { icon: SealCheckIcon, label: "Code of conduct", note: "Be kind, be specific", href: blob("CODE_OF_CONDUCT.md") }
];

export function ContributeModal({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    box.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);

  const people = COMPANIES.filter((c) => c.author.github && c.author.name !== "Seed Example");

  return (
    <div className="cm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm" role="dialog" aria-modal="true" aria-labelledby="cm-title" ref={box} tabIndex={-1}>
        <button className="cm-x" type="button" onClick={onClose} aria-label="Close"><XIcon size={16} weight="bold" /></button>
        <header className="cm-head">
          <span className="cm-eyebrow">Contribute</span>
          <h2 id="cm-title">Add your company to the book.</h2>
          <p>Every design here arrived as a pull request. Yours can too.</p>
        </header>

        <ol className="cm-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} style={{ animationDelay: `${120 + i * 90}ms` }}>
              <span>{i + 1}</span>
              <div><strong>{t}</strong><code>{d}</code></div>
            </li>
          ))}
        </ol>

        <section>
          <h3 className="cm-h"><ShareNetworkIcon size={14} weight="bold" /> Contributors <b>{people.length}</b></h3>
          <ul className="cm-people">
            {people.map((c, i) => (
              <li key={c.slug} style={{ animationDelay: `${300 + i * 45}ms` }}>
                <a href={`https://github.com/${c.author.github}`} target="_blank" rel="noreferrer">
                  <img src={`https://github.com/${c.author.github}.png?size=64`} alt="" width="32" height="32" loading="lazy" />
                  <span><strong>@{c.author.github}</strong><small>{c.name}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="cm-h"><ListChecksIcon size={14} weight="bold" /> Guides, templates and standards</h3>
          <ul className="cm-links">
            {LINKS.map(({ icon: Icon, label, note, href }, i) => (
              <li key={label} style={{ animationDelay: `${400 + i * 40}ms` }}>
                <a href={href} target="_blank" rel="noreferrer">
                  <Icon size={18} weight="duotone" />
                  <span><strong>{label}</strong><small>{note}</small></span>
                  <ArrowUpRightIcon size={14} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
