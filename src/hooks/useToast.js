import { useContext } from 'react'
import { ToastContext } from '../components/toastContext'

const noop = () => {}

/**
 * Returns `showToast(message, type)` where type is
 * 'success' | 'error' | 'warning' | 'info'. Safe outside the provider
 * (e.g. on the login page), where it does nothing.
 */
export function useToast() {
  return useContext(ToastContext) ?? noop
}
