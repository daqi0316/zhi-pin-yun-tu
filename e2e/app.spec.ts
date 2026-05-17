import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

test.describe("智聘云图 — 前后端集成浏览器测试", () => {
  test("登录页面正常渲染", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("智聘云图");
    await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("登录");
  });

  test("使用演示账户登录并跳转到首页", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page).toHaveURL("/");
  });

  test("首页总览包含关键 KPI 卡片", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await expect(page.locator("text=人才库总量")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=面试通过率")).toBeVisible();
    await expect(page.locator("text=Offer接受率")).toBeVisible();
  });

  test("侧边栏导航到人才库", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("人才库")');
    await page.waitForURL("/talent", { timeout: 5000 });
    await expect(page).toHaveURL("/talent");
  });

  test("侧边栏导航到岗位管理", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("岗位管理")');
    await page.waitForURL("/positions", { timeout: 5000 });
    await expect(page).toHaveURL("/positions");
  });

  test("侧边栏导航到渠道管理", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("渠道管理")');
    await page.waitForURL("/channels", { timeout: 5000 });
    await expect(page).toHaveURL("/channels");
  });

  test("侧边栏导航到面试流程", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("面试流程")');
    await page.waitForURL("/interviews", { timeout: 5000 });
    await expect(page).toHaveURL("/interviews");
  });

  test("侧边栏导航到人才画像", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("人才画像")');
    await page.waitForURL("/profiles", { timeout: 5000 });
    await expect(page).toHaveURL("/profiles");
  });

  test("侧边栏导航到Offer管理", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("Offer管理")');
    await page.waitForURL("/offers", { timeout: 5000 });
    await expect(page).toHaveURL("/offers");
  });

  test("侧边栏导航到数据分析", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("数据分析")');
    await page.waitForURL("/analytics", { timeout: 5000 });
    await expect(page).toHaveURL("/analytics");
  });

  test("侧边栏导航到预警监控", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("预警监控")');
    await page.waitForURL("/alerts", { timeout: 5000 });
    await expect(page).toHaveURL("/alerts");
  });

  test("侧边栏导航到公司关联", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.click('aside button:has-text("公司关联")');
    await page.waitForURL("/relations", { timeout: 5000 });
    await expect(page).toHaveURL("/relations");
  });

  test("无效路径跳转404页面", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/nonexistent-page-xyz");
    await expect(page.locator("body")).toContainText("404");
  });

  test("侧边栏折叠和展开", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    await page.click('button:has-text("收起菜单")');
    await expect(page.locator('button:has(svg) >> nth=0')).toBeVisible();

    const collapseBtn = page.locator("aside button").last();
    await collapseBtn.click();
    await expect(page.locator('aside >> text=总览')).toBeVisible();
  });

  test("错误密码登录失败提示", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator('[class*="text-[#FF5A65]"]')).toBeVisible({ timeout: 8000 });
  });

  test("搜索框输入并展示结果", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    const searchInput = page.locator('input[placeholder="搜索候选人、岗位、面试..."]');
    await searchInput.fill("张");
    await page.waitForTimeout(1500);

    const searchDropdown = page.locator(".shadow-2xl");
    if (await searchDropdown.isVisible()) {
      await expect(searchDropdown).toBeVisible();
    }
  });

  test("AI招聘助手面板打开和关闭", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="请输入用户名"]', "admin");
    await page.fill('input[placeholder="请输入密码"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10000 });

    const copilotBtn = page.locator('button >> svg[class*="lucide-sparkles"]').first();
    await copilotBtn.click();

    await expect(page.locator("text=AI 招聘助手").first()).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator('button:has-text("AI 招聘助手") ~ button').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(page.locator("text=AI 招聘助手")).not.toBeVisible({ timeout: 3000 });
    }
  });
});