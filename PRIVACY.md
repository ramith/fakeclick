# Privacy Policy — FakeClick

**Last updated: 2026-08-13**

FakeClick does not collect, transmit, sell, or share any user data,
browsing history, or personal information — to the developer, or to
any third party.

## What the extension stores

The only data FakeClick keeps is the list of domains you've explicitly
enabled it for (via `chrome.storage.sync`). That list:

- Is created only when you click the toolbar icon and grant the
  resulting browser permission prompt for that domain.
- Never leaves your browser except through Chrome's own account sync
  (the same built-in mechanism Chrome uses to sync your bookmarks or
  settings across your own signed-in devices) — FakeClick has no
  server of its own and never sends this data anywhere.
- Can be removed at any time by clicking the toolbar icon again on
  that site, or by removing the extension.

## What the extension does on enabled sites

On a site you've enabled, FakeClick runs a small script that replaces
`window.open` so that popunder ads believe they succeeded without a
new tab or window actually opening. This script:

- Does not read, modify, or transmit the page's content, form data,
  cookies, or any other page data.
- Does not make network requests of its own.
- Does not run any remotely-fetched or dynamically-generated code —
  the full source is in this repository and is exactly what ships in
  the Chrome Web Store listing.

## Permissions

- **`scripting`** — used to install the `window.open` override on
  sites you enable.
- **`storage`** — used only to remember which domains you've enabled.
- **`tabs`** — used only to read a tab's URL (to know which domain to
  toggle) and to update the toolbar icon/title per tab. Page content
  is never read.
- **Host permission for a specific site** — requested only when you
  click the toolbar icon on that site, via a standard Chrome
  permission prompt. FakeClick never holds broad "read and change all
  your data on all websites" access; each site is opt-in.

## Contact

Questions or concerns: open an issue at
<https://github.com/ramith/fakeclick/issues>.
