import { useStore } from '@/store'
import DiffView from './DiffView'
import VersionSlider from './VersionSlider'
import { Copy, Check, Star, Download, Eye, Columns } from 'lucide-react'
import { useState } from 'react'
import { exportConversation, downloadAs } from '@/services/storage'

export default function ResultPreview() {
  const version = useStore(s => s.currentVersion())
  const versionCount = useStore(s => s.versionCount())
  const mode = useStore(s => s.previewMode)
  const setMode = useStore(s => s.setPreviewMode)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const isFav = useStore(s => version ? s.isFavorited(version.id) : false)
  const conversation = useStore(s => s.conversation)
  const [copied, setCopied] = useState(false)

  const copyOptimized = async () => {
    if (!version) return
    await navigator.clipboard.writeText(version.optimized)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = (format: 'md' | 'txt' | 'json') => {
    const content = exportConversation(conversation, format)
    const mime = format === 'json' ? 'application/json' : 'text/plain'
    const ext = format
    downloadAs(content, `${conversation.title}.${ext}`, mime)
  }

  // 空状态
  if (!version) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Eye size={22} className="text-gray-300" />
        </div>
        <p className="text-[13px] font-medium text-gray-400 mb-1">暂无优化结果</p>
        <p className="text-[12px] text-gray-350 leading-relaxed">
          在对话区输入提示词，<br />优化结果会显示在这里
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 视图模式切换 + 版本导航 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-black/5">
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setMode('diff')}
            className={`p-1.5 rounded transition-colors ${mode === 'diff' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            title="对比视图"
          >
            <Columns size={13} />
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`p-1.5 rounded transition-colors ${mode === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            title="纯预览"
          >
            <Eye size={13} />
          </button>
        </div>

        {/* 版本滑块 */}
        {versionCount > 1 && (
          <div className="flex-1 ml-1">
            <VersionSlider />
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'diff' ? (
          <DiffView version={version} />
        ) : (
          <div className="p-4">
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg mb-4">
              <p className="text-[12px] text-blue-700 leading-relaxed">{version.summary}</p>
            </div>
            <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
              {version.optimized}
            </pre>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-black/5 bg-white/80">
        <button
          onClick={copyOptimized}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-[12px] font-medium rounded-lg hover:bg-blue-600 active:scale-[0.97] transition-all"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? '已复制' : '复制'}
        </button>

        <button
          onClick={() => toggleFavorite(version)}
          className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          title={isFav ? '取消收藏' : '收藏'}
        >
          <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        <div className="relative group">
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="导出">
            <Download size={14} />
          </button>
          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-white border border-black/10 rounded-lg shadow-lg py-1 z-50">
            {(['md', 'txt', 'json'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleExport(f)}
                className="block w-full text-left px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 whitespace-nowrap"
              >
                导出为 .{f}
              </button>
            ))}
          </div>
        </div>

        <span className="ml-auto text-[11px] text-gray-350">
          v{version.version} / {versionCount}
        </span>
      </div>
    </div>
  )
}
