# Chrome Web Store listing — copy/paste reference

Everything below is text you can paste directly into the CWS Developer
Dashboard (<https://chrome.google.com/webstore/devconsole>). The parts
that need your Google account (signup, the one-time $5 registration
fee, final submission) aren't something I can do for you — this file
gets you to the point where submitting is just pasting and clicking.

## Store listing tab

**Extension name:** `FakeClick`

**Summary** (132 char max — this is `manifest.json`'s `description`,
114 chars, already in sync):

> Stops ad popunders on sites you choose: window.open() appears to succeed, but no new tab or window actually opens.

**Description** (long form):

> FakeClick stops the "click close on an ad → a new tab or window pops open anyway" pattern used by ad networks on video-streaming and similar sites.
>
> Most of those popunders work by calling `window.open()` from JavaScript. FakeClick replaces that function — only on sites you explicitly enable — with a version that reports success back to the page (so the ad script doesn't retry with some other trick) while never actually opening anything.
>
> **How to use it**
> 1. Visit the site that's bothering you.
> 2. Click the FakeClick toolbar icon and accept the one-time permission prompt for that site.
> 3. Reload the tab. Click the icon again anytime to turn it back off for that site.
>
> **Scoped by design**
> FakeClick has no access to any site until you click the icon on it. There's no "read and change all your data on all websites" blanket permission — each site is opt-in, one click at a time, and you can revoke any of them the same way.
>
> **What it doesn't do**
> FakeClick only stops the new-tab/new-window popunder pattern. It can't selectively block a site that redirects your *current* tab on click (Chrome removed the browser API that made that possible in Manifest V3) — pair FakeClick with a general ad blocker for that case.
>
> **Privacy**
> No data collection, no analytics, no remote code, no account. Full source: https://github.com/ramith/fakeclick

**Category:** Tools (or whichever closest option the current dashboard
dropdown offers — categories have shifted over CWS redesigns, so pick
whatever's closest to "browser tool / utility").

**Language:** English

## Graphic assets

- **Icon (128×128):** `icons/icon-on-128.png` — already meets the
  128×128 PNG requirement.
- **Screenshot / promo (1280×800):** `store/promo-1280x800.png`.
  This is an explanatory graphic, not a literal screen capture —
  FakeClick has no popup/options UI to screenshot (by design, it's a
  single toolbar toggle), so there's nothing else honest to show.
  Consider adding one *real* screenshot of your own too: the
  `chrome://extensions` page with FakeClick listed, or the toolbar
  with the icon visible, on/off. I can't produce that one myself —
  it needs an actual visible browser window on your machine.
- **Small promo tile (440×280, optional):** `store/small-tile-440x280.png`.
- **Marquee (1400×560):** not created — only needed if you want to
  apply for featured placement; skip unless the dashboard requires it.

Regenerate either graphic anytime with `npm run icons:promo` (see
`tools/make_promo.py`) after changing colors/copy.

## Privacy practices tab

**Single purpose:** FakeClick replaces `window.open()` on sites the
user explicitly enables, so ad popunder scripts believe they
succeeded without any new tab or window actually opening.

**Permission justifications** (paste per-field in the dashboard):

- **`scripting`** — Required to install the `window.open` override on
  sites the user has enabled, via `chrome.scripting.registerContentScripts`.
- **`storage`** — Required to remember which domains the user has
  enabled, via `chrome.storage.sync`. No other data is stored.
- **`tabs`** — Required to read the active tab's URL (to know which
  domain the toolbar click applies to) and to set the per-tab
  toolbar icon/title. Page content is never read.
- **Host permission (requested per-site at click time)** — Required
  so the content script can run on that specific site. Never
  requested in bulk; each grant follows an explicit user click and
  browser permission prompt, and can be revoked the same way.

**Are you using remote code?** No — all code ships in the package;
nothing is fetched or eval'd at runtime.

**Data usage disclosures:** FakeClick does not collect any of the
categories Chrome asks about (personally identifiable info, health
info, financial info, authentication info, personal communications,
location, web history, user activity, or website content). The tab
URL read via the `tabs` permission is used transiently, in-memory,
only to decide which domain a click applies to and which icon to
show — it is never stored beyond the domain name itself (which the
user chose to enable) and never transmitted anywhere.

**Privacy policy URL:**
`https://github.com/ramith/fakeclick/blob/main/PRIVACY.md`

## Distribution tab

- **Visibility:** Public
- **Pricing:** Free
- **Regions:** All regions (no reason to restrict)

## Package to upload

Build and zip first:

```sh
npm run package
```

Upload `web-ext-artifacts/fakeclick-<version>.zip` — check the
version in `package.json` matches what you intend to publish (bump it
first with a new patch/minor release if needed, same as the existing
`v*.*.*` tag → GitHub Release flow).

## After submitting

- First review is typically the slowest (hours to a few days); it can
  take longer given the per-site host-permission model — reviewers
  sometimes ask for clarification on optional permissions even though
  this is the *more* privacy-respecting pattern, not less.
- Once approved, future updates (re-upload a new zip with a bumped
  `version`) usually review faster.
- If Google requests changes, the most common ask for extensions like
  this is tightening the permission-justification wording above —
  reuse this file as your starting point for any response.
