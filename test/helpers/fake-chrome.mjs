// A minimal in-memory stand-in for the chrome.* extension APIs that
// src/background.js touches, just enough to drive its logic under
// plain Node and assert on the outcome.

export function createFakeChrome({ tabs = [] } = {}) {
  const state = {
    storage: { sites: [] },
    registeredScripts: new Map(),
    tabs: new Map(tabs.map((t) => [t.id, t])),
    actionState: new Map(), // tabId -> { enabled, icon, title }
    permissionsGranted: new Set(),
    grantPermissionRequests: true,
    calls: {
      permissionsRequested: [],
      permissionsRemoved: [],
    },
  };

  const listeners = {
    storageChanged: [],
    tabsActivated: [],
    tabsUpdated: [],
    runtimeInstalled: [],
    runtimeStartup: [],
    actionClicked: [],
  };

  const chrome = {
    storage: {
      sync: {
        async get(key) {
          if (key === "sites") return { sites: state.storage.sites.slice() };
          return {};
        },
        async set(obj) {
          const oldValue = state.storage.sites.slice();
          state.storage.sites = obj.sites.slice();
          const changes = { sites: { oldValue, newValue: state.storage.sites.slice() } };
          for (const fn of listeners.storageChanged) fn(changes, "sync");
        },
      },
      onChanged: {
        addListener: (fn) => listeners.storageChanged.push(fn),
      },
    },

    scripting: {
      async getRegisteredContentScripts({ ids }) {
        return ids
          .filter((id) => state.registeredScripts.has(id))
          .map((id) => state.registeredScripts.get(id));
      },
      async registerContentScripts(scripts) {
        for (const s of scripts) state.registeredScripts.set(s.id, s);
      },
      async updateContentScripts(scripts) {
        for (const s of scripts) state.registeredScripts.set(s.id, s);
      },
      async unregisterContentScripts({ ids }) {
        for (const id of ids) state.registeredScripts.delete(id);
      },
    },

    action: {
      async enable(tabId) {
        setActionState(tabId, { enabled: true });
      },
      async disable(tabId) {
        setActionState(tabId, { enabled: false });
      },
      async setIcon({ tabId, path }) {
        setActionState(tabId, { icon: path });
      },
      async setTitle({ tabId, title }) {
        setActionState(tabId, { title });
      },
    },

    tabs: {
      async query() {
        return Array.from(state.tabs.values());
      },
      async get(tabId) {
        return state.tabs.get(tabId);
      },
      onActivated: { addListener: (fn) => listeners.tabsActivated.push(fn) },
      onUpdated: { addListener: (fn) => listeners.tabsUpdated.push(fn) },
    },

    permissions: {
      async request({ origins }) {
        state.calls.permissionsRequested.push(origins);
        if (!state.grantPermissionRequests) return false;
        for (const o of origins) state.permissionsGranted.add(o);
        return true;
      },
      async remove({ origins }) {
        state.calls.permissionsRemoved.push(origins);
        for (const o of origins) state.permissionsGranted.delete(o);
        return true;
      },
    },

    runtime: {
      onInstalled: { addListener: (fn) => listeners.runtimeInstalled.push(fn) },
      onStartup: { addListener: (fn) => listeners.runtimeStartup.push(fn) },
    },
  };

  // chrome.action.onClicked is set up after `chrome.action` exists above.
  chrome.action.onClicked = {
    addListener: (fn) => listeners.actionClicked.push(fn),
  };

  function setActionState(tabId, patch) {
    const prev = state.actionState.get(tabId) || {};
    state.actionState.set(tabId, { ...prev, ...patch });
  }

  return {
    chrome,
    state,
    // --- test-facing helpers to fire events background.js listens for ---
    async clickAction(tab) {
      state.tabs.set(tab.id, tab);
      for (const fn of listeners.actionClicked) await fn(tab);
    },
    async activateTab(tabId) {
      for (const fn of listeners.tabsActivated) await fn({ tabId });
    },
    async updateTab(tabId, changeInfo, tab) {
      state.tabs.set(tabId, tab);
      for (const fn of listeners.tabsUpdated) await fn(tabId, changeInfo, tab);
    },
    async fireInstalled() {
      for (const fn of listeners.runtimeInstalled) await fn();
    },
    async fireStartup() {
      for (const fn of listeners.runtimeStartup) await fn();
    },
    getActionState(tabId) {
      return state.actionState.get(tabId);
    },
  };
}
