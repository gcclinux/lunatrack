import { useState } from 'react'

interface PinEntryDialogProps {
  isOpen: boolean
  onSuccess: () => void
  onCancel?: () => void
  expectedPin: string
}

export function PinEntryDialog({ isOpen, onSuccess, onCancel, expectedPin }: PinEntryDialogProps) {
  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  if (!isOpen) return null

  const handleNumberClick = (num: string) => {
    if (enteredPin.length < 6) {
      const newPin = enteredPin + num
      setEnteredPin(newPin)
      setError('')
      
      // Auto-submit when reaching expected length
      if (newPin.length === expectedPin.length) {
        setTimeout(() => validatePin(newPin), 100)
      }
    }
  }

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setEnteredPin('')
    setError('')
  }

  const validatePin = (pin: string) => {
    if (pin === expectedPin) {
      setEnteredPin('')
      setError('')
      setAttempts(0)
      onSuccess()
    } else {
      setAttempts(prev => prev + 1)
      setError(`Incorrect PIN. Attempt ${attempts + 1}/3`)
      setEnteredPin('')
      
      if (attempts >= 2) {
        setError('Too many failed attempts.')
        setTimeout(() => {
          setAttempts(0)
          setError('')
          if (onCancel) onCancel()
        }, 2000)
      }
    }
  }

  const handleSubmit = () => {
    if (enteredPin.length >= 4) {
      validatePin(enteredPin)
    }
  }

  return (
  <div className="fixed inset-0 bg-white backdrop-blur-sm flex items-start justify-center z-10 p-0 pt-[5vh]">
      <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl shadow-2xl border border-rose-200 max-w-sm w-full mx-4 overflow-hidden relative">
        {/* Flower decoration */}
        <div className="absolute top-4 right-4 text-rose-300 opacity-60">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
          </svg>
        </div>
        
        <div className="px-3 pt-2 pb-2">
          <h3 className="text-base font-semibold text-rose-900 mb-1 text-center">Enter PIN</h3>
          <p className="text-xs text-rose-700 mb-2 text-center">Please enter your PIN to access the app</p>
          
          {/* PIN Display */}
          <div className="flex justify-center mb-2">
            <div className="flex gap-2">
              {Array.from({ length: Math.max(4, expectedPin.length) }, (_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < enteredPin.length 
                      ? 'bg-primary-500 border-primary-500' 
                      : 'bg-white border-rose-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center mb-2">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="aspect-square rounded-lg bg-white/80 border border-rose-200 text-lg font-semibold text-rose-900 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm active:scale-95"
                disabled={enteredPin.length >= 6}
              >
                {num}
              </button>
            ))}
            
            {/* Bottom Row */}
            <button
              onClick={handleClear}
              className="aspect-square rounded-lg bg-rose-200/50 border border-rose-300 text-xs font-medium text-rose-700 hover:bg-rose-200 transition-colors shadow-sm active:scale-95"
            >
              Clear
            </button>
            
            <button
              onClick={() => handleNumberClick('0')}
              className="aspect-square rounded-lg bg-white/80 border border-rose-200 text-lg font-semibold text-rose-900 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm active:scale-95"
              disabled={enteredPin.length >= 6}
            >
              0
            </button>
            
            <button
              onClick={handleBackspace}
              className="aspect-square rounded-lg bg-rose-200/50 border border-rose-300 text-xs font-medium text-rose-700 hover:bg-rose-200 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-1">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-rose-300 bg-white/80 text-rose-700 hover:bg-rose-50 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={enteredPin.length < 4}
              className="flex-1 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}