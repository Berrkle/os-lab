# Dashboard translation review

The dashboard and desktop launcher support English (default), Turkish, German,
French, Spanish, Italian, Persian, and Arabic. UI dictionaries in
`src/i18n/generated/` contain machine translated English copy. They make the
whole dashboard usable in each language, but are **draft translations** until a
native speaker checks the wording and technical vocabulary.

## Review queue

- [ ] Review each generated dictionary (`tr`, `de`, `fr`, `es`, `it`, `fa`, `ar`)
  with native speakers, especially security terms, product names, units,
  command examples, and accessibility labels. Keep file paths, commands,
  product names, and placeholders exact.
- [ ] Translate the Markdown articles in `docs/legal/`, `docs/CONTENT.md`, and `CONTRIBUTING.md`
  with legal and maintainer review. They are currently marked as English in
  localized pages; surrounding navigation and controls are translated.
- [ ] Review authored company descriptions and project catalog content.
  Some source records mix English and Turkish, and exact-string UI translation
  only covers English phrases currently in the dictionaries.
- [ ] Localize variable text produced by console/backend responses and desktop
  native errors. Keep diagnostic commands and raw logs intact.
- [ ] Review Persian and Arabic layout, punctuation, number formatting, and
  mixed left-to-right technical text with native speakers.
- [ ] Add a translation workflow for new dashboard strings so additions do not
  silently fall back to English.

The Firewall Lab has its own detailed [translation checklist](../firewall-lab/TRANSLATION_TODO.md).
