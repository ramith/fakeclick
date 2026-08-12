import test from "node:test";
import assert from "node:assert/strict";
import { createFakeChrome } from "./helpers/fake-chrome.mjs";

const SCRIPT_ID = "fakeclick-main";

// background.js registers its chrome.* listeners as a side effect of being
// imported. Each test needs a fresh module evaluation against its own fake
// chrome instance, so we cache-bust the specifier per import.
let importCounter = 0;
async function loadBackground(fakeChrome) {
  globalThis.chrome = fakeChrome.chrome;
  await import(`../src/background.js?t=${++importCounter}`);
}

test("clicking the toolbar icon on an http(s) tab adds the site and turns the icon on", async () => {
  const fake = createFakeChrome();
  await loadBackground(fake);

  const tab = { id: 1, url: "https://myflixerfree.to/watch/1" };
  await fake.clickAction(tab);

  assert.deepEqual(await fake.chrome.storage.sync.get("sites"), {
    sites: ["myflixerfree.to"],
  });
  assert.deepEqual(fake.state.calls.permissionsRequested, [
    ["*://myflixerfree.to/*", "*://*.myflixerfree.to/*"],
  ]);
  assert.equal(fake.getActionState(1).icon["16"], "icons/icon-on-16.png");
  assert.match(fake.getActionState(1).title, /ON for myflixerfree\.to/);
});

test("clicking again on the same site removes it and turns the icon off", async () => {
  const fake = createFakeChrome();
  await loadBackground(fake);
  const tab = { id: 1, url: "https://myflixerfree.to/" };

  await fake.clickAction(tab);
  await fake.clickAction(tab);

  assert.deepEqual(await fake.chrome.storage.sync.get("sites"), { sites: [] });
  assert.deepEqual(fake.state.calls.permissionsRemoved, [
    ["*://myflixerfree.to/*", "*://*.myflixerfree.to/*"],
  ]);
  assert.match(fake.getActionState(1).title, /off for myflixerfree\.to/);
});

test("clicking on a non-http(s) tab (e.g. chrome://) does nothing", async () => {
  const fake = createFakeChrome();
  await loadBackground(fake);
  const tab = { id: 2, url: "chrome://extensions" };

  await fake.clickAction(tab);

  assert.deepEqual(await fake.chrome.storage.sync.get("sites"), { sites: [] });
  assert.equal(fake.state.calls.permissionsRequested.length, 0);
});

test("declining the permission prompt does not add the site", async () => {
  const fake = createFakeChrome();
  fake.state.grantPermissionRequests = false;
  await loadBackground(fake);

  await fake.clickAction({ id: 1, url: "https://ads.example.com/" });

  assert.deepEqual(await fake.chrome.storage.sync.get("sites"), { sites: [] });
});

test("adding a site registers a MAIN-world, document_start content script for that domain", async () => {
  const fake = createFakeChrome();
  await loadBackground(fake);

  await fake.clickAction({ id: 1, url: "https://myflixerfree.to/" });

  const [script] = await fake.chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  assert.ok(script, "expected the fakeclick-main script to be registered");
  assert.deepEqual(script.matches, [
    "*://myflixerfree.to/*",
    "*://*.myflixerfree.to/*",
  ]);
  assert.equal(script.world, "MAIN");
  assert.equal(script.runAt, "document_start");
  assert.deepEqual(script.js, ["inject.js"]);
});

test("removing the last site unregisters the content script entirely", async () => {
  const fake = createFakeChrome();
  await loadBackground(fake);
  const tab = { id: 1, url: "https://myflixerfree.to/" };

  await fake.clickAction(tab); // add
  await fake.clickAction(tab); // remove

  const scripts = await fake.chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  assert.equal(scripts.length, 0);
});

test("on startup, existing tabs get their icon state refreshed to match saved sites", async () => {
  const fake = createFakeChrome({
    tabs: [{ id: 5, url: "https://myflixerfree.to/" }, { id: 6, url: "https://example.com/" }],
  });
  await loadBackground(fake);
  await fake.chrome.storage.sync.set({ sites: ["myflixerfree.to"] });

  await fake.fireStartup();

  assert.match(fake.getActionState(5).title, /ON for myflixerfree\.to/);
  assert.match(fake.getActionState(6).title, /off for example\.com/);
});
