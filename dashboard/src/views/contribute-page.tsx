/** /contribute/ — CONTRIBUTING.md, rendered at build time so the repo and the dashboard show the same steps. */
import { GitPullRequestIcon } from "@phosphor-icons/react";
import { AppShell } from "../shell/app-shell";
import { TopBar } from "../shell/top-bar";
import { REPO_BLOB } from "../lib/legal";

export default function ContributePage({ html }: { html: string }) {
  return (
    <AppShell activeId="contribute">
      <div className="iux min-h-screen">
        <TopBar title="Contribute" icon={<GitPullRequestIcon size={20} weight="duotone" />} />
        <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
          {/* Our own Markdown (CONTRIBUTING.md), compiled at build time */}
          <article className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />
          <p className="border-t border-(--iux-border) pt-4 text-xs text-(--iux-muted-foreground)">
            Source:{" "}
            <a className="underline" href={`${REPO_BLOB}/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
              CONTRIBUTING.md
            </a>
          </p>
        </main>
      </div>
    </AppShell>
  );
}
