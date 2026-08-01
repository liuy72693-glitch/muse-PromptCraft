import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import ContextBar from '@/components/Chat/ContextBar'
import ChatView from '@/components/Chat/ChatView'
import ResultPreview from '@/components/Preview/ResultPreview'
import SettingsView from '@/components/Settings/SettingsView'
import { PanelLeft, PanelRight, Plus, Settings, Trash2, Sparkles } from 'lucide-react'

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const title = useStore(s => s.conversation.title)
  const newConversation = useStore(s => s.newConversation)
  const conversations = useStore(s => s.conversations)
  const loadConversation = useStore(s => s.loadConversation)
  const currentId = useStore(s => s.conversation.id)
  const removeConversation = useStore(s => s.removeConversation)
  const theme = useStore(s => s.settings.theme)

  // 深色模式
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') { root.classList.add('dark') }
    else if (theme === 'light') { root.classList.remove('dark') }
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => mq.matches ? root.classList.add('dark') : root.classList.remove('dark')
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e] transition-colors duration-300">
      {/* ===== 顶部栏 ===== */}
      <header className="flex items-center gap-2.5 px-3 py-2 bg-white/80 dark:bg-[#2c2c2e]/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shrink-0 transition-colors select-none">
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className={`p-1.5 rounded-md transition-colors ${leftOpen ? 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="对话列表"
        >
          <PanelLeft size={15} />
        </button>

        {/* 品牌 */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100 tracking-tight">Muse</span>
        </div>
        <span className="text-[12px] text-gray-350 dark:text-gray-500 truncate flex-1 ml-1">— {title}</span>

        <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="设置">
          <Settings size={15} />
        </button>
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={`p-1.5 rounded-md transition-colors ${rightOpen ? 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}
          title="预览面板"
        >
          <PanelRight size={15} />
        </button>
      </header>

      {/* ===== 主体 ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：对话列表 (ChatGPT 风格) */}
        {leftOpen && (
          <aside className="w-[260px] shrink-0 bg-[var(--bg-app)] dark:bg-[#1e1e22] border-r border-black/5 dark:border-white/5 flex flex-col">
            {/* 新建按钮 */}
            <div className="px-3 py-3">
              <button
                onClick={newConversation}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-[13px] font-medium hover:bg-blue-600 active:scale-[0.98] shadow-sm transition-all"
              >
                <Plus size={15} /> 新对话
              </button>
            </div>

            {/* 对话列表 */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {conversations.length === 0 ? (
                <p className="text-center text-[12px] text-gray-350 dark:text-gray-600 mt-8">暂无对话记录</p>
              ) : (
                conversations.map(c => {
                  const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null
                  const isActive = c.id === currentId
                  return (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c)}
                      className={`group relative px-3 py-2.5 mb-0.5 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-50/70 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-800/40'
                          : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate pr-6">
                        {c.title}
                      </div>
                      {lastMsg && (
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 leading-snug">
                          {lastMsg.content.slice(0, 50)}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-350 dark:text-gray-600 mt-1">
                        {fmtDate(c.updatedAt)}
                      </div>
                      {/* 删除按钮 */}
                      <button
                        onClick={e => { e.stopPropagation(); removeConversation(c.id) }}
                        className="absolute right-2 top-2.5 p-1 rounded opacity-0 group-hover:opacity-100 text-gray-350 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* 中间：聊天 — key 强制切换对话时完全重建 */}
        <main key={currentId} className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1c1c1e] transition-colors">
          <ContextBar />
          <ChatView />
          <EditingBanner />
        </main>

        {/* 右侧：结果预览 */}
        {rightOpen && (
          <aside className="w-[380px] shrink-0 border-l border-black/5 dark:border-white/5 bg-[var(--bg-app)] dark:bg-[#242426] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5 dark:border-white/5">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">结果预览</span>
              <button onClick={() => setRightOpen(false)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500">关闭</button>
            </div>
            <ResultPreview />
          </aside>
        )}
      </div>

      {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
    </div>
  )
}

/** 编辑提示 */
function EditingBanner() {
  const editingId = useStore(s => s.editingMessageId)
  const cancelEdit = useStore(s => s.cancelEdit)
  if (!editingId) return null
  return (
    <div className="mx-6 mb-2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-[12px] text-blue-600 dark:text-blue-400">
      <span>✏️ 编辑中 — Ctrl+Enter 提交</span>
      <button onClick={cancelEdit} className="ml-auto font-medium">取消</button>
    </div>
  )
}

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && now.getDate() === d.getDate()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return '昨天'
  if (diff < 604800000) return d.toLocaleDateString('zh-CN', { weekday: 'short' })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
