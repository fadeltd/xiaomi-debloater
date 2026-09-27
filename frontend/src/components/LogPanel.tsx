import { useEffect, useRef } from 'react'

interface LogEntry {
  Timestamp: string
  Package: string
  Message: string
  Success: boolean
}

interface LogPanelProps {
  entries: LogEntry[]
  onClear: () => void
}

function LogPanel({ entries, onClear }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div className="border-t border-gray-700 bg-gray-800 flex flex-col" style={{ height: '150px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <span className="text-sm font-semibold">Operation Log</span>
        <button
          onClick={onClear}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
        >
          Clear
        </button>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-1 px-4 py-2"
      >
        {entries.length === 0 ? (
          <span className="text-gray-500">No operations yet...</span>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className={entry.Success ? 'text-green-400' : 'text-red-400'}>
              <span className="text-gray-500">[{entry.Timestamp}]</span>
              {entry.Package && <span className="ml-2 text-blue-400">{entry.Package}</span>}
              <span className="ml-2">{entry.Message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LogPanel
