module.exports = {
  content: ['./src/**/*.{js,md,njk,svg,html}',
  "./node_modules/tw-elements/dist/js/**/*.js"],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-debug-screens'),
    require("tw-elements/dist/plugin")
  ],
  darkMode: 'class',
  theme: {
    container: {
      // padding: '1.5rem',
    },
    //debugScreens: {
    //  position: ['bottom', 'right'],
    //}, 
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {  color: theme('colors.lime.800'),
              '&:hover': {  color: theme('colors.lime.600') }
            }
            // ...
          },
        },
      }),
    },
  },
}
