# Repository Guidelines

ASCII Retouch is a small, static single-page app that fixes slightly misaligned text diagrams. The UI is vanilla HTML/CSS/JS and the core alignment logic lives in plain JavaScript with Bun tests.

## Project Structure & Module Organization

- `index.html`: landing page and layout for the retouch UI.
- `style.css`: visual system, layout, and motion styling.
- `app.js`: browser wiring (input, output, copy, status).
- `retouch.js`: core alignment algorithm (box detection, clustering, shifts).
- `tests/retouch.test.js`: Bun tests for core behavior.
- `package.json`: scripts for local testing and serving.

## Build, Test, and Development Commands

- `bun test`: run the core logic test suite.
- `bunx serve .`: serve the static app locally for manual checks.

No build step is required; Cloudflare Pages can deploy the repo as-is.

## Coding Style & Naming Conventions

- JavaScript only (ES modules). Keep files ASCII unless diagram characters are necessary in tests.
- Indentation: 2 spaces. Use `const`/`let`, semicolons, and small pure helpers.
- Naming: `camelCase` for functions/variables, `kebab-case` for future folders.
- Avoid frameworks; keep DOM access in `app.js` and logic in `retouch.js`.

## Testing Guidelines

- Framework: Bun test runner.
- Test files live in `tests/` and use `*.test.js` naming.
- Cover alignment rules (widest box anchor, multi-column clustering, connector shifts, idempotence).
- Add tests for new edge cases before changing the algorithm.

## Commit & Pull Request Guidelines

- No established history; use short, imperative commits (e.g., "Align connector columns").
- Keep PRs focused, describe behavior changes, and include screenshots for UI updates.
- Note any diagram edge cases added or changed in tests.

## Deployment Notes

- Target host: Cloudflare Pages.
- Output is static; deploy the repo root with no build command.
- Verify clipboard permissions in the browser after deployment.
