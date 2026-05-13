import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: optional("KIMI_AUTH_URL", "http://localhost:3001"),
  kimiOpenUrl: optional("KIMI_OPEN_URL", "http://localhost:3001"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  deepseekApiKey: optional("DEEPSEEK_API_KEY", ""),
  deepseekBaseUrl: optional("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
};
