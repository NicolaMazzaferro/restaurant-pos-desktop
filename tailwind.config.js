/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        pulseOnce: {
          "0%, 100%": {
            transform: "scale(1)",
            backgroundColor: "white",
          },
          "50%": {
            transform: "scale(1.05)",
            backgroundColor: "rgb(219 234 254)",
          },
        },
      },
      animation: {
        pulseOnce: "pulseOnce 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};

