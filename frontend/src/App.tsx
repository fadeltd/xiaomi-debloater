import { useState, useEffect } from 'react'
import { GetDevices, GetPackages, GetDeviceInfo } from '../wailsjs/go/main/App.js'
import { main } from '../wailsjs/go/models.js'

type Device = main.Device
type AppPackage = main.AppPackage

interface LogEntry {
  Timestamp: string
  Package: string
  Message: string
  Success: boolean
}
import StatusBar from './components/StatusBar'
import DeviceHeader from './components/DeviceHeader'
import FilterBar from './components/FilterBar'
import PackageList from './components/PackageList'
import LogPanel from './components/LogPanel'
import Guide from './components/Guide'

function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedSerial, setSelectedSerial] = useState<string>('')
  const [packages, setPackages] = useState<AppPackage[]>([])
  const [deviceInfo, setDeviceInfo] = useState<Record<string, string>>({})
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [view, setView] = useState<'packages' | 'guide'>('packages')
  // Bumped when a newer package list is downloaded so packages get re-classified
  const [listRevision, setListRevision] = useState(0)

  // Fetch connected devices
  const refreshDevices = async () => {
    try {
      const devs = (await GetDevices()) ?? []
      setDevices(devs)
      // Keep the current selection while it is still connected; otherwise pick the first ready device.
      // Functional update avoids the stale selectedSerial captured by the polling interval.
      setSelectedSerial((prev) => {
        if (prev && devs.some((d) => d.serial === prev)) return prev
        const ready = devs.find((d) => d.state === 'device')
        return ready ? ready.serial : ''
      })
    } catch (err) {
      addLog('', `Failed to get devices: ${err}`, false)
    }
  }

  // Fetch packages for selected device
  const refreshPackages = async () => {
    if (!selectedSerial) return

    setLoading(true)
    try {
      const pkgs = (await GetPackages(selectedSerial)) ?? []
      setPackages(pkgs)
      addLog('', 'Packages refreshed', true)
    } catch (err) {
      addLog('', `Failed to get packages: ${err}`, false)
    } finally {
      setLoading(false)
    }
  }

  // Fetch device info
  const loadDeviceInfo = async () => {
    if (!selectedSerial) return

    try {
      const info = await GetDeviceInfo(selectedSerial)
      setDeviceInfo(info)
    } catch (err) {
      addLog('', `Failed to get device info: ${err}`, false)
    }
  }

  // Add log entry
  const addLog = (packageName: string, message: string, success: boolean) => {
    const entry: LogEntry = {
      Timestamp: new Date().toLocaleTimeString(),
      Package: packageName,
      Message: message,
      Success: success,
    }
    setLogEntries((prev) => [...prev, entry])
  }

  // Clear log
  const clearLog = () => {
    setLogEntries([])
  }

  // Initial device detection
  useEffect(() => {
    refreshDevices()
    const interval = setInterval(refreshDevices, 3000)
    return () => clearInterval(interval)
  }, [])

  // Load packages and device info when device changes
  useEffect(() => {
    if (selectedSerial) {
      loadDeviceInfo()
      refreshPackages()
    } else {
      setPackages([])
      setDeviceInfo({})
    }
  }, [selectedSerial, listRevision])

  return (
    <div className="dark bg-gray-900 text-gray-100 h-screen flex flex-col">
      {/* Status Bar */}
      <StatusBar devices={devices} onListUpdated={() => setListRevision((r) => r + 1)} />

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-gray-700 px-4 pt-2">
        {(['packages', 'guide'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 -mb-px ${
              view === v
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {v === 'packages' ? 'Packages' : 'Guide'}
          </button>
        ))}
      </div>

      {view === 'guide' ? (
        <div className="flex-1 overflow-y-auto">
          <Guide />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-700 p-4">
            <DeviceHeader
              devices={devices}
              selectedSerial={selectedSerial}
              onSelectDevice={setSelectedSerial}
              deviceInfo={deviceInfo}
              onRefresh={() => {
                refreshDevices()
                refreshPackages()
              }}
              isLoading={loading}
            />
          </div>

          {/* Filter Bar */}
          <div className="border-b border-gray-700 p-3">
            <FilterBar
              searchText={searchText}
              activeCategory={activeCategory}
              onSearchChange={setSearchText}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Package List */}
          <div className="flex-1 overflow-hidden">
            <PackageList
              packages={packages}
              searchText={searchText}
              activeCategory={activeCategory}
              selectedSerial={selectedSerial}
              onAddLog={addLog}
              onRefresh={refreshPackages}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {/* Log Panel */}
      <LogPanel entries={logEntries} onClear={clearLog} />
    </div>
  )
}

export default App
