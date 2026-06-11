import { useState, useCallback, useRef } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export function useConfirmDialog() {
  const [state, setState] = useState({ isOpen: false, title: '', message: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((title, message) => {
    setState({ isOpen: true, title, message })
    return new Promise(resolve => {
      resolveRef.current = resolve
    })
  }, [])

  function handleConfirm() {
    setState(s => ({ ...s, isOpen: false }))
    resolveRef.current?.(true)
  }

  function handleCancel() {
    setState(s => ({ ...s, isOpen: false }))
    resolveRef.current?.(false)
  }

  const confirmDialog = (
    <ConfirmDialog
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirmDialog, confirm }
}
