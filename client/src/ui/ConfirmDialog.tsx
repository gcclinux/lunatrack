interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full mx-4 overflow-hidden relative">
        {/* Flower decoration */}
        <div className="absolute top-4 right-4 text-rose-300 opacity-60">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
          </svg>
        </div>
        {/* Flower decoration - bottom left */}
        <div className="absolute bottom-4 left-4 text-rose-300 opacity-60">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
          </svg>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-rose-900 mb-3 text-center">{title}</h3>
          <p className="text-rose-800 mb-6 whitespace-pre-line leading-relaxed text-center">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-rose-300 bg-white/80 text-rose-700 hover:bg-rose-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}