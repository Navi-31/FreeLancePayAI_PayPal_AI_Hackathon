import { env } from "@/backend/validation/env";
import { z } from "zod";

export interface AICompletionOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema?: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  fallbackGenerator?: () => T;
}

export interface AICompletionResult<T> {
  data: T;
  provider: "gemini" | "openai" | "neon" | "deterministic-fallback";
  isFallback: boolean;
  model: string;
}

/**
 * Determine the active AI provider based on environment configuration and available keys.
 */
export function getActiveAiProvider(): {
  provider: "gemini" | "openai" | "neon" | "fallback";
  model: string;
  isConfigured: boolean;
} {
  const configuredChoice = env.AI_PROVIDER;

  // 1. Google Gemini
  const hasGeminiKey = Boolean(
    env.GEMINI_API_KEY &&
      env.GEMINI_API_KEY !== "placeholder_gemini_api_key" &&
      !env.GEMINI_API_KEY.startsWith("placeholder")
  );

  // 2. OpenAI
  const hasOpenAIKey = Boolean(
    env.OPENAI_API_KEY &&
      env.OPENAI_API_KEY !== "placeholder_openai_api_key" &&
      !env.OPENAI_API_KEY.startsWith("placeholder")
  );

  // 3. Neon AI Gateway
  const hasNeonGateway = Boolean(
    env.NEON_AI_GATEWAY_URL &&
      !env.NEON_AI_GATEWAY_URL.startsWith("placeholder")
  );

  if (configuredChoice === "gemini" && hasGeminiKey) {
    return { provider: "gemini", model: env.GEMINI_MODEL, isConfigured: true };
  }
  if (configuredChoice === "openai" && hasOpenAIKey) {
    return { provider: "openai", model: env.OPENAI_MODEL, isConfigured: true };
  }
  if (configuredChoice === "neon" && hasNeonGateway) {
    return { provider: "neon", model: "neon-gateway", isConfigured: true };
  }

  // Auto-detection
  if (hasGeminiKey) {
    return { provider: "gemini", model: env.GEMINI_MODEL, isConfigured: true };
  }
  if (hasOpenAIKey) {
    return { provider: "openai", model: env.OPENAI_MODEL, isConfigured: true };
  }
  if (hasNeonGateway) {
    return { provider: "neon", model: "neon-gateway", isConfigured: true };
  }

  return { provider: "fallback", model: "deterministic-rule-engine", isConfigured: false };
}

/**
 * Call Gemini API with structured response formatting.
 */
async function callGeminiApi<T>(
  options: AICompletionOptions<T>,
  model: string,
  apiKey: string
): Promise<T> {
  const maxRetries = 2;
  let delayMs = 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: options.systemPrompt + "\nRespond with valid JSON matching the requested structure." }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: options.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxTokens ?? 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        // Bounded retries with backoff for transient 503 (high demand) and 429 (rate limits)
        if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
          console.warn(`[Gemini API] Transient ${response.status} on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delayMs}ms...`);
          await new Promise((res) => setTimeout(res, delayMs));
          delayMs *= 2;
          continue;
        }

        const err = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${err}`);
      }

      const json = await response.json();
      const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error("Gemini returned empty candidate response");
      }

      const parsed = JSON.parse(candidateText);
      return options.schema ? options.schema.parse(parsed) : (parsed as T);
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === "AbortError";
      if (isAbort && attempt < maxRetries) {
        console.warn(`[Gemini API] Request timed out on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2;
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Gemini API call exhausted all retry attempts");
}

/**
 * Call OpenAI / Neon AI Gateway API with JSON response formatting.
 */
async function callOpenAIApi<T>(
  options: AICompletionOptions<T>,
  model: string,
  apiKey: string,
  baseUrl: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI API returned empty message content");
    }

    const parsed = JSON.parse(content);
    return options.schema ? options.schema.parse(parsed) : (parsed as T);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unified AI Completion Runner.
 * Executes live provider if configured, or cleanly falls back to deterministic logic.
 */
export async function runAICompletion<T>(
  options: AICompletionOptions<T>
): Promise<AICompletionResult<T>> {
  const active = getActiveAiProvider();

  if (active.isConfigured) {
    try {
      if (active.provider === "gemini") {
        const data = await callGeminiApi(options, active.model, env.GEMINI_API_KEY!);
        return { data, provider: "gemini", isFallback: false, model: active.model };
      }

      if (active.provider === "openai") {
        const data = await callOpenAIApi(
          options,
          active.model,
          env.OPENAI_API_KEY!,
          env.OPENAI_BASE_URL
        );
        return { data, provider: "openai", isFallback: false, model: active.model };
      }

      if (active.provider === "neon") {
        const data = await callOpenAIApi(
          options,
          active.model,
          env.NEON_AI_KEY || "neon",
          env.NEON_AI_GATEWAY_URL!
        );
        return { data, provider: "neon", isFallback: false, model: active.model };
      }
    } catch (err) {
      console.warn("Primary AI provider failed, engaging resilient fallback engine:", err);
      // Fall through to deterministic fallback generator
    }
  }

  // Graceful Deterministic Fallback Engine
  if (!options.fallbackGenerator) {
    throw new Error("No AI provider configured and no fallback generator provided.");
  }

  const fallbackData = options.fallbackGenerator();
  const validated = options.schema ? options.schema.parse(fallbackData) : fallbackData;

  return {
    data: validated,
    provider: "deterministic-fallback",
    isFallback: true,
    model: "deterministic-rule-engine",
  };
}
