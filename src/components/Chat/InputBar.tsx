import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { Send, CornerDownLeft, Paperclip } from 'lucide-react'

const QUICK_COMMANDS = [
  { icon: '📝', cmd: '/简化', desc: '让提示词更简洁' },
  { icon: '📋', cmd: '/详细', desc: '展开更多细节和约束' },
  { icon: '💡', cmd: '/举例', desc: '加入具体代码示例' },
  { icon: '✅', cmd: '/测试', desc: '补充测试相关约束' },
  { icon: '↩️', cmd: '/还原', desc: '回到上一版本' },
  { icon: '🆕', cmd: '/新对话', desc: '开始全新对话' },
]

export default function InputBar() {
  const inputText = useStore(s => s.inputText)
  const setInputText = useStore(s => s.setInputText)
  const sendMessage = useStore(s => s.sendMessage)
  const streaming = useStore(s => s.streaming)

  const [showCommands, setShowCommands] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调高
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 140) + 'px'
    }
  }, [inputText])

  // 检测 /
  useEffect(() => {
    setShowCommands(inputText === '/')
  }, [inputText])

  const handleSend = () => {
    if (inputText.trim() && !streaming) {
      sendMessage()
      setShowCommands(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      setShowCommands(false)
    }
  }

  const selectCommand = (cmd: string) => {
    setInputText(cmd)
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  const handleFileAttach = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.swift,.ts,.tsx,.js,.py,.rs,.go,.java,.kt,.cs,.cpp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const preview = text.slice(0, 2000)
      setInputText(inputText + `\n\n【附件: ${file.name}】\n\`\`\`\n${preview}\n\`\`\``)
    }
    input.click()
  }

  const disabled = !inputText.trim() || streaming

  return (
    <div className="relative">
      {/* 快捷指令弹出 */}
      {showCommands && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 animate-in">
          <div className="px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">快捷指令</div>
          {QUICK_COMMANDS.map(c => (
            <button
              key={c.cmd}
              onClick={() => selectCommand(c.cmd)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
            >
              <span className="text-sm w-5 text-center">{c.icon}</span>
              <span className="text-[13px] font-medium text-gray-700">{c.cmd}</span>
              <span className="text-[11px] text-gray-400 ml-auto">{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end gap-2 bg-[var(--bg-surface)] border border-black/10 dark:border-white/10 rounded-2xl shadow-sm focus-within:border-blue-300 focus-within:shadow-[0_0_0_3px_rgba(0,122,255,0.08)] transition-all">
        {/* 附件按钮 */}
        <button
          onClick={handleFileAttach}
          className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="附加文件作为上下文"
        >
          <Paperclip size={16} />
        </button>

        {/* 输入框 */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入原始提示词，Ctrl+Enter 发送"
          className="flex-1 resize-none outline-none py-2.5 text-[14px] leading-relaxed bg-transparent placeholder:text-gray-300 min-h-[40px] max-h-[140px]"
          rows={1}
          disabled={streaming}
        />

        {/* 发送 */}
        <div className="pr-2.5 pb-2.5 shrink-0">
          <button
            onClick={handleSend}
            disabled={disabled}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              disabled
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm'
            }`}
            title="发送 (Ctrl+Enter)"
          >
            {streaming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
