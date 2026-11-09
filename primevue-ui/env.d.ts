/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIMEUI_LICENSE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
