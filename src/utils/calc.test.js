import { describe, it, expect } from 'vitest'
import { calcTotals, lineNet, round2, rotRutLabel } from './calc'

const labour = (quantity, unit_price, vat_rate = 25) => ({ type: 'arbete', quantity, unit_price, vat_rate })
const material = (quantity, unit_price, vat_rate = 25) => ({ type: 'material', quantity, unit_price, vat_rate })

describe('round2', () => {
  it('avoids floating-point artefacts', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})

describe('lineNet', () => {
  it('accepts numbers and form strings', () => {
    expect(lineNet({ quantity: 2, unit_price: 150 })).toBe(300)
    expect(lineNet({ quantity: '2.5', unit_price: '400' })).toBe(1000)
  })

  it('treats empty and invalid input as zero', () => {
    expect(lineNet({ quantity: '', unit_price: '' })).toBe(0)
    expect(lineNet({ quantity: 'abc', unit_price: 100 })).toBe(0)
  })
})

describe('calcTotals', () => {
  it('returns zeros for no items', () => {
    expect(calcTotals([], false)).toMatchObject({ subtotal: 0, totalVat: 0, toPay: 0 })
    expect(calcTotals(undefined, true).toPay).toBe(0)
  })

  it('adds 25 % VAT to a single line', () => {
    const t = calcTotals([material(1, 1000)])
    expect(t).toMatchObject({ subtotal: 1000, totalVat: 250, totalInkMoms: 1250, toPay: 1250 })
    expect(t.vatByRate[25]).toBe(250)
  })

  it('groups VAT by rate', () => {
    const t = calcTotals([material(1, 1000, 25), material(1, 1000, 12), material(1, 1000, 6)])
    expect(t.vatByRate).toEqual({ 25: 250, 12: 120, 6: 60 })
    expect(t.totalVat).toBe(430)
    expect(t.totalInkMoms).toBe(3430)
  })

  it('defaults a missing VAT rate to 25 %', () => {
    expect(calcTotals([{ type: 'material', quantity: 1, unit_price: 100 }]).totalVat).toBe(25)
  })

  it('takes ROT/RUT as 30 % of labour cost including VAT', () => {
    // 10 000 kr labour + 25 % VAT = 12 500 kr → 30 % = 3 750 kr
    const t = calcTotals([labour(10, 1000), material(1, 2000)], true)
    expect(t.labourSubtotal).toBe(10000)
    expect(t.labourInclVat).toBe(12500)
    expect(t.rotRutDeduction).toBe(3750)
    expect(t.totalInkMoms).toBe(15000)
    expect(t.toPay).toBe(11250)
  })

  it('ignores material for the deduction', () => {
    expect(calcTotals([material(1, 5000)], true).rotRutDeduction).toBe(0)
  })

  it('gives no deduction when ROT/RUT is off', () => {
    const t = calcTotals([labour(1, 1000)], false)
    expect(t.rotRutDeduction).toBe(0)
    expect(t.toPay).toBe(1250)
  })

  it('uses the VAT rate of labour rows in the deduction base', () => {
    const t = calcTotals([labour(1, 1000, 12)], true)
    expect(t.labourInclVat).toBe(1120)
    expect(t.rotRutDeduction).toBe(336)
  })

  it('rounds to whole öre', () => {
    const t = calcTotals([material(3, 33.33)])
    expect(t.subtotal).toBe(99.99)
    expect(t.totalVat).toBe(25)
    expect(t.toPay).toBe(124.99)
  })
})

describe('rotRutLabel', () => {
  it('falls back to ROT', () => {
    expect(rotRutLabel('rut')).toBe('RUT')
    expect(rotRutLabel('rot')).toBe('ROT')
    expect(rotRutLabel(null)).toBe('ROT')
  })
})
