import { test as base, chromium } from "@playwright/test";
import { E2E_EXTENSION_DIR } from "./global-setup.mjs";

export const test = base.extend({
  // Playwright statically parses this signature to know which fixtures to
  // inject, so it must destructure even though `context` needs none.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${E2E_EXTENSION_DIR}`,
        `--load-extension=${E2E_EXTENSION_DIR}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) serviceWorker = await context.waitForEvent("serviceworker");
    await use(serviceWorker.url().split("/")[2]);
  },
});

export { expect } from "@playwright/test";
