# Popunder Defuser

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
npm run lint      # eslint over src/ and build.mjs
npm run package   # lint + minified build + zip -> web-ext-artifacts/
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

## CI

`.github/workflows/build.yml` lints and builds on every push/PR, and
uploads both the unpacked `dist/` and the packaged zip as workflow
artifacts. Pushing a tag like `v1.0.1` (matching the version in
`package.json`) also attaches the zip to a GitHub release.

## Files

- `manifest.json` — MV3 manifest source (paths are relative, so it
  works unchanged once copied into `dist/`).
- `src/background.js` — service worker; handles the toolbar click,
  keeps the per-tab icon in sync, and (un)registers the injected
  script as you add/remove sites via
  `chrome.scripting.registerContentScripts`.
- `src/inject.js` — the actual `window.open` override, runs in the
  page's own JS context.
- `icons/` — toolbar icon art (`icon-on-*.png` / `icon-off-*.png`) —
  a popup window shape with a red prohibition ring, greyed out when
  inactive. Source: `tools/make_icons.py` (Pillow).
- `build.mjs` — esbuild-based build script (bundle, copy static
  files, optionally zip).
- `dist/`, `web-ext-artifacts/` — build output, gitignored.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
