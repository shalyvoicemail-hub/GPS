# Repository notes for Claude

## Accessibility — standing requirement

Every website or web UI built in this repository must follow WCAG 2.2 AA
practices by default, without being asked each time it comes up:

- Semantic HTML: correct heading order, landmark elements
  (`header`/`nav`/`main`/`footer`), real `<button>`/`<a>` for actions/links,
  real lists for lists — not `div`s styled to look like them.
- Every interactive element must be reachable and operable by keyboard alone
  (`Tab`, `Enter`/`Space`), with a visible focus state. Never remove
  `outline` without replacing it with an equally visible alternative.
- All meaningful images get real `alt` text; purely decorative images get
  `alt=""`.
- Every form input has an associated `<label>` (or `aria-label` when a
  visible label doesn't fit); validation/error messages are programmatically
  associated (`aria-describedby`) and announced (`aria-live` / `role="alert"`
  for async errors).
- Color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text and UI
  components/icons) in both light and dark themes.
- Never convey information (status, error, required field) by color alone —
  pair it with text, an icon, or a pattern.
- Respect `prefers-reduced-motion`; avoid motion-only feedback.
- Use ARIA only to fill a real gap semantic HTML can't cover — never
  override native semantics that already work.
- Pages with repeated navigation get a skip-to-content link.
- Layout holds up at 200% browser zoom and down to ~320px width without
  losing content or requiring horizontal scroll of the page body.

This is a strong default for code quality — not a substitute for an actual
legal compliance review. Real ADA / Section 508 / EN 301 549 / AODA
obligations depend on jurisdiction and what the site is for. Flag to the
user when a project's stakes (a government site, a commercial site with
real legal exposure) call for an actual accessibility audit with assistive
tech and, where relevant, legal sign-off — don't imply that following this
checklist alone constitutes legal clearance.

## Project overview

- `server/` — Signal Connect: a small app that links to Signal via
  `signal-cli-rest-api` (Express backend + browser UI).
- `apartments-site/` — RentFinder: an apartment listings site (Express +
  local JSON store + photo uploads), deployable to Fly.io via
  `.github/workflows/deploy-apartments-site.yml`.
