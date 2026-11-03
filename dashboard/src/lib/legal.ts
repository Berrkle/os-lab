/** The legal documents, rendered from docs/legal/*.md (the single source for the repo and the dashboard). */
export const REPO_BLOB = "https://github.com/keyvanarasteh/os-lab/blob/master";

export const LEGAL_DOCS = [
  { slug: "terms", file: "TERMS.md", title: "Terms of Use", description: "Licence, authorized use, OS licences, data you process, no warranty" },
  { slug: "acceptable-use", file: "ACCEPTABLE_USE.md", title: "Acceptable Use", description: "Supported and unsupported use, responsible disclosure" },
  { slug: "privacy", file: "PRIVACY.md", title: "Privacy Notice", description: "What stays on your machine, browser storage, network connections" },
  { slug: "third-party", file: "THIRD_PARTY_NOTICES.md", title: "Third-Party Notices", description: "Licences of images, tools and bundled components" }
] as const;

export type LegalSlug = (typeof LEGAL_DOCS)[number]["slug"];

/** Point the Markdown's repo-relative links at dashboard routes or GitHub. */
export function rewriteLinks(html: string): string {
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    const doc = LEGAL_DOCS.find((d) => href === d.file || href.startsWith(`${d.file}#`));
    if (doc) return `href="/legal/${doc.slug}/${href.slice(doc.file.length)}"`;
    if (href.startsWith("../../")) return `href="${REPO_BLOB}/${href.slice(6)}" target="_blank" rel="noreferrer"`;
    if (/^https?:/.test(href)) return `href="${href}" target="_blank" rel="noreferrer"`;
    return whole;
  });
}
