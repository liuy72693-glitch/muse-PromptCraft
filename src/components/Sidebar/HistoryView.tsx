import { useState } from 'react'
import { useStore } from '@/store'
import type { Conversation } from '@/types'
import { X, Search, Trash2, MessageSquare } from 'lucide-react'

export default function HistoryView({ onClose }: { onClose: () => void }) {
  const conversations = useStore(s => s.conversations)
  const loadConversation = useStore(s => s.loadConversation)
  const removeConversation = useStore(s => s.removeConversation)
  const currentId = useStore(s => s.conversation.id)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))
      )
    : conversations

  const handleSelect = (c: Conversation) => {
    loadConversation(c)
    onClose()
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('确定删除这条对话？')) removeConversation(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-black/10 w-[480px] max-h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-gray-400" />
            <h3 className="text-[14px] font-semibold text-gray-700">对话历史</h3>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{conversations.length}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* 搜索 */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/5">
          <Search size={13} className="text-gray-300 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索对话..."
            className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-gray-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-gray-400">
              {search ? '无匹配结果' : '暂无对话历史'}
            </div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`group px-4 py-3 border-b border-black/[0.03] cursor-pointer hover:bg-blue-50/50 transition-colors ${
                  c.id === currentId ? 'bg-blue-50/80' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">{c.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{c.config.platform}</span>
                      <span className="text-[10px] text-gray-400">{c.config.language}</span>
                      <span className="text-[10px] text-gray-350 ml-auto">
                        {new Date(c.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {c.messages.length > 0 && (
                      <p className="text-[11px] text-gray-400 truncate mt-1">
                        {c.messages[c.messages.length - 1].content.slice(0, 60)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={e => handleDelete(e, c.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
