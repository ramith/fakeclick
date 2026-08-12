import { test, expect } from "./fixtures.js";
import { startFixtureServer } from "./server.mjs";

const SCRIPT_ID = "fakeclick-main";

let server;

test.beforeAll(async () => {
  server = await startFixtureServer();
});

test.afterAll(async () => {
  await server.close();
});

// Enables the fixture server's origin the same way a real toggle does
// (chrome.storage.sync.set), then waits for background.js's real
// storage.onChanged -> syncRegistration() -> registerContentScripts()
// chain to actually finish registering, since it isn't awaited by the
// listener itself.
async function enableSiteAndWaitForRegistration(context) {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) serviceWorker = await context.waitForEvent("serviceworker");

  await serviceWorker.evaluate(() => chrome.storage.sync.set({ sites: ["127.0.0.1"] }));

  await serviceWorker.evaluate(async (scriptId) => {
    for (let i = 0; i < 40; i++) {
      const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
      if (scripts.length > 0) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("content script never registered");
  }, SCRIPT_ID);
}

test("site enabled: window.open is defused and no new tab actually opens", async ({ context }) => {
  await enableSiteAndWaitForRegistration(context);

  const page = await context.newPage();
  await page.goto(server.url);

  const pagesBefore = context.pages().length;
  await page.click("#btn");

  await expect(page).toHaveTitle("defused");
  expect(context.pages().length).toBe(pagesBefore);
});

test("site not enabled: window.open behaves normally (control case)", async ({ context }) => {
  const page = await context.newPage();
  await page.goto(server.url);

  const pagesBefore = context.pages().length;
  await page.click("#btn");

  // A genuinely successful window.open() also reports closed === false
  // (same as FakeClick's fake window), so the title alone can't tell them
  // apart. A real new page actually appearing is the only thing that can —
  // proving the previous test's "no new page" result came from the
  // extension, not from Chromium blocking it anyway regardless.
  await expect.poll(() => context.pages().length).toBe(pagesBefore + 1);
});
