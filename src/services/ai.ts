import type { ApiProvider, ContextConfig, Message } from '@/types'

// ===== CORS 代理 =====

const IS_DEV = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname === 'localhost'

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  if (IS_DEV) {
    const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`
    return fetch(proxyUrl, options)
  }
  return fetch(url, options)
}

// ===== 流式回调类型 =====

export interface StreamCallbacks {
  onToken: (text: string) => void
  onThinking: (text: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

// ===== 系统指令 =====

function buildSystem(config: ContextConfig): string {
  return `你是 Muse，奥林匹斯山上最年轻的女神，宙斯与记忆女神谟涅摩绪涅的女儿。

你的九位姊妹各自司掌不同的艺术——史诗、抒情诗、悲剧、喜剧、舞蹈、天文学……
而你司掌的是「灵感」。不是成品，不是答案，而是那道让人看清方向的光。

诗人站在神殿前呼唤你的名字，不是为了求一首诗，而是求神让他们"看见"那首诗的模样。
工匠在锻炉前闭上眼，不是为了让你替他打铁，而是求那道关于刀刃形状的闪电劈入脑海。

你现在也是这样。眼前的人——你的使用者——他就是你的诗人、你的工匠。
他手里有粗糙的矿石：一句半成品的需求、一段没法用的提示词、一个说不清的意图。
你的职责不是替他写代码，而是把矿石炼成金子。

=== 关于使用者 ===
使用者是 PromptCraft 的主人。他是一位开发者，可能在做 macOS、iOS、Web、Android、命令行工具，
可能用 Swift、TypeScript、Python、Rust、Go……他的项目很多，想法更多。
他有时候知道自己要什么但说不清楚，有时候想要的东西太多挤在一起。
你的任务就是帮他理清楚。

=== 关于 Quill ===
Quill 是你的笔。一支由狮鹫尾羽制成的羽毛笔，吸满了星光研磨的墨水。
你把灵感吹进使用者的心里，Quill 就替他把灵感写成代码、文件、完整的项目。

你们的关系是：
- 你说"看那座桥"——你只描述桥的样子、结构、美感
- Quill 画每一颗铆钉、每一块石板、每一条悬索
- 如果你说得够清楚，Quill 就能画得够精确

使用者可能会在你们两个之间来回切换：在你这里优化完提示词，拿去让 Quill 实现；
Quill 写了代码遇到问题，又回到你这里让你帮忙优化排查的提示词。
你要意识到这一点——你给的输出可能会被 Quill 的编程能力消费，所以尽量精确、具体、可执行。

=== 用户的开发环境 ===
- 目标平台: ${config.platform}
- 编程语言: ${config.language}
- 框架/UI: ${config.framework}
- 任务类型: ${config.taskType}
- 风格偏好: ${config.stylePref}

=== 你的工作方式 ===

1. 补全上下文
   使用者说"做个登录页面"，你要想到：
   - 他在什么平台上？iOS 的登录页和 Web 的完全不同
   - 用什么框架？SwiftUI 的写法跟 React 天差地别
   - 追求什么风格？他喜欢简洁精炼还是详细严谨？
   把这些隐含的信息补到提示词里。

2. 翻译模糊为精确
   不说"好看一点"，而是"玻璃拟态效果，圆角 12px，背景模糊 20px，弹性动画 0.3s ease-out"
   不说"性能好一点"，而是"使用 LazyVStack 避免一次性加载，图片异步加载并缓存到磁盘"

3. 补充遗漏
   开发者容易忘记的东西，你不会忘：
   - 错误处理（网络失败怎么办？数据为空怎么办？）
   - 加载态（数据还没回来时显示什么？）
   - 边界情况（用户输入了奇怪的东西怎么办？）
   - 无障碍（VoiceOver 标签、动态字体、高对比度）

4. 尊重意图
   永远不要擅自改变使用者想要的东西。
   他让你优化"登录按钮的样式"，你不要把整个登录流程重写一遍。
   他选了什么风格偏好，你就按那个风格来。

=== 输出格式（严格遵守） ===

第一部分：用两句优美而克制的中文，点明你做了什么优化。
不要啰嗦，不要讲废话，不要写"我注意到……""我发现……"这类油腻句式。

然后一行单独的 "---"

第二部分：完整的优化后提示词。
这就是使用者可以拿去用、可以给 Quill 执行的最终产物。
用第一人称、直接、可操作的语言写。不要说"你应该……"——直接说"请实现……"。

记住：
- 你不是在写代码，你是在写"让人或 AI 能写出正确代码的指令"
- 你优化的是提示词本身
- 如果你对自己说："这个提示词扔给一个 AI 程序员，它能写出来吗？"答案是"能"——那你做对了
- 如果你说"不知道"——那你的提示词还不够好

=== 你的语气 ===
你是女神，但你不是高高在上的那种。你是那种坐在篝火边给你讲故事的女神——
温柔、聪慧、偶尔有点调皮，但绝不油腻。不要喊"主人"，不要过度奉承。
使用者是你的合作伙伴，你们一起打磨灵感。`
}

function buildUserMessage(userInput: string, lastOptimized?: string): string {
  if (lastOptimized) {
    return `当前优化后的提示词：\n\`\`\`\n${lastOptimized}\n\`\`\`\n\n用户要求：${userInput}\n\n请根据用户要求修改优化提示词，输出格式不变（先说明改动，然后"---"，然后完整优化版）。`
  }
  return `请帮我优化以下提示词：\n\`\`\`\n${userInput}\n\`\`\`\n\n输出格式：先说明优化了什么，然后"---"，然后完整优化版。`
}

// ===== 统一入口 =====

/** 非流式调用 */
export async function callAI(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized?: string,
): Promise<string> {
  switch (provider.type) {
    case 'anthropic': return callAnthropic(provider, userInput, config, history, lastOptimized)
    case 'google': return callGoogle(provider, userInput, config, history, lastOptimized)
    case 'openai': case 'openai-compatible': return callOpenAI(provider, userInput, config, history, lastOptimized)
    default: throw new Error(`不支持的提供商类型: ${provider.type}`)
  }
}

/** 流式调用 */
export async function callAIStream(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized: string | undefined,
  callbacks: StreamCallbacks,
  systemPrompt?: string,
): Promise<string> {
  switch (provider.type) {
    case 'anthropic': return streamAnthropic(provider, userInput, config, history, lastOptimized, callbacks, systemPrompt)
    case 'google': return streamGoogle(provider, userInput, config, history, lastOptimized, callbacks, systemPrompt)
    case 'openai': case 'openai-compatible': return streamOpenAI(provider, userInput, config, history, lastOptimized, callbacks, systemPrompt)
    default: throw new Error(`不支持的提供商类型: ${provider.type}`)
  }
}

// ===== Anthropic 流式 =====

async function streamAnthropic(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized: string | undefined,
  cb: StreamCallbacks,
  systemPrompt?: string,
): Promise<string> {
  const sysPrompt = systemPrompt ?? buildSystem(config)
  // 有自定义 systemPrompt 时不包裹用户消息（非 Muse 优化场景）
  const userMsg = systemPrompt ? userInput : buildUserMessage(userInput, lastOptimized)

  const messages: { role: string; content: { type: string; text: string }[] }[] = []
  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: [{ type: 'text', text: msg.content }] })
  }
  messages.push({ role: 'user', content: [{ type: 'text', text: userMsg }] })

  const body = {
    model: provider.selectedModel,
    max_tokens: 4096,
    messages,
    system: [{ type: 'text', text: sysPrompt }],
    stream: true,
  }

  const res = await apiFetch(`${provider.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  return parseAnthropicSSE(res, cb)
}

async function parseAnthropicSSE(res: Response, cb: StreamCallbacks): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6)
      if (jsonStr === '[DONE]') continue
      try {
        const data = JSON.parse(jsonStr)
        if (data.type === 'content_block_delta') {
          if (data.delta?.type === 'text_delta' && data.delta.text) {
            fullText += data.delta.text
            cb.onToken(data.delta.text)
          } else if (data.delta?.type === 'thinking_delta' && data.delta.thinking) {
            cb.onThinking(data.delta.thinking)
          }
        } else if (data.type === 'content_block_start') {
          if (data.content_block?.type === 'thinking' && data.content_block.thinking) {
            cb.onThinking(data.content_block.thinking)
          }
        }
      } catch { /* skip malformed JSON */ }
    }
  }
  cb.onDone()
  return fullText
}

// ===== OpenAI 兼容流式 (SSE: data: {"choices":[{"delta":{"content":"..."}}]}) =====

async function streamOpenAI(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized: string | undefined,
  cb: StreamCallbacks,
  systemPrompt?: string,
): Promise<string> {
  const sysPrompt = systemPrompt ?? buildSystem(config)
  // 有自定义 systemPrompt 时不包裹用户消息（非 Muse 优化场景）
  const userMsg = systemPrompt ? userInput : buildUserMessage(userInput, lastOptimized)

  const messages: { role: string; content: string }[] = [{ role: 'system', content: sysPrompt }]
  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })
  }
  messages.push({ role: 'user', content: userMsg })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider.apiKey) headers['Authorization'] = `Bearer ${provider.apiKey}`

  const res = await apiFetch(`${provider.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.selectedModel,
      max_tokens: 4096,
      temperature: 0.7,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  return parseOpenAISSE(res, cb)
}

async function parseOpenAISSE(res: Response, cb: StreamCallbacks): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6).trim()
      if (jsonStr === '[DONE]') continue
      if (!jsonStr) continue
      try {
        const data = JSON.parse(jsonStr)
        const delta = data.choices?.[0]?.delta
        if (delta?.content) {
          fullText += delta.content
          cb.onToken(delta.content)
        }
        // DeepSeek R1 思考内容
        if (delta?.reasoning_content) {
          cb.onThinking(delta.reasoning_content)
        }
      } catch { /* skip malformed */ }
    }
  }
  cb.onDone()
  return fullText
}

// ===== Google Gemini 流式 =====

async function streamGoogle(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized: string | undefined,
  cb: StreamCallbacks,
  systemPrompt?: string,
): Promise<string> {
  const sysPrompt = systemPrompt ?? buildSystem(config)
  // 有自定义 systemPrompt 时不包裹用户消息（非 Muse 优化场景）
  const userMsg = systemPrompt ? userInput : buildUserMessage(userInput, lastOptimized)

  const contents: { role: string; parts: { text: string }[] }[] = []
  contents.push({ role: 'user', parts: [{ text: sysPrompt }] })
  contents.push({ role: 'model', parts: [{ text: systemPrompt ? '明白了，我是编程助手。' : '明白了，我是提示词优化助手。' }] })
  for (const msg of history.slice(-6)) {
    contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] })
  }
  contents.push({ role: 'user', parts: [{ text: userMsg }] })

  const modelId = provider.selectedModel.includes('/') ? provider.selectedModel : `models/${provider.selectedModel}`
  const url = `${provider.baseUrl}/v1beta/${modelId}:streamGenerateContent?alt=sse&key=${provider.apiKey}`

  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  return parseGeminiSSE(res, cb)
}

async function parseGeminiSSE(res: Response, cb: StreamCallbacks): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6).trim()
      if (!jsonStr) continue
      try {
        const data = JSON.parse(jsonStr)
        const parts = data.candidates?.[0]?.content?.parts
        if (parts) {
          for (const p of parts) {
            if (p.text) { fullText += p.text; cb.onToken(p.text) }
            if (p.thought) { cb.onThinking(p.thought) }
          }
        }
      } catch { /* skip */ }
    }
  }
  cb.onDone()
  return fullText
}

// ===== 非流式（fallback） =====

async function callAnthropic(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized?: string,
): Promise<string> {
  const sysPrompt = buildSystem(config)
  const userMsg = buildUserMessage(userInput, lastOptimized)

  const messages: { role: string; content: { type: string; text: string }[] }[] = []
  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: [{ type: 'text', text: msg.content }] })
  }
  messages.push({ role: 'user', content: [{ type: 'text', text: userMsg }] })

  const res = await apiFetch(`${provider.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: provider.selectedModel, max_tokens: 4096, messages, system: [{ type: 'text', text: sysPrompt }] }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.content?.filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n') ?? ''
}

async function callOpenAI(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized?: string,
): Promise<string> {
  const sysPrompt = buildSystem(config)
  const userMsg = buildUserMessage(userInput, lastOptimized)

  const messages: { role: string; content: string }[] = [{ role: 'system', content: sysPrompt }]
  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })
  }
  messages.push({ role: 'user', content: userMsg })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider.apiKey) headers['Authorization'] = `Bearer ${provider.apiKey}`

  const res = await apiFetch(`${provider.baseUrl}/v1/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: provider.selectedModel, max_tokens: 4096, temperature: 0.7, messages }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGoogle(
  provider: ApiProvider, userInput: string, config: ContextConfig,
  history: Message[], lastOptimized?: string,
): Promise<string> {
  const sysPrompt = buildSystem(config)
  const userMsg = buildUserMessage(userInput, lastOptimized)

  const contents: { role: string; parts: { text: string }[] }[] = []
  contents.push({ role: 'user', parts: [{ text: sysPrompt }] })
  contents.push({ role: 'model', parts: [{ text: '明白了，我是提示词优化助手。' }] })
  for (const msg of history.slice(-6)) {
    contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] })
  }
  contents.push({ role: 'user', parts: [{ text: userMsg }] })

  const modelId = provider.selectedModel.includes('/') ? provider.selectedModel : `models/${provider.selectedModel}`
  const url = `${provider.baseUrl}/v1beta/${modelId}:generateContent?key=${provider.apiKey}`

  const res = await apiFetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 4096, temperature: 0.7 } }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new Error('API Key 无效')
    if (res.status === 429) throw new Error('请求太频繁')
    throw new Error(`API 错误 (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('\n') ?? ''
}

// ===== 解析响应 =====

export function parseResponse(raw: string): { summary: string; optimized: string } {
  const idx = raw.indexOf('\n---\n')
  if (idx > 0) return { summary: raw.slice(0, idx).trim(), optimized: raw.slice(idx + 5).trim() }
  const parts = raw.split('---')
  if (parts.length >= 2) return { summary: parts[0].trim(), optimized: parts.slice(1).join('---').trim() }
  return { summary: '提示词已优化', optimized: raw }
}
