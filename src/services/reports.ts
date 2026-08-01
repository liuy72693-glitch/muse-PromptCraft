// ===== 工作报告系统 =====
// Muse 每次完成任务后自动生成 50-100 字的工作摘要

export interface WorkReport {
  id: string
  assistant: 'muse'
  summary: string
  timestamp: number
  conversationId: string
}

const REPORTS_KEY = 'pc_work_reports'

export function loadReports(limit = 20): WorkReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    const all: WorkReport[] = raw ? JSON.parse(raw) : []
    return all.slice(0, limit)
  } catch { return [] }
}

export function saveReport(report: WorkReport) {
  const all = loadReports(100)
  all.unshift(report)
  // 只保留最近 100 条
  if (all.length > 100) all.length = 100
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all))
}
