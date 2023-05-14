export type Settings = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  email: string
  password: string
  sync: boolean
  internal: boolean
  debug: boolean
  ignores: string
  debounce: number
  concurrency: number
}

export const defaultSettings: Settings = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  email: '',
  password: '',
  sync: false,
  internal: false,
  debug: false,
  ignores: '',
  debounce: 3000,
  concurrency: 6,
}
