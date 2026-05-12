const DEFAULT_BASE_URL = "https://api.deepseek.com";

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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function deepseekRequest<T>(
  path: string,
  apiKey: string,
  baseUrl: string,
  init?: RequestInit
): Promise<T | null> {
  const resp = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.warn(
      `[deepseek] Request to ${path} failed (${resp.status}): ${text}`
    );
    return null;
  }
  return resp.json() as Promise<T>;
}

export async function chatCompletions(
  messages: ChatMessage[],
  apiKey: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    baseUrl?: string;
  }
): Promise<ChatCompletion | null> {
  return deepseekRequest<ChatCompletion>(
    "/v1/chat/completions",
    apiKey,
    options?.baseUrl || DEFAULT_BASE_URL,
    {
      method: "POST",
      body: JSON.stringify({
        model: options?.model || "deepseek-chat",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    }
  );
}
