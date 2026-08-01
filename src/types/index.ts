// ========== API 提供商 ==========

export type ProviderType = 'anthropic' | 'openai' | 'google' | 'openai-compatible'

export interface ApiProvider {
  id: string
  name: string              // 显示名称，如 "Anthropic"、"DeepSeek"、"我的Ollama"
  type: ProviderType
  baseUrl: string           // API 端点，如 "https://api.anthropic.com"
  apiKey: string
  models: ProviderModel[]   // 检测到的模型列表
  selectedModel: string     // 当前选中的模型 ID
  enabled: boolean          // 是否启用
}

export interface ProviderModel {
  id: string                // 模型 ID，如 "claude-sonnet-4-20250514"
  name: string              // 显示名，如 "Claude Sonnet 4"
}

// ========== 内置提供商模板 ==========

export const BUILT_IN_PROVIDERS: Omit<ApiProvider, 'id' | 'apiKey' | 'models' | 'selectedModel'>[] = [
  {
    name: 'Anthropic',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    enabled: false,
  },
  {
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com',
    enabled: false,
  },
  {
    name: 'Google Gemini',
    type: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    enabled: false,
  },
  {
    name: 'DeepSeek',
    type: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    enabled: false,
  },
  {
    name: '通义千问 (阿里)',
    type: 'openai-compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
    enabled: false,
  },
  {
    name: 'Moonshot (月之暗面)',
    type: 'openai-compatible',
    baseUrl: 'https://api.moonshot.cn',
    enabled: false,
  },
  {
    name: '智谱 GLM',
    type: 'openai-compatible',
    baseUrl: 'https://open.bigmodel.cn/api/paas',
    enabled: false,
  },
  {
    name: '硅基流动 SiliconFlow',
    type: 'openai-compatible',
    baseUrl: 'https://api.siliconflow.cn',
    enabled: false,
  },
]

// Anthropic 已知模型（没 models API，写死）
export const ANTHROPIC_MODELS: ProviderModel[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
  { id: 'claude-sonnet-4-20250603', name: 'Claude Sonnet 4 (latest)' },
]

// Google Gemini 已知模型
export const GEMINI_MODELS: ProviderModel[] = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
]

// ========== 开发环境配置 ==========

export type Platform = 'macOS' | 'iOS' | 'Web' | 'Android' | 'Windows' | '命令行'

export type Language =
  | 'Swift' | 'Objective-C' | 'TypeScript' | 'JavaScript'
  | 'Kotlin' | 'Java' | 'Python' | 'Rust' | 'Go' | 'C#' | 'C++'

export type Framework =
  | 'SwiftUI' | 'AppKit' | 'UIKit'
  | 'React' | 'Vue' | 'Next.js' | 'Tailwind CSS'
  | 'Jetpack Compose'
  | 'Spring' | 'Flask' | 'Django' | 'FastAPI'
  | 'Actix' | 'Tauri' | 'Tokio' | 'Gin' | '.NET' | 'Qt'

export type TaskType =
  | 'UI开发' | '数据处理' | '网络请求' | '并发编程'
  | '测试' | '调试' | '架构设计' | '性能优化'
  | '安全加固' | '代码重构' | '文档生成' | 'API设计'

export type StylePref = '详细严谨' | '简洁精炼' | '示例驱动' | '逐步引导'

export interface ContextConfig {
  platform: Platform
  language: Language
  framework: Framework
  taskType: TaskType
  stylePref: StylePref
}

// ========== 级联数据 ==========

export const PLATFORM_META: Record<Platform, { icon: string; langs: Language[] }> = {
  macOS:     { icon: '💻', langs: ['Swift', 'Objective-C'] },
  iOS:       { icon: '📱', langs: ['Swift', 'Objective-C'] },
  Web:       { icon: '🌐', langs: ['TypeScript', 'JavaScript'] },
  Android:   { icon: '🤖', langs: ['Kotlin', 'Java'] },
  Windows:   { icon: '🪟', langs: ['C#', 'C++'] },
  '命令行':   { icon: '⬛', langs: ['Python', 'Rust', 'Go', 'Swift'] },
}

export const LANGUAGE_FRAMEWORKS: Record<Language, Framework[]> = {
  Swift:        ['SwiftUI', 'AppKit', 'UIKit'],
  'Objective-C': ['AppKit', 'UIKit'],
  TypeScript:   ['React', 'Vue', 'Next.js', 'Tailwind CSS'],
  JavaScript:   ['React', 'Vue', 'Next.js', 'Tailwind CSS'],
  Kotlin:       ['Jetpack Compose', 'Spring'],
  Java:         ['Spring'],
  Python:       ['Flask', 'Django', 'FastAPI'],
  Rust:         ['Actix', 'Tauri', 'Tokio'],
  Go:           ['Gin'],
  'C#':         ['.NET'],
  'C++':        ['Qt'],
}

export const TASK_ICONS: Record<TaskType, string> = {
  'UI开发': '🎨', '数据处理': '📊', '网络请求': '🌐', '并发编程': '⚡',
  '测试': '✅', '调试': '🐛', '架构设计': '🏗️', '性能优化': '🚀',
  '安全加固': '🔒', '代码重构': '🔧', '文档生成': '📝', 'API设计': '🔌',
}

// ========== 消息 & 对话 ==========

export interface DiffLine {
  id: string
  type: 'added' | 'modified' | 'removed' | 'unchanged'
  text: string
  lineNum: number
}

export interface PromptVersion {
  id: string
  original: string
  optimized: string
  diffLines: DiffLine[]
  summary: string
  timestamp: number
  version: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  version?: PromptVersion
  thinking?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  config: ContextConfig
  createdAt: number
  updatedAt: number
}

// ========== 预设 & 模板 ==========

export interface Preset {
  id: string
  name: string
  config: ContextConfig
}

export interface PromptTemplate {
  id: string
  name: string
  desc: string
  content: string
  category: string
}

// ========== 设置 ==========

export interface AppSettings {
  fontSize: number
  theme: 'system' | 'light' | 'dark'
  autoSave: boolean
  defaultPresetId?: string
}

// ========== 默认值 ==========

export const DEFAULT_CONFIG: ContextConfig = {
  platform: 'macOS',
  language: 'Swift',
  framework: 'SwiftUI',
  taskType: 'UI开发',
  stylePref: '详细严谨',
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 14,
  theme: 'system',
  autoSave: true,
}
