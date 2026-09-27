import { useState } from 'react'
import { main } from '../../wailsjs/go/models.js'
import PackageRow from './PackageRow'
import ConfirmDialog from './ConfirmDialog'

interface PackageListProps {
  packages: main.AppPackage[]
  searchText: string
  activeCategory: string
  selectedSerial: string
  onAddLog: (pkgName: string, message: string, success: boolean) => void
  onRefresh: () => void
  isLoading: boolean
}

function PackageList({
  packages,
  searchText,
  activeCategory,
  selectedSerial,
  onAddLog,
  onRefresh,
  isLoading,
}: PackageListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  // Filter packages
  const filtered = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchText.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchText.toLowerCase())

    const matchesCategory = activeCategory === 'All' ||
      (activeCategory === 'Disabled' && pkg.is_installed && !pkg.is_enabled) ||
      (activeCategory === 'Removed' && !pkg.is_installed) ||
      pkg.category === activeCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  // Sort by name
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  const toggleSelect = (name: string) => {
    const newSet = new Set(selected)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setSelected(newSet)
  }

  const toggleAllSelect = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((p) => p.name)))
    }
  }

  // Re-read package state from the device so enabled/disabled status and buttons stay accurate
  // Only installed packages can be bulk-uninstalled
  const selectedInstalled = packages.filter((p) => selected.has(p.name) && p.is_installed)
  const selectedDangerCount = selectedInstalled.filter((p) => p.risk === 'danger').length

  const handlePackageUpdated = () => {
    onRefresh()
  }

  if (!selectedSerial) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400">No device selected. Connect a device to see packages.</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400">Loading packages...</span>
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400">No packages found.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bg-blue-900 border-b border-blue-700 px-4 py-2 flex items-center justify-between">
          <span className="text-sm">{selected.size} selected</span>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Remove Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left w-12">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === sorted.length}
                  onChange={toggleAllSelect}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-2 text-left">Package Name</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Risk</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pkg) => (
              <PackageRow
                key={pkg.name}
                pkg={pkg}
                serial={selectedSerial}
                isSelected={selected.has(pkg.name)}
                onToggleSelect={toggleSelect}
                onAddLog={onAddLog}
                onPackageUpdated={handlePackageUpdated}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Confirm Bulk Uninstall"
          message={
            `Uninstall ${selectedInstalled.length} package(s) for the current user? You can restore them from the Removed tab.` +
            (selectedDangerCount > 0
              ? ` WARNING: ${selectedDangerCount} of them are marked danger and can break calls, SIM, Settings or booting.`
              : '')
          }
          selectedPackages={selectedInstalled.map((p) => p.name)}
          serial={selectedSerial}
          onConfirm={() => {
            setShowConfirm(false)
            setSelected(new Set())
            handlePackageUpdated()
          }}
          onCancel={() => setShowConfirm(false)}
          onAddLog={onAddLog}
        />
      )}
    </div>
  )
}

export default PackageList
