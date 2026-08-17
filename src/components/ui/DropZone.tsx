import { useRef, useState, type ReactNode } from 'react'
import { Upload } from 'lucide-react'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  children?: ReactNode
  className?: string
  compact?: boolean
}

export default function DropZone({
  onFiles,
  accept = 'image/*',
  multiple = false,
  label = '拖放或點擊上傳',
  hint,
  children,
  className = '',
  compact = false,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handle = (list: FileList | null) => {
    if (!list?.length) return
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || accept === '*/*')
    if (files.length) onFiles(multiple ? files : [files[0]])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handle(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border border-dashed transition-colors text-center ${
        compact ? 'p-4' : 'p-6'
      } ${
        dragging
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
      } ${className}`}
    >
      {children ?? (
        <>
          <Upload className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} mx-auto text-slate-500 mb-2`} />
          <p className="text-xs text-slate-400">{label}</p>
          {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
