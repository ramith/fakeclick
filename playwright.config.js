import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  globalSetup: "./test/e2e/global-setup.mjs",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  workers: 1,
});
