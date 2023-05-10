import path from 'path'

export default {
  test: {
    global: true,
    environment: 'jsdom',
    clearMocks: true,
    setupFiles: ['src/testing/setup.ts'],
  },
  resolve: {
    alias: {
      $: path.resolve(__dirname, './src/'),
    },
  },
}
