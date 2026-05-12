import { test, expect } from "@playwright/test";

const BASE = "/api/trpc";

test.describe("智聘云图 — API/tRPC 接口测试", () => {
  async function login(request: any) {
    const loginRes = await request.post(`${BASE}/auth.login`, {
      data: { json: { username: "admin", password: "admin123" } },
      headers: { "Content-Type": "application/json" },
    });
    const setCookie = loginRes.headers()["set-cookie"];
    const match = setCookie.match(/kimi_sid=([^;]+)/);
    expect(match).toBeTruthy();
    return match[1];
  }

  test("ping 接口返回 ok", async ({ request }) => {
    const res = await request.get(`${BASE}/ping`);
    const body = await res.json();
    expect(body.result.data.json.ok).toBe(true);
  });

  test("登录接口返回用户信息", async ({ request }) => {
    const res = await request.post(`${BASE}/auth.login`, {
      data: { json: { username: "admin", password: "admin123" } },
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json();
    expect(body.result.data.json.user).toBeDefined();
    expect(body.result.data.json.user.role).toBe("admin");
  });

  test("未认证访问 auth.me 返回 false", async ({ request }) => {
    const res = await request.get(`${BASE}/auth.me`);
    const body = await res.json();
    expect(body.result.data.json).toBe(false);
  });

  test("登录后获取个人信息", async ({ request }) => {
    const cookie = await login(request);
    const meRes = await request.get(`${BASE}/auth.me`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const meBody = await meRes.json();
    expect(meBody.result.data.json.name).toBe("王芳");
  });

  test("dashboard.stats 返回统计数据", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/dashboard.stats`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    const data = body.result.data.json;
    expect(data).toHaveProperty("totalCandidates");
    expect(data).toHaveProperty("interviewPassRate");
    expect(data).toHaveProperty("offerAcceptRate");
    expect(data).toHaveProperty("avgHireDays");
  });

  test("candidate.list 返回候选人列表", async ({ request }) => {
    const cookie = await login(request);
    const input = encodeURIComponent(JSON.stringify({ json: {} }));
    const res = await request.get(`${BASE}/candidate.list?input=${input}`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(body.result.data.json).toHaveProperty("items");
    expect(body.result.data.json).toHaveProperty("total");
  });

  test("interview.list 返回面试列表", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/interview.list`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  test("offer.list 返回 Offer 列表", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/offer.list`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  test("channel.list 返回渠道列表", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/channel.list`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  test("alert.list 返回预警列表", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/alert.list`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  test("position.list 返回岗位列表", async ({ request }) => {
    const cookie = await login(request);
    const res = await request.get(`${BASE}/position.list`, {
      headers: { Cookie: `kimi_sid=${cookie}` },
    });
    const body = await res.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  test("错误密码登录失败", async ({ request }) => {
    const res = await request.post(`${BASE}/auth.login`, {
      data: { json: { username: "admin", password: "wrong" } },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.ok()).toBe(false);
  });
});