import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { Sparkles, Lightbulb, ArrowDown, X, Wand2 } from 'lucide-react'

const EXAMPLES = [
  '帮我写一个列表，可以下拉刷新，数据从网络上拿',
  '实现一个登录表单，有邮箱和密码两个字段',
  '写一个网络请求的封装，加上错误重试',
]

const SHORTCUTS = [
  { key: 'Ctrl + Enter', desc: '发送消息' },
  { key: 'Ctrl + N', desc: '新建对话' },
  { key: '/', desc: '快捷指令菜单' },
  { key: '?', desc: '显示此快捷键面板' },
  { key: 'Escape', desc: '关闭弹窗 / 取消编辑' },
]

export default function ChatView() {
  const messages = useStore(s => s.conversation.messages)
  const streaming = useStore(s => s.streaming)
  const streamingContent = useStore(s => s.streamingContent)
  const thinkingContent = useStore(s => s.thinkingContent)
  const error = useStore(s => s.error)
  const clearError = useStore(s => s.clearError)
  const setInputText = useStore(s => s.setInputText)
  const editingId = useStore(s => s.editingMessageId)
  const cancelEdit = useStore(s => s.cancelEdit)
  const newConversation = useStore(s => s.newConversation)
  const sessionGreeting = useStore(s => s.sessionGreeting)
  const greetingLoading = useStore(s => s.greetingLoading)
  const generateGreeting = useStore(s => s.generateGreeting)
  const [displayedGreeting, setDisplayedGreeting] = useState('')

  // 进入空对话时自动生成问候
  useEffect(() => {
    if (messages.length === 0) {
      generateGreeting()
    }
  }, [messages.length, generateGreeting])

  // 逐字动画
  useEffect(() => {
    if (!sessionGreeting || messages.length > 0) {
      setDisplayedGreeting('')
      return
    }
    setDisplayedGreeting('')
    let i = 0
    const chars = [...sessionGreeting]
    const timer = setInterval(() => {
      if (i < chars.length) {
        setDisplayedGreeting(chars.slice(0, i + 1).join(''))
        i++
      } else {
        clearInterval(timer)
      }
    }, 80)
    return () => clearInterval(timer)
  }, [sessionGreeting, messages.length])

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [thinkingOpen, setThinkingOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // 自动滚动
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, isAtBottom])

  // 检测是否在底部
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const threshold = 80
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsAtBottom(atBottom)
  }, [])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsAtBottom(true)
  }

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? 显示快捷键
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
      // Ctrl+N 新对话
      if (e.key === 'n' && (e.ctrlKey || e.metaKey) && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        newConversation()
      }
      // Escape 取消编辑
      if (e.key === 'Escape' && editingId) {
        cancelEdit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingId, cancelEdit, newConversation])

  // 空状态
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-white" />
        </div>
        {/* AI 生成的个性化问候 */}
        <div className="mb-4 min-h-[32px] flex items-center justify-center">
          {greetingLoading && !sessionGreeting ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Wand2 size={14} className="animate-pulse text-purple-400" />
              <span className="text-sm">正在感知你的状态...</span>
            </div>
          ) : sessionGreeting ? (
            <h2 className="text-[17px] font-medium text-gray-700 dark:text-gray-200">
              {displayedGreeting}
              {displayedGreeting.length < sessionGreeting.length && (
                <span className="inline-block w-[2px] h-[18px] bg-gray-400 dark:bg-gray-500 ml-0.5 align-middle animate-pulse" />
              )}
            </h2>
          ) : null}
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-md mb-8 leading-relaxed">
          在下方输入原始提示词，AI 会帮你优化为高质量、可直接使用的版本。
        </p>

        <div className="space-y-2 w-full max-w-md">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
            <Lightbulb size={13} />
            试试这样写：
          </div>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setInputText(ex)}
              className="block w-full text-left px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] shadow-sm text-[13px] text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-md transition-all"
            >
              "{ex}"
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <div className="w-full max-w-2xl">
          <InputBar />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* 消息列表 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 流式输出 */}
        {streaming && (
          <div className="message-enter">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={13} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 mb-1">优化助手</div>

                {thinkingContent && (
                  <div className="mb-2">
                    <button
                      onClick={() => setThinkingOpen(!thinkingOpen)}
                      className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                    >
                      <span>{thinkingOpen ? '🔽' : '▶️'}</span>
                      <span>思考过程</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </button>
                    {thinkingOpen && (
                      <pre className="mt-1.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-[12px] text-amber-800 dark:text-amber-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                        {thinkingContent}
                      </pre>
                    )}
                  </div>
                )}

                {streamingContent ? (
                  <div className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500 dot-pulse">
                    思考中<span>.</span><span>.</span><span>.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 滚到底部按钮 */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-10 p-2 bg-white dark:bg-[#2c2c2e] border border-black/10 dark:border-white/10 rounded-full shadow-lg hover:shadow-xl transition-all animate-in fade-in zoom-in"
          title="滚到底部"
        >
          <ArrowDown size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-[13px] text-red-600 dark:text-red-400">
          <span>⚠️</span>
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 font-medium shrink-0">关闭</button>
        </div>
      )}

      {/* 输入栏 */}
      <div className="px-6 pb-4 pt-2">
        <InputBar />
      </div>

      {/* 快捷键面板 */}
      {showShortcuts && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-[#2c2c2e] rounded-xl shadow-2xl border border-black/10 dark:border-white/10 p-6 w-80" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-700 dark:text-gray-200">快捷键</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-600 dark:text-gray-400">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[11px] text-gray-500 dark:text-gray-400 font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 text-center">按 ? 关闭</p>
          </div>
        </div>
      )}
    </div>
  )
}
