import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

test("人才画像页面调试", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[placeholder="请输入用户名"]', "admin");
  await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });

  // 采集 console 错误
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  // 导航到人才画像
  await page.click('aside button:has-text("人才画像")');
  await page.waitForURL("/profiles", { timeout: 10000 });
  await page.waitForTimeout(3000);

  // 截图
  await page.screenshot({ path: "test-results/profiles-debug.png", fullPage: true });

  // 检查有无内容
  const bodyText = await page.locator("body").innerText();
  console.log("Page URL:", page.url());
  console.log("Body text length:", bodyText.length);
  console.log("Body text (first 300):", bodyText.substring(0, 300));
  console.log("Page errors:", errors);

  // 断言页面有实质内容，不是空白
  expect(bodyText.length).toBeGreaterThan(50);
});

test("面试流程页面调试", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[placeholder="请输入用户名"]', "admin");
  await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });

  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.click('aside button:has-text("面试流程")');
  await page.waitForURL("/interviews", { timeout: 10000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "test-results/interviews-debug.png", fullPage: true });

  const bodyText = await page.locator("body").innerText();
  console.log("Page URL:", page.url());
  console.log("Body text length:", bodyText.length);
  console.log("Page errors:", errors);

  expect(bodyText.length).toBeGreaterThan(50);
});
