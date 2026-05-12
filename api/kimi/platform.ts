import { env } from "../lib/env";
import type { UserProfile } from "./types";

async function kimiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T | null> {
  const resp = await fetch(`${env.kimiOpenUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.warn(`[kimi] Request to ${path} failed (${resp.status}): ${text}`);
    return null;
  }
  return resp.json() as Promise<T>;
}

export const users = {
  getProfile: (token: string) =>
    kimiRequest<UserProfile>("/v1/users/me/profile", token),
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}

export const chat = {
  completions: (messages: ChatMessage[], apiKey: string, model?: string) =>
    kimiRequest<ChatCompletion>("/v1/chat/completions", apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "kimi-latest",
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    }),
};
