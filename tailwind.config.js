import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"SF Pro Display"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Cascadia Code"', 'monospace'],
      },
      colors: {
        // macOS-inspired palette
        sidebar: {
          bg: 'rgba(246, 246, 248, 0.85)',
          border: 'rgba(0, 0, 0, 0.08)',
        },
        chat: {
          user: 'rgba(0, 122, 255, 0.06)',
          assistant: 'rgba(0, 0, 0, 0.03)',
        },
        // 补充 Tailwind 缺失的中性灰阶（代码里多处用到 gray-350）
        gray: {
          350: '#a1a1a6',
        },
      },
      backdropBlur: {
        sidebar: '20px',
      },
      borderRadius: {
        mac: '10px',
      },
      boxShadow: {
        mac: '0 0 0 0.5px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'mac-input': '0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'panel': '0 0 0 0.5px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
