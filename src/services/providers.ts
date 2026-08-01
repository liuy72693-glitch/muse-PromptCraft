import type { ApiProvider, ProviderModel } from '@/types'
import { ANTHROPIC_MODELS, GEMINI_MODELS } from '@/types'

// ===== CORS 代理 =====

const IS_DEV = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname === 'localhost'

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  if (IS_DEV) {
    const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`
    return fetch(proxyUrl, options)
  }
  return fetch(url, options)
}

/**
 * 检测提供商可用模型列表
 * 不同提供商类型用不同检测方式
 */
export async function detectModels(provider: ApiProvider): Promise<ProviderModel[]> {
  switch (provider.type) {
    case 'anthropic':
      return detectAnthropicModels(provider)
    case 'google':
      return detectGoogleModels(provider)
    case 'openai':
    case 'openai-compatible':
      return detectOpenAIModels(provider)
    default:
      return []
  }
}

/** Anthropic 没有 /models API，用内置列表，但验证 Key 是否有效 */
async function detectAnthropicModels(provider: ApiProvider): Promise<ProviderModel[]> {
  if (!provider.apiKey.trim()) return ANTHROPIC_MODELS

  try {
    const res = await apiFetch(`${provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      }),
    })
    // 只要不是 401 就说明 key 有效
    if (res.status === 401 || res.status === 403) {
      throw new Error('API Key 无效')
    }
    // 不管返回什么（可能报 model 不存在等），key 是有效的
    return ANTHROPIC_MODELS
  } catch (e) {
    if ((e as Error).message === 'API Key 无效') throw e
    // 网络错误也返回列表（离线也能看到模型）
    return ANTHROPIC_MODELS
  }
}

/** Google Gemini: GET /v1beta/models?key=xxx */
async function detectGoogleModels(provider: ApiProvider): Promise<ProviderModel[]> {
  if (!provider.apiKey.trim()) return GEMINI_MODELS

  const url = `${provider.baseUrl}/v1beta/models?key=${provider.apiKey}`
  const res = await apiFetch(url, {})

  if (res.status === 401 || res.status === 403) {
    throw new Error('API Key 无效')
  }

  if (!res.ok) {
    // fallback 内置列表
    return GEMINI_MODELS
  }

  try {
    const data = await res.json()
    const models = data.models || []
    return models
      .filter((m: { name: string }) => m.name.includes('gemini'))
      .map((m: { name: string; displayName?: string }) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name.replace('models/', ''),
      }))
  } catch {
    return GEMINI_MODELS
  }
}

/** OpenAI 兼容: GET /models */
async function detectOpenAIModels(provider: ApiProvider): Promise<ProviderModel[]> {
  if (!provider.apiKey.trim()) return []

  const headers: Record<string, string> = {}
  if (provider.apiKey) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`
  }

  const res = await apiFetch(`${provider.baseUrl}/v1/models`, { headers })

  if (res.status === 401 || res.status === 403) {
    throw new Error('API Key 无效')
  }

  if (!res.ok) {
    throw new Error(`检测失败 (HTTP ${res.status})`)
  }

  const data = await res.json()
  const raw = data.data || []

  return raw
    .map((m: { id: string }) => ({
      id: m.id,
      name: m.id,
    }))
    // 过滤掉非对话模型（embedding、moderation、audio 等）
    .filter((m: ProviderModel) =>
      !m.id.includes('embed') &&
      !m.id.includes('moderation') &&
      !m.id.includes('tts') &&
      !m.id.includes('whisper') &&
      !m.id.includes('dall-e')
    )
}
