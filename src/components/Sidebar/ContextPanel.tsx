import { useState } from 'react'
import { useStore, useAllPresets } from '@/store'
import type { Platform, Language, Framework, TaskType, StylePref } from '@/types'
import { TASK_ICONS } from '@/types'
import { ChevronDown, ChevronRight, Bookmark, RotateCcw, X, Cpu, Clock, Search, Settings2, Monitor, Type, Puzzle, Target, Sparkles } from 'lucide-react'

// 折叠记忆 key
const COLLAPSE_KEY = 'pc_collapse_state'

function loadCollapse(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '{}') } catch { return {} }
}
function saveCollapse(state: Record<string, boolean>) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state))
}

export default function ContextPanel() {
  const recentConfigs = useStore(s => s.recentConfigs)
  const applyConfig = useStore(s => {
    return (cfg: typeof s.config) => {
      s.setPlatform(cfg.platform)
      s.setLanguage(cfg.language)
      s.setFramework(cfg.framework)
      s.setTaskType(cfg.taskType)
      s.setStylePref(cfg.stylePref)
    }
  })

  return (
    <div className="h-full overflow-y-auto py-3 px-3 space-y-1 text-[13px]">
      <div className="flex items-center gap-2 mb-3 px-2">
        <Settings2 size={14} className="text-gray-400" />
        <span className="font-semibold text-gray-700 dark:text-gray-200">开发上下文</span>
      </div>

      {/* 最近使用 */}
      {recentConfigs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 px-2 mb-1.5">
            <Clock size={11} className="text-gray-400" />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">最近使用</span>
          </div>
          <div className="space-y-0.5">
            {recentConfigs.slice(0, 3).map((cfg, i) => (
              <button
                key={i}
                onClick={() => applyConfig(cfg)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/5 text-left transition-colors"
              >
                <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  {cfg.platform} · {cfg.language} · {cfg.framework}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Section title="目标平台" icon={<Monitor size={13} />} sectionKey="platform">
        <RadioGroup<Platform>
          options={['macOS', 'iOS', 'Web', 'Android', 'Windows', '命令行']}
          getLabel={p => p}
          selected={s => s.config.platform}
          onSelect={(s, v) => s.setPlatform(v)}
        />
      </Section>

      <Section title="编程语言" icon={<Type size={13} />} sectionKey="language">
        <CascadedOptions<Language>
          getOptions={s => s.availableLanguages()}
          getLabel={l => l}
          selected={s => s.config.language}
          onSelect={(s, v) => s.setLanguage(v)}
          recommended={s => s.availableLanguages()[0]}
        />
      </Section>

      <Section title="框架 / UI" icon={<Puzzle size={13} />} sectionKey="framework">
        <CascadedOptions<Framework>
          getOptions={s => s.availableFrameworks()}
          getLabel={f => f}
          selected={s => s.config.framework}
          onSelect={(s, v) => s.setFramework(v)}
          recommended={s => s.availableFrameworks()[0]}
        />
      </Section>

      <Section title="任务类型" icon={<Target size={13} />} sectionKey="taskType" defaultOpen={false}>
        <SearchableTaskTypes />
      </Section>

      {/* 当前模型指示器 */}
      <ModelIndicator />

      <Section title="风格偏好" icon={<Sparkles size={13} />} sectionKey="style" defaultOpen={false}>
        <RadioGroup<StylePref>
          options={['详细严谨', '简洁精炼', '示例驱动', '逐步引导']}
          getLabel={s => s}
          selected={s => s.config.stylePref}
          onSelect={(s, v) => s.setStylePref(v)}
        />
      </Section>

      {/* 预设 */}
      <PresetSection />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 pt-2 px-1">
        <ResetButton />
        <SavePresetButton />
      </div>
    </div>
  )
}

// ===== 子组件 =====

function Section({ title, icon, sectionKey, defaultOpen, children }: {
  title: string; icon: React.ReactNode; sectionKey: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const saved = loadCollapse()
  const [open, setOpen] = useState(saved[sectionKey] ?? defaultOpen ?? true)

  const toggle = () => {
    const next = !open
    setOpen(next)
    const s = loadCollapse()
    s[sectionKey] = next
    saveCollapse(s)
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 w-full py-1.5 px-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/5 text-left transition-colors"
      >
        <span className="text-gray-400 shrink-0">{icon}</span>
        <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex-1">{title}</span>
        {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
      </button>
      {open && <div className="ml-2 pl-3 border-l border-black/5">{children}</div>}
    </div>
  )
}

function RadioGroup<T extends string>({ options, getLabel, selected, onSelect }: {
  options: T[]
  getLabel: (v: T) => string
  selected: (s: ReturnType<typeof useStore.getState>) => T
  onSelect: (s: ReturnType<typeof useStore.getState>, v: T) => void
}) {
  const store = useStore()
  const cur = selected(store)
  return (
    <div className="space-y-0.5 py-0.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(store, opt)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-[12px] transition-colors ${
            cur === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-black/[0.03] text-gray-600'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            cur === opt ? 'border-blue-500' : 'border-gray-300'
          }`}>
            {cur === opt && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          </span>
          {getLabel(opt)}
        </button>
      ))}
    </div>
  )
}

function CascadedOptions<T extends string>({ getOptions, getLabel, selected, onSelect, recommended }: {
  getOptions: (s: ReturnType<typeof useStore.getState>) => T[]
  getLabel: (v: T) => string
  selected: (s: ReturnType<typeof useStore.getState>) => T
  onSelect: (s: ReturnType<typeof useStore.getState>, v: T) => void
  recommended: (s: ReturnType<typeof useStore.getState>) => T
}) {
  const store = useStore()
  const opts = getOptions(store)
  const cur = selected(store)
  const rec = recommended(store)
  return (
    <div className="space-y-0.5 py-0.5">
      {opts.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(store, opt)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-[12px] transition-colors ${
            cur === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-black/[0.03] text-gray-600'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            cur === opt ? 'border-blue-500' : 'border-gray-300'
          }`}>
            {cur === opt && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          </span>
          {getLabel(opt)}
          {opt === rec && (
            <span className="ml-auto text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">推荐</span>
          )}
        </button>
      ))}
    </div>
  )
}

function OptionList<T extends string>({ items, getIcon, getHint, selected, onSelect }: {
  items: T[]
  getIcon?: (v: T) => string
  getHint?: (v: T) => string
  selected: (s: ReturnType<typeof useStore.getState>) => T
  onSelect: (s: ReturnType<typeof useStore.getState>, v: T) => void
}) {
  const store = useStore()
  const cur = selected(store)
  return (
    <div className="space-y-0.5 py-0.5 max-h-48 overflow-y-auto">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onSelect(store, item)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left transition-colors ${
            cur === item ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-black/[0.03] text-gray-600'
          }`}
          title={getHint?.(item)}
        >
          {getIcon && <span className="text-xs w-4 text-center shrink-0">{getIcon(item)}</span>}
          <span className="text-[12px] leading-tight">{item}</span>
          {cur === item && <span className="ml-auto text-blue-500 text-[10px]">✓</span>}
        </button>
      ))}
    </div>
  )
}

// ===== 任务类型搜索 =====

function SearchableTaskTypes() {
  const [filter, setFilter] = useState('')
  const store = useStore()
  const allTypes: TaskType[] = ['UI开发', '数据处理', '网络请求', '并发编程', '测试', '调试', '架构设计', '性能优化', '安全加固', '代码重构', '文档生成', 'API设计']

  const filtered = filter.trim()
    ? allTypes.filter(t => t.includes(filter.trim()))
    : allTypes

  return (
    <div className="space-y-1 py-0.5">
      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
        <Search size={11} className="text-gray-350 shrink-0" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="筛选..."
          className="flex-1 text-[11px] outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-600 dark:text-gray-400"
        />
        {filter && (
          <button onClick={() => setFilter('')} className="text-gray-300 dark:text-gray-600 hover:text-gray-500">
            <X size={10} />
          </button>
        )}
      </div>
      <div className="max-h-36 overflow-y-auto">
        <OptionList<TaskType>
          items={filtered}
          getIcon={t => TASK_ICONS[t]}
          selected={s => s.config.taskType}
          onSelect={(s, v) => s.setTaskType(v)}
        />
      </div>
    </div>
  )
}

// ===== 预设区域 =====

function PresetSection() {
  const allPresets = useAllPresets()
  const store = useStore()
  const userIds = new Set(store.presets.map(p => p.id))

  if (allPresets.length === 0) return null

  return (
    <div className="pt-3 mt-2 border-t border-black/5">
      <div className="flex items-center gap-1.5 px-2 mb-1.5">
        <Bookmark size={11} className="text-gray-400" />
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">预设</span>
      </div>
      <div className="space-y-0.5">
        {allPresets.map(p => (
          <div
            key={p.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/[0.04] cursor-pointer transition-colors"
            onClick={() => store.applyPreset(p)}
          >
            <span className="text-blue-500 shrink-0"><Bookmark size={11} fill="currentColor" /></span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-gray-700 truncate">{p.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{p.config.platform} · {p.config.language} · {p.config.framework}</div>
            </div>
            {userIds.has(p.id) && (
              <button
                onClick={e => { e.stopPropagation(); store.deleteUserPreset(p.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-all"
                title="删除预设"
              >
                <X size={10} className="text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== 当前模型指示器 =====

function ModelIndicator() {
  const provider = useStore(s => s.activeProvider())
  if (!provider) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-red-50 border border-red-100 text-[12px] text-red-600">
        <Cpu size={13} />
        <span className="flex-1">未配置 AI 模型</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-green-50 border border-green-100 text-[12px]">
      <Cpu size={13} className="text-green-600" />
      <div className="flex-1 min-w-0">
        <div className="text-green-700 font-medium truncate">{provider.name}</div>
        <div className="text-[10px] text-green-500 truncate">{provider.selectedModel}</div>
      </div>
    </div>
  )
}

// ===== 操作按钮 =====

function ResetButton() {
  const reset = useStore(s => s.resetConfig)
  return (
    <button
      onClick={reset}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-colors"
    >
      <RotateCcw size={11} />
      重置
    </button>
  )
}

function SavePresetButton() {
  const save = useStore(s => s.saveCurrentAsPreset)
  return (
    <button
      onClick={() => {
        const name = prompt('预设名称：')
        if (name?.trim()) save(name.trim())
      }}
      className="flex items-center gap-1 ml-auto px-2 py-1 rounded-md text-[11px] text-blue-500 hover:bg-blue-50 transition-colors font-medium"
    >
      <Bookmark size={11} />
      保存预设
    </button>
  )
}
