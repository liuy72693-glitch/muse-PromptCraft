import { create } from 'zustand'
import type {
  ContextConfig, Conversation, Message, Preset, PromptVersion,
  AppSettings, ApiProvider, ProviderModel,
} from '@/types'
import {
  DEFAULT_CONFIG, DEFAULT_SETTINGS,
  LANGUAGE_FRAMEWORKS, PLATFORM_META,
  BUILT_IN_PROVIDERS, ANTHROPIC_MODELS,
} from '@/types'
import { callAIStream, parseResponse } from '@/services/ai'
import { detectModels } from '@/services/providers'
import { computeDiff } from '@/services/diff'
import { saveReport } from '@/services/reports'
import {
  loadConversations, saveConversation, deleteConversation,
  loadPresets, savePresets,
  loadFavorites, saveFavorites,
  loadSettings, saveSettings,
  loadProviders, saveProviders,
} from '@/services/storage'

// ===== 内置预设 =====
const BUILT_IN_PRESETS: Preset[] = [
  { id: 'swiftui', name: 'SwiftUI 开发', config: { platform: 'macOS', language: 'Swift', framework: 'SwiftUI', taskType: 'UI开发', stylePref: '详细严谨' } },
  { id: 'react', name: 'React Web 开发', config: { platform: 'Web', language: 'TypeScript', framework: 'React', taskType: 'UI开发', stylePref: '示例驱动' } },
  { id: 'python', name: 'Python 后端 API', config: { platform: 'Web', language: 'Python', framework: 'FastAPI', taskType: 'API设计', stylePref: '详细严谨' } },
  { id: 'ios', name: 'iOS App 开发', config: { platform: 'iOS', language: 'Swift', framework: 'SwiftUI', taskType: 'UI开发', stylePref: '示例驱动' } },
  { id: 'android', name: 'Android Compose', config: { platform: 'Android', language: 'Kotlin', framework: 'Jetpack Compose', taskType: 'UI开发', stylePref: '示例驱动' } },
  { id: 'rust-cli', name: 'Rust 命令行工具', config: { platform: '命令行', language: 'Rust', framework: 'Tokio', taskType: '性能优化', stylePref: '简洁精炼' } },
]

// ===== 初始化内置提供商（全部默认禁用） =====
function initProviders(): ApiProvider[] {
  const saved = loadProviders()
  const savedMap = new Map(saved.map(p => [p.name, p]))

  return BUILT_IN_PROVIDERS.map(template => {
    const existing = savedMap.get(template.name)
    const id = existing?.id ?? crypto.randomUUID()
    const apiKey = existing?.apiKey ?? ''
    const models = existing?.models ?? (template.type === 'anthropic' ? ANTHROPIC_MODELS : [])
    const selectedModel = existing?.selectedModel ?? (models[0]?.id ?? '')
    // 全部默认禁用，用户必须手动点"启用"
    const enabled = existing?.enabled ?? false
    return { id, ...template, apiKey, models, selectedModel, enabled }
  })
}

// ===== 初始化 providers 并保存（让后续 loadProviders 能读到） =====
const INITIAL_PROVIDERS = initProviders()
saveProviders(INITIAL_PROVIDERS)

// ===== Store =====
interface AppStore {
  // --- 配置 ---
  config: ContextConfig
  setPlatform: (p: ContextConfig['platform']) => void
  setLanguage: (l: ContextConfig['language']) => void
  setFramework: (f: ContextConfig['framework']) => void
  setTaskType: (t: ContextConfig['taskType']) => void
  setStylePref: (s: ContextConfig['stylePref']) => void
  resetConfig: () => void

  // --- 提供商 ---
  providers: ApiProvider[]
  /** 当前活跃的提供商 */
  activeProvider: () => ApiProvider | null
  /** 激活一个提供商（同时禁用其他所有） */
  activateProvider: (id: string) => void
  addCustomProvider: (name: string, baseUrl: string) => void
  removeProvider: (id: string) => void
  updateProvider: (id: string, patch: Partial<ApiProvider>) => void
  detectAndSetModels: (id: string) => Promise<void>

  // --- 对话 ---
  conversation: Conversation
  conversations: Conversation[]
  streaming: boolean
  streamingContent: string
  thinkingContent: string
  error: string | null
  inputText: string
  editingMessageId: string | null
  selectedVersionIdx: number
  previewMode: 'diff' | 'preview'
  recentConfigs: ContextConfig[]
  sessionGreeting: string           // AI 生成的个性化问候
  greetingLoading: boolean          // 正在生成问候

  generateGreeting: () => void

  setInputText: (t: string) => void
  sendMessage: () => Promise<void>
  startEditMessage: (id: string) => void
  cancelEdit: () => void
  regenerateMessage: (id: string) => void
  deleteMessage: (id: string) => void
  loadConversation: (c: Conversation) => void
  newConversation: () => void
  removeConversation: (id: string) => void
  refreshList: () => void
  clearError: () => void
  setPreviewMode: (m: 'diff' | 'preview') => void

  // --- 版本 ---
  currentVersion: () => PromptVersion | null
  versionCount: () => number
  goPrevVersion: () => void
  goNextVersion: () => void

  // --- 预设 ---
  presets: Preset[]
  saveCurrentAsPreset: (name: string) => void
  deleteUserPreset: (id: string) => void
  applyPreset: (preset: Preset) => void

  // --- 收藏 ---
  favorites: PromptVersion[]
  toggleFavorite: (v: PromptVersion) => void
  isFavorited: (id: string) => boolean

  // --- 设置 ---
  settings: AppSettings
  updateSettings: (s: Partial<AppSettings>) => void

  // --- 级联 ---
  availableLanguages: () => ContextConfig['language'][]
  availableFrameworks: () => ContextConfig['framework'][]
}

function makeConversation(config: ContextConfig): Conversation {
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    messages: [],
    config: { ...config },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const useStore = create<AppStore>((set, get) => ({
  // ===== 初始状态 =====
  config: { ...DEFAULT_CONFIG },
  providers: INITIAL_PROVIDERS,
  conversation: makeConversation(DEFAULT_CONFIG),
  conversations: loadConversations(),
  streaming: false,
  streamingContent: '',
  thinkingContent: '',
  error: null,
  inputText: '',
  editingMessageId: null,
  selectedVersionIdx: 0,
  previewMode: 'diff' as const,
  recentConfigs: [],
  sessionGreeting: '',
  greetingLoading: false,
  presets: loadPresets(),
  favorites: loadFavorites(),
  settings: loadSettings(),

  // ===== 配置 =====
  setPlatform: (p) => {
    const langs = PLATFORM_META[p].langs
    const lang = langs.includes(get().config.language) ? get().config.language : langs[0]
    const fws = LANGUAGE_FRAMEWORKS[lang]
    const fw = fws.includes(get().config.framework) ? get().config.framework : fws[0]
    set(s => ({
      config: { ...s.config, platform: p, language: lang, framework: fw },
      conversation: { ...s.conversation, config: { ...s.conversation.config, platform: p, language: lang, framework: fw } },
    }))
  },
  setLanguage: (l) => {
    const fws = LANGUAGE_FRAMEWORKS[l]
    const fw = fws.includes(get().config.framework) ? get().config.framework : fws[0]
    set(s => ({
      config: { ...s.config, language: l, framework: fw },
      conversation: { ...s.conversation, config: { ...s.conversation.config, language: l, framework: fw } },
    }))
  },
  setFramework: (f) => set(s => ({
    config: { ...s.config, framework: f },
    conversation: { ...s.conversation, config: { ...s.conversation.config, framework: f } },
  })),
  setTaskType: (t) => set(s => ({
    config: { ...s.config, taskType: t },
    conversation: { ...s.conversation, config: { ...s.conversation.config, taskType: t } },
  })),
  setStylePref: (st) => set(s => ({
    config: { ...s.config, stylePref: st },
    conversation: { ...s.conversation, config: { ...s.conversation.config, stylePref: st } },
  })),
  resetConfig: () => set(s => ({
    config: { ...DEFAULT_CONFIG },
    conversation: { ...s.conversation, config: { ...DEFAULT_CONFIG } },
  })),

  // ===== 提供商 =====
  activeProvider: () => {
    return get().providers.find(p => p.enabled) ?? null
  },

  activateProvider: (id) => {
    const providers = get().providers.map(p => ({
      ...p,
      enabled: p.id === id,
    }))
    set({ providers })
    saveProviders(providers)
  },

  addCustomProvider: (name, baseUrl) => {
    const id = crypto.randomUUID()
    const provider: ApiProvider = {
      id, name, type: 'openai-compatible', baseUrl,
      apiKey: '', models: [], selectedModel: '', enabled: true,
    }
    const providers = [...get().providers, provider]
    set({ providers })
    saveProviders(providers)
  },

  removeProvider: (id) => {
    const providers = get().providers.filter(p => p.id !== id)
    set({ providers })
    saveProviders(providers)
  },

  updateProvider: (id, patch) => {
    const providers = get().providers.map(p =>
      p.id === id ? { ...p, ...patch } : p
    )
    set({ providers })
    saveProviders(providers)
  },

  detectAndSetModels: async (id) => {
    const provider = get().providers.find(p => p.id === id)
    if (!provider) return

    // 先标记加载中
    get().updateProvider(id, { models: [] })

    try {
      const models = await detectModels(provider)
      get().updateProvider(id, {
        models,
        selectedModel: models[0]?.id ?? '',
      })
    } catch (e) {
      // 即使检测失败也保留已有模型
      throw e
    }
  },

  // ===== 问候生成 =====

  generateGreeting: () => {
    if (get().sessionGreeting) return
    // 从 Dashboard 写入的缓存读取
    try {
      const raw = localStorage.getItem('pc_greeting_cache')
      if (raw) {
        const { text, date } = JSON.parse(raw)
        if (date === new Date().toDateString()) {
          set({ sessionGreeting: text })
          return
        }
      }
    } catch {}
    // 无缓存时用本地模板
    const hour = new Date().getHours()
    if (hour < 6) set({ sessionGreeting: '夜深了，但灵感不等人。' })
    else if (hour < 12) set({ sessionGreeting: '早上好，今天从哪开始？' })
    else if (hour < 18) set({ sessionGreeting: '下午了，来杯咖啡和提示词。' })
    else set({ sessionGreeting: '晚上好，今天的最后一轮优化？' })
  },

  // ===== 对话 =====
  setInputText: (t) => set({ inputText: t }),

  sendMessage: async () => {
    const { inputText, config, conversation, streaming, activeProvider } = get()
    const provider = activeProvider()
    const text = inputText.trim()
    if (!text || streaming) return
    if (!provider) { set({ error: '请先在设置中配置至少一个 API 提供商并选择模型' }); return }

    // 快捷指令 — 转换为实际文本，不递归
    let resolvedText = text
    if (text.startsWith('/')) {
      switch (text) {
        case '/简化': resolvedText = '请让提示词更简洁，只保留核心要点'; break
        case '/详细': resolvedText = '请让提示词更详细，补充更多技术约束和边界情况'; break
        case '/举例': resolvedText = '请在提示词中加入具体代码示例'; break
        case '/测试': resolvedText = '请为这个提示词补充测试相关的约束'; break
        case '/还原': {
          if (conversation.messages.length >= 2) {
            const msgs = [...conversation.messages]; msgs.splice(-2)
            const conv = { ...conversation, messages: msgs, updatedAt: Date.now() }
            set({
              conversation: conv,
              selectedVersionIdx: Math.max(0, msgs.filter(m => m.version).length - 1),
              inputText: '',
            })
            saveConversation(conv)
          }
          return
        }
        case '/新对话': get().newConversation(); return
        default: break
      }
    }

    // 添加用户消息
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: resolvedText, timestamp: Date.now() }
    const title = conversation.title === '新对话'
      ? text.slice(0, 30) + (text.length > 30 ? '…' : '')
      : conversation.title

    set(s => ({
      inputText: '', error: null,
      conversation: {
        ...s.conversation, title,
        messages: [...s.conversation.messages, userMsg],
        updatedAt: Date.now(),
      },
    }))

    // 记住当前对话 ID，防止流式响应写到错误对话
    const convId = get().conversation.id

    // 调用 AI（流式）
    set({ streaming: true, streamingContent: '', thinkingContent: '' })

    try {
      const state = get()
      const lastVersion = state.conversation.messages.filter(m => m.version).pop()?.version

      // 流式调用
      const raw = await callAIStream(
        provider,
        resolvedText,
        state.config,
        state.conversation.messages.filter(m => m.id !== userMsg.id),
        lastVersion?.optimized,
        {
          onToken: (t) => { set(s => ({ streamingContent: s.streamingContent + t })) },
          onThinking: (t) => { set(s => ({ thinkingContent: s.thinkingContent + t })) },
          onDone: () => {},
          onError: (err) => { set({ streaming: false, error: err.message }) },
        },
      )

      // 验证对话没被切换
      if (get().conversation.id !== convId) {
        // 对话已切换，丢弃这个响应
        set({ streaming: false, streamingContent: '', thinkingContent: '' })
        return
      }

      // 流式完成，解析结果
      const fullText = raw || get().streamingContent
      const { summary, optimized } = parseResponse(fullText)
      const original = lastVersion ? lastVersion.optimized : text
      const diffLines = computeDiff(original, optimized)
      const vNum = state.conversation.messages.filter(m => m.version).length + 1

      const version: PromptVersion = {
        id: crypto.randomUUID(), original, optimized, diffLines, summary,
        timestamp: Date.now(), version: vNum,
      }
      const assistantMsg: Message = {
        id: crypto.randomUUID(), role: 'assistant',
        content: summary, timestamp: Date.now(), version,
      }

      // 记录最近使用的配置
      const cfg = state.config
      const recent = [cfg, ...state.recentConfigs.filter(c =>
        JSON.stringify(c) !== JSON.stringify(cfg)
      )].slice(0, 5)

      set(s => ({
        editingMessageId: null,
        recentConfigs: recent,
        streaming: false,
        streamingContent: '',
        thinkingContent: '',
        conversation: {
          ...s.conversation,
          messages: [...s.conversation.messages, assistantMsg],
          updatedAt: Date.now(),
        },
        selectedVersionIdx: vNum - 1,
      }))

      saveConversation(get().conversation)
      // 保存工作报告（50-100 字摘要）
      saveReport({
        id: crypto.randomUUID(), assistant: 'muse',
        summary: summary.slice(0, 100),
        timestamp: Date.now(),
        conversationId: get().conversation.id,
      })
      set({ conversations: loadConversations() })
    } catch (e: unknown) {
      set({ streaming: false, streamingContent: '', thinkingContent: '', error: (e as Error).message })
    }
  },

  startEditMessage: (id) => {
    const msg = get().conversation.messages.find(m => m.id === id)
    if (msg && msg.role === 'user') {
      set({ editingMessageId: id, inputText: msg.content })
    }
  },

  cancelEdit: () => {
    set({ editingMessageId: null, inputText: '' })
  },

  regenerateMessage: (id) => {
    const { conversation } = get()
    const idx = conversation.messages.findIndex(m => m.id === id)
    if (idx < 0) return

    // 找到这个消息之前的最后一个用户消息
    let userMsgId = id
    if (conversation.messages[idx].role === 'assistant') {
      // 找这一对对话的用户消息
      for (let i = idx; i >= 0; i--) {
        if (conversation.messages[i].role === 'user') {
          userMsgId = conversation.messages[i].id
          break
        }
      }
    }

    // 删除这条用户消息及之后的所有消息
    const userIdx = conversation.messages.findIndex(m => m.id === userMsgId)
    const kept = conversation.messages.slice(0, userIdx)
    const userMsg = conversation.messages[userIdx]

    set(s => ({
      conversation: { ...s.conversation, messages: kept, updatedAt: Date.now() },
      inputText: userMsg?.content ?? '',
      editingMessageId: null,
    }))

    // 自动重新发送
    setTimeout(() => get().sendMessage(), 100)
  },

  deleteMessage: (id) => {
    const { conversation } = get()
    // 找到这个消息及对应的回复（如果删除用户消息，连助手回复也删）
    const idx = conversation.messages.findIndex(m => m.id === id)
    if (idx < 0) return

    let toRemove = 1
    if (conversation.messages[idx].role === 'user' && idx + 1 < conversation.messages.length) {
      // 如果后面跟着助手消息，一起删
      if (conversation.messages[idx + 1].role === 'assistant') toRemove = 2
    } else if (conversation.messages[idx].role === 'assistant') {
      toRemove = 1
    }

    const kept = [...conversation.messages]
    kept.splice(idx, toRemove)

    set(s => ({
      conversation: { ...s.conversation, messages: kept, updatedAt: Date.now() },
      selectedVersionIdx: Math.max(0, kept.filter(m => m.version).length - 1),
      editingMessageId: s.editingMessageId === id ? null : s.editingMessageId,
    }))

    saveConversation(get().conversation)
  },

  loadConversation: (c) => {
    // 流式中禁止切换
    if (get().streaming) return
    saveConversation(get().conversation)
    // 深拷贝，避免引用污染
    const loaded: Conversation = JSON.parse(JSON.stringify(c))
    const versions = loaded.messages.filter(m => m.version)
    set({
      conversation: loaded,
      config: loaded.config,
      selectedVersionIdx: Math.max(0, versions.length - 1),
      error: null,
      inputText: '',
      editingMessageId: null,
      streaming: false,
      streamingContent: '',
      thinkingContent: '',
    })
  },

  newConversation: () => {
    // 流式中禁止新建
    if (get().streaming) return
    const conv = get().conversation
    if (conv.messages.length > 0) saveConversation(conv)
    // 彻底清空所有状态
    set({
      conversation: makeConversation(get().config),
      selectedVersionIdx: 0,
      error: null,
      inputText: '',
      editingMessageId: null,
      streaming: false,
      streamingContent: '',
      thinkingContent: '',
      sessionGreeting: '',
    })
    setTimeout(() => get().generateGreeting(), 50)
  },

  removeConversation: (id) => {
    deleteConversation(id)
    if (get().conversation.id === id) set({ conversation: makeConversation(get().config), selectedVersionIdx: 0 })
    set({ conversations: loadConversations() })
  },

  refreshList: () => set({ conversations: loadConversations() }),
  clearError: () => set({ error: null }),
  setPreviewMode: (m) => set({ previewMode: m }),

  // ===== 版本 =====
  currentVersion: () => {
    const versions = get().conversation.messages.filter(m => m.version).map(m => m.version!)
    if (!versions.length) return null
    return versions[Math.min(get().selectedVersionIdx, versions.length - 1)] ?? null
  },
  versionCount: () => get().conversation.messages.filter(m => m.version).length,
  goPrevVersion: () => set(s => ({ selectedVersionIdx: Math.max(0, s.selectedVersionIdx - 1) })),
  goNextVersion: () => {
    const max = get().versionCount() - 1
    set(s => ({ selectedVersionIdx: Math.min(max, s.selectedVersionIdx + 1) }))
  },

  // ===== 预设 =====
  saveCurrentAsPreset: (name) => {
    const preset: Preset = { id: crypto.randomUUID(), name, config: { ...get().config } }
    const presets = [...get().presets, preset]
    set({ presets })
    savePresets(presets)
  },
  deleteUserPreset: (id) => {
    const presets = get().presets.filter(p => p.id !== id)
    set({ presets })
    savePresets(presets)
  },
  applyPreset: (preset) => set(s => ({
    config: { ...preset.config },
    conversation: { ...s.conversation, config: { ...preset.config } },
  })),

  // ===== 收藏 =====
  toggleFavorite: (v) => {
    const favs = get().favorites
    const idx = favs.findIndex(f => f.id === v.id)
    const next = idx >= 0 ? favs.filter(f => f.id !== v.id) : [...favs, v]
    set({ favorites: next })
    saveFavorites(next)
  },
  isFavorited: (id) => get().favorites.some(f => f.id === id),

  // ===== 设置 =====
  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial }
    set({ settings: next })
    saveSettings(next)
  },

  // ===== 级联 =====
  availableLanguages: () => PLATFORM_META[get().config.platform]?.langs ?? [],
  availableFrameworks: () => LANGUAGE_FRAMEWORKS[get().config.language] ?? [],
}))

export { BUILT_IN_PRESETS }
export function useAllPresets() {
  const userPresets = useStore(s => s.presets)
  return [...BUILT_IN_PRESETS, ...userPresets]
}
