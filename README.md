# FakeClick

A tiny Chrome/Vivaldi (Manifest V3) extension that stops the "click close →
new tab/window opens" popunder pattern used by ad networks on sites like
myflixerfree.to.

## How it works

Ad scripts almost always trigger the new tab/window through
`window.open(...)`. This extension injects a script directly into the
page's own JavaScript context (a "MAIN world" content script, running at
`document_start` — before the page's own scripts run) that replaces
`window.open` with a version that:

1. Never actually opens anything.
2. Returns a fake `Window`-like object (`closed: false`, no-op methods,
   writable `.location`) instead of `null`.

Because the call appears to succeed, the ad script doesn't retry with a
different technique or throw — it just thinks it opened a tab. The event
that triggered it (the close-button click) still gets suppressed from the
site's perspective, and no new tab/window ever opens.

This is the same technique uBlock Origin ships as a built-in scriptlet
(`prevent-window-open`, aka `window.open-defuser`/`nowoif`) — this
extension applies it automatically to whichever sites you add, with no
manual filter-list syntax.

The override is scoped per-site: you explicitly grant it access to a
domain (by clicking the toolbar icon), and it registers dynamically
through `chrome.scripting.registerContentScripts`, so it doesn't need
blanket "read and change all data on all websites" permission up front.

## Toolbar icon

Click the icon to toggle the current tab's site on or off — no popup,
no menu. The icon itself shows the state per tab:

- **Indigo window with a red "no" ring** — active; `window.open` is
  being defused on this site.
- **Grey/desaturated** — inactive; the site behaves normally. Also
  shown (and the button disabled) on non-http(s) pages like
  `chrome://` tabs, where there's nothing to toggle.

Turning a site on triggers a one-time browser permission prompt for
that domain — accept it. Turning it off also releases that permission.

## Limitations (be aware)

- It only stops **new tab/window popunders**. A site that redirects the
  *current* tab on click (`location.href = ...`) isn't something an
  extension can selectively block in Manifest V3 — Chrome removed the
  blocking `webRequest` API that used to make that possible. Pair this
  with a network-level blocker like uBlock Origin for that case.
- It blocks *all* `window.open` calls on a site you've added, including
  legitimate ones (e.g. a real "open in new tab" button). For a
  video-streaming/ad site that's almost always what you want.

## Build

Source lives in `src/`; `manifest.json` and `icons/` are copied
as-is. `npm run build` bundles everything into `dist/`, which is the
folder you actually load into the browser.

```sh
npm install       # one-time
npm run build     # -> dist/ (unminified, for loading unpacked)
npm run watch     # rebuild src/ on every save
npm run lint      # eslint over src/, test/, and build.mjs
npm test          # unit tests (node's built-in test runner)
npm run test:e2e  # playwright e2e tests, real Chromium (needs `playwright install chromium` once)
npm run package   # lint + test + minified build + zip -> web-ext-artifacts/
npm run icons     # regenerate icons/ via tools/make_icons.py (needs Pillow)
npm run clean     # remove dist/ and web-ext-artifacts/
```

## Install (unpacked)

1. `npm install && npm run build`.
2. Open `chrome://extensions` (or `vivaldi://extensions`).
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `dist/` folder (not the repo
   root — that's source, not a loadable extension).
5. You may want to pin the extension (puzzle-piece icon → pin) so it's
   always visible in the toolbar.
6. Visit the annoying site and click the toolbar icon. Accept the
   one-time permission prompt for that domain.
7. Reload the tab. Ad popunders should now silently no-op. Click the
   icon again any time to turn it back off for that site.

After editing `src/`, either re-run `npm run build` or use
`npm run watch` and just reload the extension in `chrome://extensions`.

## Tests

`test/` covers the two things that actually matter for correctness:

- **`test/inject.test.js`** — the `window.open` defusing logic itself:
  the native `open` is never called, the calling script sees a
  truthy/`closed: false` result, writes to the fake window's
  `.location` never touch the real page, and re-installing is a no-op.
- **`test/background.test.js`** — the toggle flow, against an in-memory
  fake of the `chrome.*` APIs (`test/helpers/fake-chrome.mjs`):
  clicking the icon requests/releases the per-site permission,
  adds/removes the domain from storage, registers/unregisters the
  `document_start` MAIN-world content script with the right `matches`,
  and updates the per-tab icon/title — including a declined-permission
  case and non-http(s) tabs like `chrome://`.
- **`test/lib.test.js`** — the small pure helpers (`hostnameOf`,
  `toMatchPatterns`) that both of the above build on.

`src/background.js` and `src/inject.js` export their core logic
(`installFakeOpen`, plus the helpers in `src/lib.js`) specifically so
these can run under plain Node — no browser needed. Run with `npm test`.

### End-to-end (Playwright)

The unit tests above mock `chrome.*` entirely, so they can't confirm
the extension actually injects into a real page at the right time.
`test/e2e/popunder.spec.js` does that for real, in an actual Chromium
with the built `dist/` loaded as an unpacked extension:

- **Site enabled** — toggles the fixture server's origin on (the same
  `chrome.storage.sync` write the toolbar click makes), waits for the
  real `chrome.scripting.registerContentScripts()` call to land, then
  clicks a real button that calls `window.open()` and asserts **no new
  browser tab actually appears** (`context.pages().length` unchanged).
- **Site not enabled (control)** — same click, but proves a real,
  un-defused `window.open()` *would* have opened a tab here, so the
  first result is actually the extension's doing and not some quirk
  of the test harness.

Chrome's own `chrome.permissions.request` needs a trusted user gesture
on the extension's own UI, which Playwright can't fire at a native
toolbar button — so `test/e2e/global-setup.mjs` builds a test-only
copy of `dist/` with the fixture server's origin pre-granted via a
required `host_permissions` entry (the shipped manifest, which only
ever asks via the optional-permission + click flow, is untouched).

Run with `npx playwright install chromium` once, then `npm run test:e2e`.

## CI

`.github/workflows/build.yml` lints, runs both test suites, and
builds on every push/PR, and uploads both the unpacked `dist/` and
the packaged zip as workflow artifacts. Pushing a tag like `v1.0.1`
(matching the version in `package.json`) also attaches the zip to a
GitHub release.

## Files

- `manifest.json` — MV3 manifest source (paths are relative, so it
  works unchanged once copied into `dist/`).
- `src/background.js` — service worker; handles the toolbar click,
  keeps the per-tab icon in sync, and (un)registers the injected
  script as you add/remove sites via
  `chrome.scripting.registerContentScripts`.
- `src/inject.js` — the actual `window.open` override, runs in the
  page's own JS context.
- `src/lib.js` — small pure helpers shared by `background.js`.
- `icons/` — toolbar icon art (`icon-on-*.png` / `icon-off-*.png`) —
  a popup window shape with a red prohibition ring, greyed out when
  inactive. Source: `tools/make_icons.py` (Pillow).
- `build.mjs` — esbuild-based build script (bundle, copy static
  files, optionally zip).
- `test/*.test.js`, `test/helpers/` — unit tests (`node --test`).
- `test/e2e/`, `playwright.config.js` — Playwright end-to-end tests.
- `dist/`, `web-ext-artifacts/`, `.e2e-extension/` — build/test
  output, gitignored.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
