import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import type { Platform, Language, Framework, TaskType, StylePref } from '@/types'
import { PLATFORM_META, LANGUAGE_FRAMEWORKS, TASK_ICONS } from '@/types'
import { ChevronDown, X, Cpu } from 'lucide-react'

export default function ContextBar() {
  const config = useStore(s => s.config)
  const provider = useStore(s => s.activeProvider())
  const setPlatform = useStore(s => s.setPlatform)
  const setLanguage = useStore(s => s.setLanguage)
  const setFramework = useStore(s => s.setFramework)
  const setTaskType = useStore(s => s.setTaskType)
  const setStylePref = useStore(s => s.setStylePref)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const tags = [
    { label: config.platform, icon: PLATFORM_META[config.platform]?.icon },
    { label: config.language },
    { label: config.framework },
    { label: config.taskType, icon: TASK_ICONS[config.taskType] },
    { label: config.stylePref },
  ]

  return (
    <div className="relative shrink-0 border-b border-black/5 dark:border-white/5" ref={ref}>
      {/* 标签行 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap shrink-0">
              {t.icon && <span className="text-[10px]">{t.icon}</span>}
              {t.label}
              {i < tags.length - 1 && <span className="text-gray-300 dark:text-gray-600 ml-0.5">·</span>}
            </span>
          ))}
        </div>

        {/* 当前模型 */   }
        {provider && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 border-l border-black/10 dark:border-white/10 pl-2 shrink-0 flex items-center gap-1">
            <Cpu size={10} />
            {provider.name}
          </span>
        )}

        <ChevronDown size={12} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* 弹出编辑器 */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white dark:bg-[#2c2c2e] border border-black/10 dark:border-white/10 rounded-b-xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* 平台 */}
            <Field label="目标平台">
              <GridSelect
                options={['macOS', 'iOS', 'Web', 'Android', 'Windows', '命令行'] as Platform[]}
                selected={config.platform}
                onSelect={v => { setPlatform(v); }}
                getIcon={v => PLATFORM_META[v]?.icon}
              />
            </Field>

            {/* 语言 */}
            <Field label="编程语言">
              <GridSelect
                options={PLATFORM_META[config.platform]?.langs ?? []}
                selected={config.language}
                onSelect={v => { setLanguage(v as Language); }}
              />
            </Field>

            {/* 框架 */}
            <Field label="框架 / UI">
              <GridSelect
                options={LANGUAGE_FRAMEWORKS[config.language] ?? []}
                selected={config.framework}
                onSelect={v => { setFramework(v as Framework); }}
              />
            </Field>

            {/* 任务类型 */}
            <Field label="任务类型">
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {(['UI开发', '数据处理', '网络请求', '并发编程', '测试', '调试', '架构设计', '性能优化', '安全加固', '代码重构', '文档生成', 'API设计'] as TaskType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTaskType(t)}
                    className={`flex items-center gap-1.5 w-full px-2 py-1 rounded text-left text-[11px] transition-colors ${
                      config.taskType === t ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-[10px] w-4 text-center">{TASK_ICONS[t]}</span>
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* 风格 */}
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
            <Field label="风格偏好">
              <div className="flex gap-1.5">
                {(['详细严谨', '简洁精炼', '示例驱动', '逐步引导'] as StylePref[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStylePref(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] transition-colors ${
                      config.stylePref === s
                        ? 'bg-blue-500 text-white font-medium'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 bg-blue-500 text-white text-[12px] font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== 小组件 =====

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function GridSelect<T extends string>({ options, selected, onSelect, getIcon }: {
  options: T[]
  selected: T
  onSelect: (v: T) => void
  getIcon?: (v: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
            selected === opt
              ? 'bg-blue-500 text-white font-medium'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {getIcon && <span className="text-[10px]">{getIcon(opt)}</span>}
          {opt}
        </button>
      ))}
    </div>
  )
}
