import { useState, useEffect, type CSSProperties } from 'react'
import { CheckADB, GetListInfo, UpdateList } from '../../wailsjs/go/main/App.js'
import { BrowserOpenURL, Environment } from '../../wailsjs/runtime/runtime.js'
import { main } from '../../wailsjs/go/models.js'

interface StatusBarProps {
  devices: main.Device[]
  onListUpdated: () => void
}

function StatusBar({ devices, onListUpdated }: StatusBarProps) {
  const [adbStatus, setAdbStatus] = useState<string>('')
  const [adbError, setAdbError] = useState<string>('')
  const [isMac, setIsMac] = useState(false)
  const [listInfo, setListInfo] = useState<main.ListInfo | null>(null)
  const [listStatus, setListStatus] = useState('')

  // Pull the latest package list so new MIUI/HyperOS packages are recognised
  const updateList = async () => {
    setListStatus('Checking...')
    try {
      const before = listInfo?.version ?? (await GetListInfo()).version
      const info = await UpdateList()
      setListInfo(info)
      if (info.version !== before) {
        setListStatus('Updated')
        onListUpdated()
      } else {
        setListStatus('Up to date')
      }
    } catch (err) {
      setListStatus('Update failed')
      console.error(err)
    }
  }

  useEffect(() => {
    GetListInfo().then(setListInfo)
    updateList()
  }, [])

  useEffect(() => {
    Environment().then((env) => setIsMac(env.platform === 'darwin'))
  }, [])

  useEffect(() => {
    const checkAdb = async () => {
      try {
        const version = await CheckADB()
        setAdbStatus(version)
        setAdbError('')
      } catch (err) {
        setAdbStatus('')
        setAdbError(String(err))
      }
    }

    checkAdb()
  }, [])

  const connectedCount = devices.filter((d) => d.state === 'device').length

  return (
    // On macOS, h-13 and pl-24 line up with and clear the traffic-light buttons (hidden-inset title bar); the bar doubles as the window drag handle
    <div
      className={`flex items-center justify-between bg-gray-800 border-b border-gray-700 pr-4 text-sm ${isMac ? 'h-13 pl-24' : 'h-10 pl-4'}`}
      style={{ '--wails-draggable': 'drag' } as CSSProperties}
    >
      <div className="flex items-center gap-4">
        {/* ADB Status */}
        <div className="flex items-center gap-2">
          {adbError ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400">ADB not found</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">{adbStatus || 'ADB ready'}</span>
            </>
          )}
        </div>

        {/* Device Count */}
        <div className="flex items-center gap-2 text-gray-400">
          <span>|</span>
          <span>Devices: {connectedCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        {listInfo && (
          <span title={`Package list source: ${listInfo.source}`}>
            List {listInfo.version} · {listInfo.count} packages
          </span>
        )}
        <button
          onClick={updateList}
          className="text-blue-400 hover:text-blue-300"
          title={listStatus}
        >
          {listStatus === 'Checking...' ? 'Checking...' : 'Update list'}
        </button>
        {adbError && (
          <button
            onClick={() => BrowserOpenURL('https://developer.android.com/tools/releases/platform-tools')}
            className="text-blue-400 hover:text-blue-300"
            title={adbError}
          >
            Install ADB →
          </button>
        )}
      </div>
    </div>
  )
}

export default StatusBar
