import defaultColors from "tailwindcss/colors";

// Dashboard design system (Starbucks-inspired): emerald/teal are remapped to the four-tier brand green.
// Accent #00754A = CTAs, Starbucks #006241 = headings, Uplift #2b5148, House #1E3932 = deep bands.
const brandGreen = {
  50: "#f3f9f6", 100: "#d4e9e2", 200: "#b3d7ca", 300: "#7fb9a4", 400: "#33a37b",
  500: "#00754A", 600: "#006241", 700: "#2b5148", 800: "#1E3932", 900: "#15291f", 950: "#0d1a14",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        berkshire: ['"Berkshire Swash"', "cursive"],
        bellota: ["Bellota", "cursive"],
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        emerald: brandGreen,
        teal: brandGreen,
        // original Tailwind greens, kept for the public landing site
        lemerald: defaultColors.emerald,
        lteal: defaultColors.teal,
        canvas: "#f2f0eb",
        ceramic: "#edebe9",
        cream: "#FDF5C9",
        "light-mint": "#C2F2D0",
        "mango-orange": "#FB923C",
        "primary-green": "#15803d",
        "secondary-green": "#8cc23d",
        "glass-white": "rgba(255, 255, 255, 0.2)",
        "glass-border": "rgba(255, 255, 255, 0.3)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #dcfce7 0%, #fef3c7 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}