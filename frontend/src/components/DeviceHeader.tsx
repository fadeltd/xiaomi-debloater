import { main } from '../../wailsjs/go/models.js'

interface DeviceHeaderProps {
  devices: main.Device[]
  selectedSerial: string
  onSelectDevice: (serial: string) => void
  deviceInfo: Record<string, string>
  onRefresh: () => void
  isLoading: boolean
}

function DeviceHeader({
  devices,
  selectedSerial,
  onSelectDevice,
  deviceInfo,
  onRefresh,
  isLoading,
}: DeviceHeaderProps) {
  const activeDevice = devices.find((d) => d.serial === selectedSerial)

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-gray-400">No device connected</div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Device Selector and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {devices.length > 1 ? (
            <select
              value={selectedSerial}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              {devices.map((d) => (
                <option key={d.serial} value={d.serial}>
                  {d.model || d.product || d.serial} ({d.serial})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-lg font-semibold">{activeDevice.model || activeDevice.product}</span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
        >
          {isLoading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Device Info */}
      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
        <div>
          <span className="text-gray-500">Model:</span> {deviceInfo.model || activeDevice.model || 'Unknown'}
        </div>
        <div>
          <span className="text-gray-500">Serial:</span> {selectedSerial}
        </div>
        <div>
          {deviceInfo.hyperos ? (
            <>
              <span className="text-gray-500">HyperOS:</span> {deviceInfo.hyperos}
            </>
          ) : (
            <>
              <span className="text-gray-500">MIUI:</span> {deviceInfo.miui_version || 'Unknown'}
            </>
          )}
        </div>
        <div>
          <span className="text-gray-500">Android:</span> {deviceInfo.android || 'Unknown'}
        </div>
      </div>
    </div>
  )
}

export default DeviceHeader
