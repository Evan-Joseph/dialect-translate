/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 传统文化色彩主题
        traditional: {
          // 朱红色系
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#dc2626', // 朱红
            600: '#b91c1c',
            700: '#991b1b',
            800: '#7f1d1d',
            900: '#7c2d12',
          },
          // 墨绿色系
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#16a34a', // 墨绿
            600: '#15803d',
            700: '#166534',
            800: '#14532d',
            900: '#052e16',
          },
          // 金黄色系
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b', // 金黄
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          // 墨蓝色系
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#1e40af', // 墨蓝
            600: '#1d4ed8',
            700: '#1e3a8a',
            800: '#1e3a8a',
            900: '#1e3a8a',
          },
          // 古铜色系
          bronze: {
            50: '#fdf8f6',
            100: '#f2e8e5',
            200: '#eaddd7',
            300: '#e0cfc5',
            400: '#d2bab0',
            500: '#a16207', // 古铜
            600: '#92400e',
            700: '#78350f',
            800: '#451a03',
            900: '#292524',
          },
        },
      },
      fontFamily: {
        // 添加中文字体
        'chinese': ['"Noto Sans SC"', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
