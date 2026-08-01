import { useStore } from '@/store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function VersionSlider() {
  const count = useStore(s => s.versionCount())
  const idx = useStore(s => s.selectedVersionIdx)
  const goPrev = useStore(s => s.goPrevVersion)
  const goNext = useStore(s => s.goNextVersion)

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={goPrev}
        disabled={idx <= 0}
        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        <ChevronLeft size={12} className="text-gray-500" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => useStore.setState({ selectedVersionIdx: i })}
            className={`rounded-full transition-all ${
              i === idx
                ? 'w-2.5 h-2.5 bg-blue-500'
                : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
            title={`版本 ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={goNext}
        disabled={idx >= count - 1}
        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        <ChevronRight size={12} className="text-gray-500" />
      </button>
    </div>
  )
}
