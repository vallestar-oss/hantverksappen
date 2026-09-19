import { describe, it, expect } from 'vitest'
import { customerPayload, jobPayload, EMPTY_CUSTOMER, EMPTY_JOB } from './entities'

describe('customerPayload', () => {
  it('trims values and stores empty optional fields as null', () => {
    expect(customerPayload({ ...EMPTY_CUSTOMER, name: '  Anna  ', phone: ' 070-123 ', email: '   ' })).toEqual({
      name: 'Anna',
      phone: '070-123',
      email: null,
      address: null,
      postal_code: null,
      city: null,
      notes: null,
    })
  })
})

describe('jobPayload', () => {
  it('maps empty schedule fields to null and keeps the customer id', () => {
    expect(jobPayload({ ...EMPTY_JOB, title: ' Badrum ', customer_id: 'c1' })).toEqual({
      title: 'Badrum',
      customer_id: 'c1',
      description: null,
      scheduled_date: null,
      scheduled_time: null,
      notes: null,
    })
  })

  it('passes a schedule through unchanged', () => {
    const payload = jobPayload({ ...EMPTY_JOB, title: 'x', customer_id: 'c', scheduled_date: '2026-06-10', scheduled_time: '08:30' })
    expect(payload).toMatchObject({ scheduled_date: '2026-06-10', scheduled_time: '08:30' })
  })
})
