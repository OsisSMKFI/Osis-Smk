/**
 * Custom AI Provider (OpenAI-compatible) — dikonfigurasi via Admin Settings:
 *   CUSTOM_AI_BASE_URL  → Base Link, contoh: https://api.openai.com  |  https://openrouter.ai/api/v1
 *   CUSTOM_AI_API_KEY   → API Key
 *   CUSTOM_AI_MODEL     → nama model, contoh: gpt-4o-mini | deepseek-chat | llama-3.3-70b
 *
 * Kebijakan urutan provider (chat/agent/copilot):
 *   Custom (bila diisi) → Gemini → OpenAI → Anthropic
 *
 * Endpoint yang dipanggil (standar OpenAI-compatible):
 *   POST <base>/chat/completions   (base sudah mengandung /v1)
 *   POST <base>/v1/chat/completions (base tanpa /v1)
 */

import { getConfig } from '@/lib/adminConfig';

export interface CustomAIProvider {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AIMessage {
  role: string;
  content: string;
}

/** Susun URL chat/completions dari base link yang diisi admin. */
export function resolveChatCompletionsUrl(baseUrl: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(base)) return base;
  if (/\/v\d+/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

/** Ambil konfigurasi custom provider; null bila belum lengkap. */
export async function getCustomAIProvider(): Promise<CustomAIProvider | null> {
  const baseUrl = (await getConfig('CUSTOM_AI_BASE_URL'))?.trim();
  const apiKey = (await getConfig('CUSTOM_AI_API_KEY'))?.trim();
  if (!baseUrl || !apiKey) return null;
  const model = (await getConfig('CUSTOM_AI_MODEL'))?.trim() || 'gpt-4o-mini';
  return { baseUrl, apiKey, model };
}

/**
 * Panggil custom provider (OpenAI-compatible chat completions).
 * Melempar error bila gagal — caller boleh fallback ke provider lain.
 */
export async function callCustomAI(
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const provider = await getCustomAIProvider();
  if (!provider) throw new Error('Custom AI provider belum dikonfigurasi');

  const url = resolveChatCompletionsUrl(provider.baseUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const detail = data?.error?.message || data?.message || text.slice(0, 300);
    throw new Error(`Custom AI HTTP ${res.status}: ${detail}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Custom AI tidak mengembalikan isi pesan');
  return content;
}

export interface AITestResult {
  ok: boolean;
  provider?: string;
  model?: string;
  reply?: string;
  error?: string;
  checked: string[];
}

/**
 * Test koneksi nyata ke provider (custom → gemini → openai).
 * Mengirim pesan ping kecil dan mengembalikan balasan asli.
 */
export async function testAIConnection(): Promise<AITestResult> {
  const checked: string[] = [];
  let firstError: string | undefined;
  const ping: AIMessage[] = [
    { role: 'user', content: 'Balas satu kata saja: OK' },
  ];

  // 1) Custom provider
  const custom = await getCustomAIProvider();
  if (custom) {
    checked.push('custom');
    try {
      const reply = await callCustomAI(ping, { maxTokens: 32 });
      return { ok: true, provider: 'custom', model: custom.model, reply: reply.trim().slice(0, 200), checked };
    } catch (e: any) {
      // lanjut coba provider lain, tapi catat error custom
      firstError = `custom: ${e?.message || 'Unknown error'}`;
    }
  }

  // 2) Gemini
  const geminiKey = await getConfig('GEMINI_API_KEY');
  if (geminiKey) {
    checked.push('gemini');
    try {
      const model = ((await getConfig('GEMINI_MODEL')) || 'gemini-2.0-flash').replace(/^models\//, '');
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Balas satu kata saja: OK' }] }],
            generationConfig: { maxOutputTokens: 16 },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
      if (!reply) throw new Error('Tidak ada balasan');
      return { ok: true, provider: 'gemini', model, reply: reply.trim().slice(0, 200), checked };
    } catch (e: any) {
      firstError = firstError || `gemini: ${e?.message || 'Unknown'}`;
    }
  }

  // 3) OpenAI
  const openaiKey = await getConfig('OPENAI_API_KEY');
  if (openaiKey) {
    checked.push('openai');
    try {
      const model = (await getConfig('OPENAI_MODEL')) || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ model, messages: ping, max_tokens: 32 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) throw new Error('Tidak ada balasan');
      return { ok: true, provider: 'openai', model, reply: reply.trim().slice(0, 200), checked };
    } catch (e: any) {
      firstError = firstError || `openai: ${e?.message || 'Unknown'}`;
    }
  }

  return {
    ok: false,
    error:
      firstError ||
      'Tidak ada provider yang dikonfigurasi. Isi CUSTOM_AI_BASE_URL + CUSTOM_AI_API_KEY (atau GEMINI_API_KEY / OPENAI_API_KEY) lalu simpan.',
    checked,
  };
}
