import { hostnameOf, toMatchPatterns } from "./lib.js";

const SCRIPT_ID = "fakeclick-main";

const ICONS = {
  on: {
    16: "icons/icon-on-16.png",
    32: "icons/icon-on-32.png",
    48: "icons/icon-on-48.png",
    128: "icons/icon-on-128.png",
  },
  off: {
    16: "icons/icon-off-16.png",
    32: "icons/icon-off-32.png",
    48: "icons/icon-off-48.png",
    128: "icons/icon-off-128.png",
  },
};

async function getSites() {
  const { sites = [] } = await chrome.storage.sync.get("sites");
  return sites;
}

async function setSites(sites) {
  await chrome.storage.sync.set({ sites });
}

// --- keep the injected content script's site list in sync with storage ---

async function syncRegistration() {
  const sites = await getSites();
  const existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [SCRIPT_ID],
  });

  if (sites.length === 0) {
    if (existing.length) {
      await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }
    return;
  }

  const script = {
    id: SCRIPT_ID,
    js: ["inject.js"],
    matches: sites.flatMap(toMatchPatterns),
    runAt: "document_start",
    world: "MAIN",
    allFrames: true,
  };

  if (existing.length) {
    await chrome.scripting.updateContentScripts([script]);
  } else {
    await chrome.scripting.registerContentScripts([script]);
  }
}

// --- toolbar icon reflects whether the active tab's site is blocked ---

async function refreshActionForTab(tabId, url) {
  const domain = hostnameOf(url);
  if (!domain) {
    await chrome.action.disable(tabId);
    await chrome.action.setIcon({ tabId, path: ICONS.off });
    return;
  }
  await chrome.action.enable(tabId);
  const sites = await getSites();
  const active = sites.includes(domain);
  await chrome.action.setIcon({ tabId, path: active ? ICONS.on : ICONS.off });
  await chrome.action.setTitle({
    tabId,
    title: active
      ? `FakeClick — ON for ${domain} (click to turn off)`
      : `FakeClick — off for ${domain} (click to turn on)`,
  });
}

async function refreshAllTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => refreshActionForTab(tab.id, tab.url)));
}

// --- click the toolbar icon to toggle the current site ---

chrome.action.onClicked.addListener(async (tab) => {
  const domain = hostnameOf(tab.url);
  if (!domain) return;

  const sites = await getSites();
  const idx = sites.indexOf(domain);

  if (idx === -1) {
    const granted = await chrome.permissions.request({
      origins: toMatchPatterns(domain),
    });
    if (!granted) return;
    sites.push(domain);
  } else {
    sites.splice(idx, 1);
    await chrome.permissions.remove({ origins: toMatchPatterns(domain) });
  }

  await setSites(sites);
  await refreshActionForTab(tab.id, tab.url);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId).then((tab) => refreshActionForTab(tabId, tab.url));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    refreshActionForTab(tabId, tab.url);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await syncRegistration();
  await refreshAllTabs();
});
chrome.runtime.onStartup.addListener(async () => {
  await syncRegistration();
  await refreshAllTabs();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.sites) return;
  syncRegistration();
  refreshAllTabs();
});
