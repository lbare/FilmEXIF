import { useMediaQuery } from '@mantine/hooks'

/** Phone-sized viewport. Read synchronously so modals don't flash between layouts. */
export const useIsMobile = () =>
  useMediaQuery('(max-width: 47.99em)', window.matchMedia('(max-width: 47.99em)').matches, {
    getInitialValueInEffect: false,
  })
