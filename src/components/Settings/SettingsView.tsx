import { useState } from 'react'
import { useStore } from '@/store'
import type { ApiProvider, ProviderModel } from '@/types'
import { ProviderType } from '@/types'
import { detectModels } from '@/services/providers'
import {
  X, Key, Plus, Trash2, RefreshCw, Eye, EyeOff,
  CheckCircle, XCircle, Cpu, Wifi, Globe, Server,
} from 'lucide-react'

// ===== 主面板 =====

export default function SettingsView({ onClose }: { onClose: () => void }) {
  const providers = useStore(s => s.providers)
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const [tab, setTab] = useState<'providers' | 'general'>('providers')
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-black/10 w-[640px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/5">
          <div className="flex items-center gap-4">
            <Key size={16} className="text-gray-400" />
            <h3 className="text-[14px] font-semibold text-gray-700">设置</h3>
            <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setTab('providers')}
                className={`px-2.5 py-1 text-[12px] rounded transition-colors ${tab === 'providers' ? 'bg-white shadow-sm text-gray-700 font-medium' : 'text-gray-400'}`}
              >
                API 提供商
              </button>
              <button
                onClick={() => setTab('general')}
                className={`px-2.5 py-1 text-[12px] rounded transition-colors ${tab === 'general' ? 'bg-white shadow-sm text-gray-700 font-medium' : 'text-gray-400'}`}
              >
                通用
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'providers' ? (
            <ProvidersTab showAdd={showAdd} setShowAdd={setShowAdd} />
          ) : (
            <GeneralTab settings={settings} updateSettings={updateSettings} />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 提供商 Tab =====

function ProvidersTab({ showAdd, setShowAdd }: { showAdd: boolean; setShowAdd: (v: boolean) => void }) {
  const providers = useStore(s => s.providers)
  const removeProvider = useStore(s => s.removeProvider)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">选择一个提供商，填 Key → 检测模型 → 选模型。支持 OpenAI 兼容 API（Ollama、DeepSeek 等均可接入）。</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-[12px] font-medium rounded-lg hover:bg-blue-600 transition-colors shrink-0 ml-3"
        >
          <Plus size={13} /> 添加
        </button>
      </div>

      {showAdd && <AddProviderForm onDone={() => setShowAdd(false)} />}

      <div className="space-y-3">
        {providers.map(p => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>
    </div>
  )
}

// ===== 单个提供商卡片 =====

function ProviderCard({ provider }: { provider: ApiProvider }) {
  const updateProvider = useStore(s => s.updateProvider)
  const removeProvider = useStore(s => s.removeProvider)
  const detectAndSetModels = useStore(s => s.detectAndSetModels)
  const activateProvider = useStore(s => s.activateProvider)

  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testOk, setTestOk] = useState(false)
  const [keyInput, setKeyInput] = useState(provider.apiKey)

  const typeLabel: Record<string, string> = {
    anthropic: 'Anthropic 原生',
    openai: 'OpenAI 原生',
    google: 'Google Gemini',
    'openai-compatible': 'OpenAI 兼容',
  }

  const typeIcons: Record<string, React.ReactNode> = {
    anthropic: <Globe size={13} />,
    openai: <Globe size={13} />,
    google: <Globe size={13} />,
    'openai-compatible': <Server size={13} />,
  }

  const handleDetect = async () => {
    setTesting(true)
    setTestMsg('')
    try {
      // 先保存 key
      updateProvider(provider.id, { apiKey: keyInput.trim() })
      await detectAndSetModels(provider.id)
      setTestOk(true)
      setTestMsg(`✅ 检测到 ${useStore.getState().providers.find(p => p.id === provider.id)?.models.length ?? 0} 个模型`)
    } catch (e) {
      setTestOk(false)
      setTestMsg(`❌ ${(e as Error).message}`)
    }
    setTesting(false)
  }

  // 重新读取（因为 detectAndSetModels 可能更新了）
  const currentProvider = useStore(s => s.providers.find(p => p.id === provider.id)) ?? provider

  return (
    <div className={`border rounded-xl p-4 transition-all ${
      currentProvider.enabled
        ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200'
        : 'border-black/10 bg-white'
    }`}>
      {/* 头部：名称 + 类型 + 启用按钮 */}
      <div className="flex items-center gap-3 mb-3">
        {currentProvider.enabled && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle size={11} /> 当前使用
          </span>
        )}
        <span className="text-[13px] font-semibold text-gray-700">{currentProvider.name}</span>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
          {typeIcons[currentProvider.type]}
          {typeLabel[currentProvider.type] ?? currentProvider.type}
        </span>
        <span className="text-[10px] text-gray-350 truncate ml-2 hidden sm:block">{currentProvider.baseUrl}</span>

        <div className="ml-auto flex items-center gap-1">
          {/* 启���按钮 */}
          {!currentProvider.enabled ? (
            <button
              onClick={() => {
                if (!currentProvider.selectedModel) {
                  alert('请先检测模型并选择一个模型')
                  return
                }
                activateProvider(currentProvider.id)
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-600 transition-colors shrink-0"
            >
              <CheckCircle size={12} /> 启用
            </button>
          ) : (
            <span className="text-[11px] text-blue-600 font-medium px-2">已启用</span>
          )}

          {/* 删除按钮（仅自定义） */}
          {!['Anthropic', 'OpenAI', 'Google Gemini', 'DeepSeek', '通义千问 (阿里)', 'Moonshot (月之暗面)', '智谱 GLM', '硅基流动 SiliconFlow'].includes(currentProvider.name) && (
            <button
              onClick={() => removeProvider(currentProvider.id)}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              title="删除"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Key 输入 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder={currentProvider.type === 'openai-compatible' ? 'API Key（Ollama 可留空）' : 'API Key'}
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-all pr-9"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          onClick={() => updateProvider(currentProvider.id, { apiKey: keyInput.trim() })}
          className="px-3 py-2 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          保存
        </button>
        <button
          onClick={handleDetect}
          disabled={testing}
          className="flex items-center gap-1 px-3 py-2 text-[11px] font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
          检测模型
        </button>
      </div>

      {/* 检测结果 */}
      {testMsg && (
        <div className={`flex items-center gap-1.5 text-[11px] mb-3 ${testOk ? 'text-green-600' : 'text-red-500'}`}>
          {testOk ? <CheckCircle size={11} /> : <XCircle size={11} />}
          {testMsg}
        </div>
      )}

      {/* 模型列表 */}
      {currentProvider.models.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentProvider.models.map(m => (
            <button
              key={m.id}
              onClick={() => updateProvider(currentProvider.id, { selectedModel: m.id })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                currentProvider.selectedModel === m.id
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Cpu size={10} />
              <span className="max-w-[200px] truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 空模型提示 */}
      {currentProvider.models.length === 0 && (
        <p className="text-[11px] text-gray-400">点击「检测模型」获取可用模型列表</p>
      )}
    </div>
  )
}

// ===== 添加自定义提供商 =====

function AddProviderForm({ onDone }: { onDone: () => void }) {
  const addCustomProvider = useStore(s => s.addCustomProvider)
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim()) { setError('请输入名称'); return }
    let url = baseUrl.trim()
    if (!url) { setError('请输入 API 端点地址'); return }
    // 自动补协议
    if (!url.startsWith('http')) url = 'https://' + url
    // 去掉末尾 /
    url = url.replace(/\/+$/, '')
    // 去掉 /v1 后缀（OpenAI 兼容 API 端点一般是 base url，不含 /v1，但用户可能带上了）
    // 不做强制处理，保留用户输入
    addCustomProvider(name.trim(), url)
    setName('')
    setBaseUrl('')
    setError('')
    onDone()
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-black/5 space-y-3">
      <p className="text-[12px] font-medium text-gray-600">添加自定义提供商</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="名称，如 我的 Ollama"
          className="flex-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400"
        />
        <input
          value={baseUrl}
          onChange={e => { setBaseUrl(e.target.value); setError('') }}
          placeholder="API 端点，如 http://localhost:11434/v1"
          className="flex-[2] px-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-blue-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white text-[12px] font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <p className="text-[11px] text-gray-400">支持任何 OpenAI 兼容 API（Ollama、vLLM、LocalAI 等）。输入端点地址即可自动检测可用模型。</p>
    </div>
  )
}

// ===== 通用设置 Tab =====

function GeneralTab({ settings, updateSettings }: {
  settings: ReturnType<typeof useStore.getState>['settings']
  updateSettings: (s: Partial<ReturnType<typeof useStore.getState>['settings']>) => void
}) {
  return (
    <div className="p-5 space-y-5">
      <section>
        <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">外观</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-600">主题</span>
            <select
              value={settings.theme}
              onChange={e => updateSettings({ theme: e.target.value as 'system' | 'light' | 'dark' })}
              className="text-[12px] border border-gray-200 rounded-md px-2 py-1 outline-none"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-600">字体大小</span>
            <select
              value={settings.fontSize}
              onChange={e => updateSettings({ fontSize: Number(e.target.value) })}
              className="text-[12px] border border-gray-200 rounded-md px-2 py-1 outline-none"
            >
              <option value="12">小 (12)</option>
              <option value="14">中 (14)</option>
              <option value="16">大 (16)</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">快捷键</h4>
        <div className="space-y-1.5">
          <ShortcutRow keys="Ctrl+Enter" desc="发送消息" />
          <ShortcutRow keys="Ctrl+N" desc="新建对话" />
          <ShortcutRow keys="Ctrl+Shift+C" desc="复制优化提示词" />
          <ShortcutRow keys="/" desc="快捷指令菜单" />
        </div>
      </section>
    </div>
  )
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-gray-600">{desc}</span>
      <kbd className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-500 font-mono">{keys}</kbd>
    </div>
  )
}
