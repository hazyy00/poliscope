import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        iv:  '#F5F5F3',
        ivd: '#ECEAE6',
        bk:  '#1B1B1B',
        pu:  '#4A3F8F',
        pul: '#6B5FBB',
        t1:  '#111111',
        t2:  '#6F6F6F',
        t3:  '#9B9B9B',
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
