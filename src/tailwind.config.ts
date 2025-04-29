import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        "max-sm": {
          'max': "639px",
        },
      },
    },
  },
} satisfies Config;
