// Captures README screenshots from a running, seeded instance.
// Usage: BASE_URL=http://localhost:3000 PLAYWRIGHT_CHANNEL=msedge node scripts/screenshots.mjs
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = "docs/screenshots";

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });

await page.goto(`${baseUrl}/login`);
await page.screenshot({ path: `${outDir}/login.png` });

await page.getByLabel("Email").fill("demo@portal.test");
await page.getByLabel("Password").fill("Password123!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/tasks$/);
await page.screenshot({ path: `${outDir}/tasks.png`, fullPage: true });

await page
  .getByRole("button", { name: /^Delete task/ })
  .first()
  .click();
await page.screenshot({ path: `${outDir}/delete-confirm.png` });

await browser.close();
console.log(`Screenshots written to ${outDir}/`);
