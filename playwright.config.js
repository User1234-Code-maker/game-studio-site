import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
      testMatch: "**/{smoke,layout}.spec.js",
    },
  ],
  webServer: [
    {
      command: "node e2e/server.js",
      url: `http://localhost:${port}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Tiny rate limit, used only by the flood test.
      command: "node e2e/server.js",
      env: { E2E_PORT: "4174", RATE_LIMIT_PER_MINUTE: "5" },
      url: "http://localhost:4174/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
