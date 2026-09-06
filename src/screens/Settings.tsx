import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { Back } from '../components/Shell'
import { exportJSON } from '../lib/storage'
import type { State } from '../lib/types'
import './Settings.css'

/** Exactly two controls: export data as JSON, import data from JSON. Nothing else. */
export function Settings(
  { state, onImport, onBack }:
  { state: State; onImport: (text: string) => void; onBack: () => void },
) {
  const file = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([exportJSON(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => onImport(String(r.result))
    r.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="set__list">
        <button className="set__item" onClick={doExport}>
          <Download size={24} strokeWidth={2} aria-hidden="true" />
          <span>Export your data</span>
        </button>
        <button className="set__item" onClick={() => file.current?.click()}>
          <Upload size={24} strokeWidth={2} aria-hidden="true" />
          <span>Import your data</span>
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          onChange={doImport}
          hidden
          aria-label="Import your data"
        />
      </div>
    </div>
  )
}
