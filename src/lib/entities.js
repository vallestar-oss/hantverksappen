// Form defaults and form → database mapping for customers and jobs.
// Empty optional fields are stored as null rather than empty strings.

const optional = value => value.trim() || null

export const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '', postal_code: '', city: '', notes: '' }

/** Form state → database columns (empty strings become null). */
export function customerPayload(form) {
  return {
    name: form.name.trim(),
    phone: optional(form.phone),
    email: optional(form.email),
    address: optional(form.address),
    postal_code: optional(form.postal_code),
    city: optional(form.city),
    notes: optional(form.notes),
  }
}

export const EMPTY_JOB = { title: '', customer_id: '', description: '', scheduled_date: '', scheduled_time: '', notes: '' }

/** Form state → database columns (empty strings become null). */
export function jobPayload(form) {
  return {
    title: form.title.trim(),
    customer_id: form.customer_id,
    description: form.description.trim() || null,
    scheduled_date: form.scheduled_date || null,
    scheduled_time: form.scheduled_time || null,
    notes: form.notes.trim() || null,
  }
}
