import { useContext } from 'react'
import { AuthContext } from '../context/authState'

/** Current session: `{ user, loading }`. `user` is null when signed out. */
export function useAuth() {
  return useContext(AuthContext)
}
