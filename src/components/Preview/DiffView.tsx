import { useState } from 'react'
import type { PromptVersion, DiffLine } from '@/types'
import { PlusCircle, MinusCircle, Pencil } from 'lucide-react'

export default function DiffView({ version }: { version: PromptVersion }) {
  const [onlyChanges, setOnlyChanges] = useState(false)

  const filtered = onlyChanges
    ? version.diffLines.filter(l => l.type !== 'unchanged')
    : version.diffLines

  return (
    <div className="flex flex-col h-full">
      {/* 筛选 */}
      <div className="flex items-center gap-4 px-3 py-1.5">
        <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={e => setOnlyChanges(e.target.checked)}
            className="w-3 h-3 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          仅显示变更
        </label>
        <div className="flex items-center gap-3 ml-auto">
          <LegendItem color="bg-green-500" label="新增" />
          <LegendItem color="bg-yellow-500" label="修改" />
          <LegendItem color="bg-red-500" label="删除" />
        </div>
      </div>

      {/* Diff 行列表 */}
      <div className="flex-1 overflow-y-auto font-mono text-[12px] leading-relaxed">
        {filtered.map(line => (
          <DiffRow key={line.id} line={line} />
        ))}
      </div>
    </div>
  )
}

function DiffRow({ line }: { line: DiffLine }) {
  const bg = {
    added: 'bg-green-50/60',
    modified: 'bg-yellow-50/60',
    removed: 'bg-red-50/60',
    unchanged: '',
  }[line.type]

  const border = {
    added: 'border-l-2 border-green-400',
    modified: 'border-l-2 border-yellow-400',
    removed: 'border-l-2 border-red-400',
    unchanged: 'border-l-2 border-transparent',
  }[line.type]

  const icon = {
    added: <PlusCircle size={12} className="text-green-500 shrink-0 mt-0.5" />,
    modified: <Pencil size={12} className="text-yellow-600 shrink-0 mt-0.5" />,
    removed: <MinusCircle size={12} className="text-red-500 shrink-0 mt-0.5" />,
    unchanged: <span className="w-3 shrink-0" />,
  }[line.type]

  return (
    <div className={`flex items-start gap-2 px-3 py-[3px] ${bg} ${border}`}>
      {icon}
      <span className={`whitespace-pre-wrap break-all ${
        line.type === 'removed' ? 'text-red-400 line-through' :
        line.type === 'unchanged' ? 'text-gray-350' :
        'text-gray-700'
      }`}>
        {line.text || ' '}
      </span>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-400">
      <span className={`w-2 h-2 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
