import { useState } from 'react'
import { main } from '../../wailsjs/go/models.js'
import {
  UninstallPackage,
  DisablePackage,
  EnablePackage,
  ReinstallPackage,
} from '../../wailsjs/go/main/App.js'

interface PackageRowProps {
  pkg: main.AppPackage
  serial: string
  isSelected: boolean
  onToggleSelect: (name: string) => void
  onAddLog: (pkgName: string, message: string, success: boolean) => void
  onPackageUpdated: () => void
}

function PackageRow({
  pkg,
  serial,
  isSelected,
  onToggleSelect,
  onAddLog,
  onPackageUpdated,
}: PackageRowProps) {
  // Risky actions on "danger" packages need a second click to confirm
  const [armed, setArmed] = useState<'disable' | 'uninstall' | null>(null)
  const getRiskBadgeColor = () => {
    switch (pkg.risk) {
      case 'safe':
        return 'bg-green-900 text-green-200'
      case 'caution':
        return 'bg-yellow-900 text-yellow-200'
      case 'danger':
        return 'bg-red-900 text-red-200'
      default:
        return 'bg-gray-700 text-gray-200'
    }
  }

  const getCategoryColor = () => {
    switch (pkg.category) {
      case 'bloatware':
        return 'bg-purple-900 text-purple-200'
      case 'oem':
        return 'bg-blue-900 text-blue-200'
      case 'system':
        return 'bg-orange-900 text-orange-200'
      case 'user':
        return 'bg-gray-700 text-gray-200'
      default:
        return 'bg-gray-700 text-gray-200'
    }
  }

  const handleAction = async (action: 'disable' | 'uninstall' | 'enable' | 'restore') => {
    if (pkg.risk === 'danger' && (action === 'disable' || action === 'uninstall') && armed !== action) {
      setArmed(action)
      return
    }
    setArmed(null)

    let result: main.ActionResult | null = null

    try {
      switch (action) {
        case 'disable':
          result = await DisablePackage(serial, pkg.name)
          break
        case 'uninstall':
          result = await UninstallPackage(serial, pkg.name)
          break
        case 'enable':
          result = await EnablePackage(serial, pkg.name)
          break
        case 'restore':
          result = await ReinstallPackage(serial, pkg.name)
          break
      }

      if (result) {
        onAddLog(pkg.name, result.message, result.success)
        if (result.success) {
          onPackageUpdated()
        }
      }
    } catch (err) {
      onAddLog(pkg.name, `Action failed: ${err}`, false)
    }
  }

  const shouldShowDisable = pkg.is_installed && pkg.is_enabled
  const shouldShowUninstall = pkg.is_installed
  const shouldShowEnable = pkg.is_installed && !pkg.is_enabled
  const shouldShowRestore = !pkg.is_installed

  return (
    <tr className="border-t border-gray-700 hover:bg-gray-800 transition-colors">
      <td className="px-4 py-2 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(pkg.name)}
          className="rounded"
        />
      </td>
      <td className="px-4 py-2 font-mono text-xs text-gray-400 max-w-xs truncate" title={pkg.name}>
        {pkg.name}
        {!pkg.is_installed && <span className="ml-2 text-gray-500">(removed)</span>}
        {pkg.is_installed && !pkg.is_enabled && <span className="ml-2 text-gray-500">(disabled)</span>}
      </td>
      <td className="px-4 py-2 text-sm text-gray-400 flex-1">{pkg.description}</td>
      <td className="px-4 py-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor()}`}>
          {pkg.category}
        </span>
      </td>
      <td className="px-4 py-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor()}`}>
          {pkg.risk}
        </span>
      </td>
      <td className="px-4 py-2 flex gap-2 justify-end">
        {shouldShowDisable && (
          <button
            onClick={() => handleAction('disable')}
            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
          >
            {armed === 'disable' ? 'Confirm disable?' : 'Disable'}
          </button>
        )}
        {shouldShowUninstall && (
          <button
            onClick={() => handleAction('uninstall')}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            {armed === 'uninstall' ? 'Confirm uninstall?' : 'Uninstall'}
          </button>
        )}
        {shouldShowEnable && (
          <button
            onClick={() => handleAction('enable')}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Enable
          </button>
        )}
        {shouldShowRestore && (
          <button
            onClick={() => handleAction('restore')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Restore
          </button>
        )}
      </td>
    </tr>
  )
}

export default PackageRow
