import type { Conversation, Preset, PromptVersion, AppSettings, ApiProvider } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const STORAGE_KEYS = {
  conversations: 'pc_conversations',
  presets: 'pc_presets',
  settings: 'pc_settings',
  favorites: 'pc_favorites',
  providers: 'pc_providers',
}

// ===== 对话 =====
export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.conversations)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveConversation(conv: Conversation) {
  const all = loadConversations().filter(c => c.id !== conv.id)
  all.unshift({ ...conv, updatedAt: Date.now() })
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(all))
}

export function deleteConversation(id: string) {
  const all = loadConversations().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(all))
}

// ===== 预设 =====
export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.presets)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function savePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(presets))
}

// ===== 收藏 =====
export function loadFavorites(): PromptVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveFavorites(favs: PromptVersion[]) {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favs))
}

// ===== 设置 =====
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}

// ===== API 提供商 =====
export function loadProviders(): ApiProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.providers)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveProviders(providers: ApiProvider[]) {
  localStorage.setItem(STORAGE_KEYS.providers, JSON.stringify(providers))
}

// ===== 导出 =====
export function exportConversation(conv: Conversation, format: 'md' | 'txt' | 'json'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(conv, null, 2)
    case 'md': {
      let md = `# ${conv.title}\n\n环境: ${conv.config.platform} / ${conv.config.language} / ${conv.config.framework}\n\n---\n\n`
      for (const msg of conv.messages) {
        md += `### ${msg.role === 'user' ? '👤 你' : '🤖 助手'}\n${msg.content}\n\n`
        if (msg.version) md += `> **优化摘要**: ${msg.version.summary}\n\n`
      }
      const last = conv.messages.filter(m => m.version).pop()?.version
      if (last) md += `---\n## 最终优化提示词\n\`\`\`\n${last.optimized}\n\`\`\`\n`
      return md
    }
    case 'txt': {
      let txt = `${conv.title}\n环境: ${conv.config.platform} / ${conv.config.language}\n\n`
      for (const msg of conv.messages) {
        txt += `--- ${msg.role === 'user' ? '你' : '助手'} ---\n${msg.content}\n\n`
      }
      const last = conv.messages.filter(m => m.version).pop()?.version
      if (last) txt += `--- 最终优化提示词 ---\n${last.optimized}\n`
      return txt
    }
  }
}

export function downloadAs(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
