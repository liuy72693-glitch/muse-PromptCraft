import { useState } from 'react'
import type { Message } from '@/types'
import { useStore } from '@/store'
import { User, Sparkles, Copy, Check, Pencil, RefreshCw, Trash2, Star, ChevronDown, MinusCircle, PlusCircle } from 'lucide-react'

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const startEdit = useStore(s => s.startEditMessage)
  const regenerate = useStore(s => s.regenerateMessage)
  const deleteMsg = useStore(s => s.deleteMessage)
  const editingId = useStore(s => s.editingMessageId)
  const cancelEdit = useStore(s => s.cancelEdit)
  const streaming = useStore(s => s.streaming)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const isFav = message.version ? useStore(s => s.isFavorited(message.version!.id)) : false

  const isEditing = editingId === message.id
  const canEdit = isUser && !streaming && editingId === null
  const version = message.version

  const copyContent = async () => {
    const text = version?.optimized ?? message.content
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={`message-enter flex gap-3 group ${isEditing ? 'ring-2 ring-blue-300 dark:ring-blue-600 rounded-xl' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 头像 */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-green-100 dark:bg-green-900/40'
      }`}>
        {isUser
          ? <User size={13} className="text-blue-600 dark:text-blue-400" />
          : <Sparkles size={13} className="text-green-600 dark:text-green-400" />
        }
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {/* 头部行 */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[11px] font-semibold ${isUser ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
            {isUser ? (isEditing ? '编辑中' : '你') : 'Muse'}
          </span>
          <span className="text-[11px] text-gray-350 dark:text-gray-500">{time}</span>
          {version && <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">v{version.version}</span>}
          {isEditing && (
            <button onClick={cancelEdit} className="text-[10px] text-gray-400 hover:text-red-500 ml-auto">取消编辑</button>
          )}
        </div>

        {/* 正文 */}
        <div className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* === 优化结果直接嵌入（像 Claude Artifacts） === */}
        {version && (
          <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1c1c1e]">
            {/* 折叠头 */}
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showDiff ? '' : '-rotate-90'}`} />
              <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300">优化对比</span>
              <div className="flex items-center gap-2 ml-auto">
                <DiffStat type="added" count={version.diffLines.filter(l => l.type === 'added').length} />
                <DiffStat type="modified" count={version.diffLines.filter(l => l.type === 'modified').length} />
                <DiffStat type="removed" count={version.diffLines.filter(l => l.type === 'removed').length} />
              </div>
            </button>

            {/* Diff 内容 */}
            {showDiff && (
              <div className="border-t border-gray-100 dark:border-gray-700 max-h-80 overflow-y-auto">
                {version.diffLines.map(line => (
                  <DiffLine key={line.id} line={line} />
                ))}
              </div>
            )}

            {/* 操作栏 */}
            <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <ActionBtn icon={copied ? <Check size={12} /> : <Copy size={12} />} label={copied ? '已复制' : '复制优化版'} primary onClick={copyContent} />
              <ActionBtn
                icon={<Star size={12} fill={isFav ? 'currentColor' : 'none'} />}
                label={isFav ? '已收藏' : '收藏'}
                onClick={() => toggleFavorite(version)}
              />
              <div className="flex-1" />
              <span className="text-[11px] text-gray-400">
                优化后 {version.optimized.length} 字符
              </span>
            </div>
          </div>
        )}

        {/* 悬停操作 */}
        {(hovered || isEditing) && !streaming && (
          <div className="flex items-center gap-1 mt-2">
            {isUser && canEdit && <ActionBtn icon={<Pencil size={11} />} label="编辑" onClick={() => startEdit(message.id)} />}
            {isUser && !isEditing && <ActionBtn icon={<RefreshCw size={11} />} label="重发" onClick={() => regenerate(message.id)} />}
            {version && <ActionBtn icon={<RefreshCw size={11} />} label="重新生成" onClick={() => regenerate(message.id)} />}
            <ActionBtn icon={<Trash2 size={11} />} label="删除" className="hover:text-red-500" onClick={() => deleteMsg(message.id)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ===== 小部件 =====

function DiffStat({ type, count }: { type: 'added' | 'modified' | 'removed'; count: number }) {
  if (count === 0) return null
  const colors = {
    added: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    modified: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    removed: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  }
  const icons = {
    added: <PlusCircle size={10} />,
    modified: <span className="text-[10px]">~</span>,
    removed: <MinusCircle size={10} />,
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full ${colors[type]}`}>
      {icons[type]} {count}
    </span>
  )
}

function DiffLine({ line }: { line: { id: string; type: string; text: string } }) {
  const bg = {
    added: 'bg-green-50/60 dark:bg-green-900/15',
    modified: 'bg-amber-50/60 dark:bg-amber-900/15',
    removed: 'bg-red-50/60 dark:bg-red-900/15',
    unchanged: '',
  }[line.type] || ''

  const border = {
    added: 'border-l-2 border-green-400',
    modified: 'border-l-2 border-amber-400',
    removed: 'border-l-2 border-red-400',
    unchanged: 'border-l-2 border-transparent',
  }[line.type] || ''

  const textColor = line.type === 'removed'
    ? 'text-red-400 dark:text-red-500 line-through'
    : line.type === 'unchanged'
      ? 'text-gray-400 dark:text-gray-600'
      : 'text-gray-700 dark:text-gray-300'

  return (
    <div className={`flex items-start gap-2 px-3 py-[2px] text-[12px] font-mono leading-relaxed ${bg} ${border}`}>
      <span className={`whitespace-pre-wrap break-all ${textColor}`}>{line.text || ' '}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, className = '', primary = false }: {
  icon: React.ReactNode; label: string; onClick: () => void; className?: string; primary?: boolean
}) {
  const baseStyle = primary
    ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] transition-colors ${baseStyle} ${className}`}
    >
      {icon}{label}
    </button>
  )
}
