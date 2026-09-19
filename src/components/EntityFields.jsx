import { Card, Field, inputClass } from './FormField'

// Field groups shared by the "new" and "edit" pages of customers and jobs.
// `form` is the local state object and `onChange` a standard input change handler.
// Form defaults and payload mapping live in lib/entities.js.

export function CustomerFields({ form, onChange }) {
  return (
    <Card className="space-y-5">
      <Field label="Namn *">
        <input name="name" type="text" autoComplete="off" value={form.name} onChange={onChange}
          placeholder="Anna Andersson" className={inputClass} />
      </Field>
      <Field label="Telefon">
        <input name="phone" type="tel" value={form.phone} onChange={onChange}
          placeholder="070-123 45 67" className={inputClass} />
      </Field>
      <Field label="E-post">
        <input name="email" type="email" value={form.email} onChange={onChange}
          placeholder="anna@exempel.se" className={inputClass} />
      </Field>
      <Field label="Adress">
        <input name="address" type="text" value={form.address} onChange={onChange}
          placeholder="Storgatan 1" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postnummer">
          <input name="postal_code" type="text" inputMode="numeric" value={form.postal_code} onChange={onChange}
            placeholder="123 45" className={inputClass} />
        </Field>
        <Field label="Stad">
          <input name="city" type="text" value={form.city} onChange={onChange}
            placeholder="Stockholm" className={inputClass} />
        </Field>
      </div>
      <Field label="Anteckningar">
        <textarea name="notes" rows={3} value={form.notes} onChange={onChange}
          placeholder="Övriga anteckningar…" className={`${inputClass} resize-none`} />
      </Field>
    </Card>
  )
}

export function JobFields({ form, onChange, customers }) {
  return (
    <Card className="space-y-5">
      <Field label="Titel *">
        <input name="title" type="text" value={form.title} onChange={onChange}
          placeholder="Badrumsrenovering" className={inputClass} />
      </Field>
      <Field label="Kund *">
        <select name="customer_id" value={form.customer_id} onChange={onChange} className={inputClass}>
          <option value="">Välj kund</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Beskrivning">
        <textarea name="description" rows={3} value={form.description} onChange={onChange}
          placeholder="Beskrivning av jobbet…" className={`${inputClass} resize-none`} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum">
          <input name="scheduled_date" type="date" value={form.scheduled_date} onChange={onChange} className={inputClass} />
        </Field>
        <Field label="Tid">
          <input name="scheduled_time" type="time" value={form.scheduled_time} onChange={onChange} className={inputClass} />
        </Field>
      </div>
      <Field label="Anteckningar">
        <textarea name="notes" rows={3} value={form.notes} onChange={onChange}
          placeholder="Interna anteckningar…" className={`${inputClass} resize-none`} />
      </Field>
    </Card>
  )
}
