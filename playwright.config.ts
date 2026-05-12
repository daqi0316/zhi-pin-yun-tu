import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3002",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-first-failure",
  },
});