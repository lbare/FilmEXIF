import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'orange',
  primaryShade: { light: 7, dark: 6 },
  defaultRadius: 'md',
  cursorType: 'pointer',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"',
  headings: { fontWeight: '700' },
  components: {
    Card: { defaultProps: { withBorder: true, radius: 'lg' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Modal: { defaultProps: { radius: 'lg', centered: true } },
    Drawer: { defaultProps: { radius: 'lg' } },
  },
})
