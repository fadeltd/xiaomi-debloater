import { UninstallPackage } from '../../wailsjs/go/main/App.js'

interface ConfirmDialogProps {
  title: string
  message: string
  selectedPackages: string[]
  serial: string
  onConfirm: () => void
  onCancel: () => void
  onAddLog: (pkgName: string, message: string, success: boolean) => void
}

function ConfirmDialog({
  title,
  message,
  selectedPackages,
  serial,
  onConfirm,
  onCancel,
  onAddLog,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    for (const pkg of selectedPackages) {
      try {
        const result = await UninstallPackage(serial, pkg)
        onAddLog(pkg, result.message, result.success)
      } catch (err) {
        onAddLog(pkg, `Failed: ${err}`, false)
      }
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-300">{message}</p>
          <div className="bg-gray-900 rounded p-3 max-h-40 overflow-y-auto">
            <ul className="space-y-1 text-xs font-mono text-gray-400">
              {selectedPackages.map((pkg) => (
                <li key={pkg}>• {pkg}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Uninstall
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
