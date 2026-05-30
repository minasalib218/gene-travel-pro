module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: { brand: "#ff7a00" },
      boxShadow: { glass: "0 18px 45px rgba(0,0,0,0.55)" },
    },
  },
  plugins: [],
};
