import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/** Customers as `{ id, name }` options for a picker, sorted by name. */
export function useCustomerOptions(userId) {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', userId)
      .order('name')
      .then(({ data, error: err }) => {
        if (!active) return
        setCustomers(data ?? [])
        setError(Boolean(err))
      })
    return () => { active = false }
  }, [userId])

  return { customers, error }
}
