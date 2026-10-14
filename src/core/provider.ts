import { hasMottyInference, mottyConfig } from "./config.js";

export type ProviderMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ProviderToolCall[];
};

export type ProviderToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ProviderTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatCompletion = {
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: ProviderToolCall[];
  };
};

export async function createChatCompletion(input: {
  messages: ProviderMessage[];
  tools?: ProviderTool[];
}): Promise<ChatCompletion> {
  const { aiBaseUrl, aiApiKey, aiModel } = mottyConfig();
  if (!aiApiKey) {
    throw new Error("Motty inference is not configured.");
  }

  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiModel,
      temperature: 0.3,
      messages: input.messages,
      venice_parameters: {
        include_venice_system_prompt: false,
      },
      ...(input.tools?.length ? { tools: input.tools, tool_choice: "auto" } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Motty inference HTTP ${response.status} ${detail.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: ChatCompletion["message"] }>;
  };
  const message = json.choices?.[0]?.message;
  if (!message) {
    throw new Error("Motty inference returned no message.");
  }

  return {
    message: {
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    },
  };
}

export { hasMottyInference };
