// Runs in the page's own JS context (MAIN world), at document_start —
// before the page's own scripts get a chance to run or grab a reference
// to the real window.open.
(() => {
  if (window.__fakeclickInstalled) return;
  window.__fakeclickInstalled = true;

  const nativeOpen = window.open;

  // A minimal stand-in for a real Window object. Property writes (e.g.
  // `win.location.href = "..."`) land here, not on the real page, so a
  // script that does `window.open(...).location = adUrl` can't navigate
  // anything real either.
  function createFakeWindow(url) {
    const state = {
      closed: false,
      opener: window,
      location: { href: typeof url === "string" ? url : "about:blank" },
    };
    const noop = () => {};
    return new Proxy(state, {
      get(target, prop) {
        if (prop === "close") return () => { target.closed = true; };
        if (prop in target) return target[prop];
        return noop;
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    });
  }

  // Wrapping the native function in a Proxy (rather than replacing it
  // with a plain JS function) keeps Function.prototype.toString looking
  // native-ish, which avoids tripping the crude anti-adblock checks some
  // ad scripts run before deciding how to pop.
  const openTrap = new Proxy(nativeOpen, {
    apply(target, thisArg, args) {
      return createFakeWindow(args[0]);
    },
  });

  try {
    Object.defineProperty(window, "open", {
      value: openTrap,
      writable: true,
      configurable: true,
    });
  } catch {
    window.open = openTrap;
  }
})();
