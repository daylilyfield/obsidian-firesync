import path from 'path'

export default {
  test: {
    global: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      $: path.resolve(__dirname, './src/'),
    },
  },
}
