import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"



/*
"50": "#FFE5EA",
      "100": "#FFB8C4",
      "200": "#FF8A9E",
      "300": "#FF5C78",
      "400": "#FF2E52",
      "500": "#FF002C",
      "600": "#CC0024",
      "700": "#99001B",
      "800": "#660012",
      "900": "#330009"
      */

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        riot: {
          DEFAULT: { value: "#FF002C" },
          50: { value: "#FFE5EA" },
          100: { value: "#FFB8C4" },
          200: { value: "#FF8A9E" },
          300: { value: "#FF5C78" },
          400: { value: "#FF2E52" },
          500: { value: "#FF002C" },
          600: { value: "#CC0024" },
          700: { value: "#99001B" },
          800: { value: "#660012" },
          900: { value: "#330009" },
        }
      },
      fonts: {
        body: { value: "system-ui, sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        riot: {
          solid: { value: {_light: "{colors.riot.500}", _dark: "{colors.riot.400}"} },
          contrast: { value: {_light: "{colors.riot.100}", _dark: "{colors.white}"} },
          fg: { value: {_light: "{colors.riot.700}", _dark: "{colors.riot.200}"} },
          muted: { value: {_light: "{colors.riot.100}", _dark: "{colors.riot.900}"} },
          subtle: { value: {_light: "{colors.riot.200}", _dark: "{colors.riot.800}"} },
          emphasized: { value: {_light: "{colors.riot.300}", _dark: "{colors.riot.700}"} },
          focusRing: { value: {_light: "{colors.riot.500}", _dark: "{colors.riot.400}"} },
        }
      }
    }
  },
})

export const system = createSystem(defaultConfig, config)