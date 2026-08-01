import type { DiffLine } from '@/types'

/**
 * LCS 行级文本对比引擎
 * 比较原始提示词和优化提示词，标记每行的变更类型
 */
function lcs(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  const result: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.unshift(a[i - 1]); i--; j-- }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--
    else j--
  }
  return result
}

export function computeDiff(original: string, optimized: string): DiffLine[] {
  const origLines = original.split('\n')
  const optLines = optimized.split('\n')
  const lcsLines = lcs(origLines, optLines)

  const result: DiffLine[] = []
  let oi = 0, pi = 0, li = 0, ln = 0
  let id = 0

  while (oi < origLines.length || pi < optLines.length) {
    if (li < lcsLines.length && oi < origLines.length && pi < optLines.length) {
      if (origLines[oi] === lcsLines[li] && optLines[pi] === lcsLines[li]) {
        result.push({ id: `d${id++}`, type: 'unchanged', text: optLines[pi], lineNum: ln })
        oi++; pi++; li++
      } else if (origLines[oi] !== lcsLines[li] && optLines[pi] === lcsLines[li]) {
        result.push({ id: `d${id++}`, type: 'removed', text: origLines[oi], lineNum: ln })
        oi++
      } else if (origLines[oi] === lcsLines[li] && optLines[pi] !== lcsLines[li]) {
        result.push({ id: `d${id++}`, type: 'added', text: optLines[pi], lineNum: ln })
        pi++
      } else {
        result.push({ id: `d${id++}`, type: 'modified', text: optLines[pi], lineNum: ln })
        oi++; pi++
      }
      ln++
    } else {
      while (oi < origLines.length) {
        result.push({ id: `d${id++}`, type: 'removed', text: origLines[oi], lineNum: ln++ })
        oi++
      }
      while (pi < optLines.length) {
        result.push({ id: `d${id++}`, type: 'added', text: optLines[pi], lineNum: ln++ })
        pi++
      }
    }
  }

  return result
}
