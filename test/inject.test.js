import test from "node:test";
import assert from "node:assert/strict";
import { installFakeOpen } from "../src/inject.js";

function makeWindow() {
  let called = 0;
  const win = {
    open(...args) {
      called++;
      return { __realWindow: true, args };
    },
  };
  return { win, getCallCount: () => called };
}

test("window.open never actually opens anything", () => {
  const { win, getCallCount } = makeWindow();
  installFakeOpen(win);

  win.open("https://ads.example.com/popunder", "_blank");

  assert.equal(getCallCount(), 0, "the native open() must not be invoked");
});

test("window.open() looks like it succeeded to the calling script", () => {
  const { win } = makeWindow();
  installFakeOpen(win);

  const result = win.open("https://ads.example.com/popunder", "_blank");

  assert.notEqual(result, null, "ad scripts checking `if (popup)` must see a truthy value");
  assert.equal(result.closed, false);
});

test("the fake window reflects the requested URL and can be 'closed'", () => {
  const { win } = makeWindow();
  installFakeOpen(win);

  const result = win.open("https://ads.example.com/x", "_blank");
  assert.equal(result.location.href, "https://ads.example.com/x");

  result.close();
  assert.equal(result.closed, true);
});

test("defaults to about:blank when no URL is passed", () => {
  const { win } = makeWindow();
  installFakeOpen(win);

  const result = win.open();
  assert.equal(result.location.href, "about:blank");
});

test("writing to the fake window (e.g. .location.href = x) doesn't touch the real window", () => {
  const { win } = makeWindow();
  win.location = { href: "https://real-page.example/" };
  installFakeOpen(win);

  const result = win.open("https://ads.example.com/", "_blank");
  result.location = { href: "https://attacker.example/" };

  assert.equal(win.location.href, "https://real-page.example/");
});

test("unknown methods on the fake window are safe no-ops instead of throwing", () => {
  const { win } = makeWindow();
  installFakeOpen(win);

  const result = win.open("https://ads.example.com/", "_blank");
  assert.doesNotThrow(() => result.focus());
  assert.doesNotThrow(() => result.postMessage("hi", "*"));
});

test("each popup call returns an independent fake window", () => {
  const { win } = makeWindow();
  installFakeOpen(win);

  const a = win.open("https://ads.example.com/a", "_blank");
  const b = win.open("https://ads.example.com/b", "_blank");
  a.close();

  assert.equal(a.closed, true);
  assert.equal(b.closed, false);
});

test("installing twice on the same window is idempotent", () => {
  const { win, getCallCount } = makeWindow();
  installFakeOpen(win);
  const trappedOpen = win.open;
  installFakeOpen(win);

  assert.equal(win.open, trappedOpen, "second install must not re-wrap an already-trapped open");
  win.open("https://ads.example.com/", "_blank");
  assert.equal(getCallCount(), 0);
});
