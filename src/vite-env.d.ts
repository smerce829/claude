/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LICENSE_ENDPOINT?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
