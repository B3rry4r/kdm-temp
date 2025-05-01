import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        "max-sm": {
          'max': "639px",
        },
        "max-md": {
          'max': "767px",
        },
        "max-lg": {
          'max': "1023px",
        },
        "max-xl": {
          'max': "1279px",
        },
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
} satisfies Config;
