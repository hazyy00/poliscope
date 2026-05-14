import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        iv:  '#F2EDE4',
        ivd: '#E8E1D5',
        bk:  '#0F0F0D',
        pu:  '#4A3F8F',
        pul: '#6B5FBB',
        t1:  '#1A1916',
        t2:  '#5A554A',
        t3:  '#8A8478',
      },
      fontFamily: {
        sans:  ['Noto Sans KR', 'sans-serif'],
        serif: ['Noto Serif KR', 'serif'],
        fell:  ['IM Fell English', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
