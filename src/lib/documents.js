// Shared persistence helpers for quotes and invoices. Both documents are a
// header row plus line items in a child table, so the flows are identical.

import { supabase } from './supabase'

export const UNITS = ['st', 'tim', 'm', 'm²', 'm³']

/** Table/column names for each document kind. */
export const DOCUMENT_KINDS = {
  quote: { table: 'quotes', itemsTable: 'quote_items', foreignKey: 'quote_id', numberColumn: 'quote_number' },
  invoice: { table: 'invoices', itemsTable: 'invoice_items', foreignKey: 'invoice_id', numberColumn: 'invoice_number' },
}

// ── editable rows ────────────────────────────────────────────────────────────

export function emptyRow() {
  return {
    id: crypto.randomUUID(),
    type: 'material',
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price: '',
    vat_rate: 25,
  }
}

/** Database items → editable rows (always at least one row). */
export function rowsFromItems(items) {
  if (!items?.length) return [emptyRow()]
  return items.map(item => ({
    id: crypto.randomUUID(),
    type: item.type ?? 'material',
    description: item.description ?? '',
    quantity: item.quantity ?? 1,
    unit: item.unit ?? 'st',
    unit_price: item.unit_price ?? '',
    vat_rate: item.vat_rate ?? 25,
  }))
}

/** Editable rows → insertable database items. */
export function itemsPayload(rows, foreignKey, documentId) {
  return rows.map(r => ({
    [foreignKey]: documentId,
    type: r.type,
    description: r.description.trim() || null,
    quantity: Number(r.quantity) || 0,
    unit: r.unit,
    unit_price: Number(r.unit_price) || 0,
    vat_rate: r.vat_rate,
  }))
}

// ── numbering ────────────────────────────────────────────────────────────────

/**
 * Next number in the `YYYY-NNN` series. Uses the highest existing number
 * rather than a row count, so deleting a document never causes a duplicate.
 * @param {string[]} existing numbers already issued (any year)
 */
export function nextSequenceNumber(existing, year = new Date().getFullYear()) {
  const prefix = `${year}-`
  const highest = existing
    .filter(n => typeof n === 'string' && n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

async function fetchNextNumber(kind, userId) {
  const { table, numberColumn } = DOCUMENT_KINDS[kind]
  const year = new Date().getFullYear()
  const { data, error } = await supabase
    .from(table)
    .select(numberColumn)
    .eq('user_id', userId)
    .like(numberColumn, `${year}-%`)
  if (error) throw error
  return nextSequenceNumber((data ?? []).map(row => row[numberColumn]), year)
}

// ── writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a document and its line items. If the items fail to save, the
 * header is removed again so no empty document is left behind.
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export async function createDocument(kind, userId, fields, rows) {
  const { table, itemsTable, foreignKey, numberColumn } = DOCUMENT_KINDS[kind]

  let number
  try {
    number = await fetchNextNumber(kind, userId)
  } catch (error) {
    return { data: null, error }
  }

  const { data: document, error } = await supabase
    .from(table)
    .insert({ user_id: userId, [numberColumn]: number, ...fields })
    .select()
    .single()
  if (error) return { data: null, error }

  if (rows.length > 0) {
    const { error: itemsError } = await supabase
      .from(itemsTable)
      .insert(itemsPayload(rows, foreignKey, document.id))
    if (itemsError) {
      await supabase.from(table).delete().eq('id', document.id).eq('user_id', userId)
      return { data: null, error: itemsError }
    }
  }

  return { data: document, error: null }
}

/**
 * Updates a document and swaps its line items. The new items are inserted
 * before the old ones are removed, so a failure can never lose the originals.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updateDocument(kind, userId, documentId, fields, rows) {
  const { table, itemsTable, foreignKey } = DOCUMENT_KINDS[kind]

  const { error } = await supabase
    .from(table)
    .update(fields)
    .eq('id', documentId)
    .eq('user_id', userId)
  if (error) return { error }

  const { data: existing, error: readError } = await supabase
    .from(itemsTable)
    .select('id')
    .eq(foreignKey, documentId)
  if (readError) return { error: readError }

  const oldIds = (existing ?? []).map(item => item.id)

  if (rows.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from(itemsTable)
      .insert(itemsPayload(rows, foreignKey, documentId))
      .select('id')
    if (insertError) return { error: insertError }
    if (oldIds.length === 0) return { error: null }
    const { error: deleteError } = await supabase.from(itemsTable).delete().in('id', oldIds)
    if (deleteError) {
      // Undo the insert so the document doesn't end up with duplicated rows.
      await supabase.from(itemsTable).delete().in('id', inserted.map(item => item.id))
      return { error: deleteError }
    }
    return { error: null }
  }

  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from(itemsTable).delete().in('id', oldIds)
    if (deleteError) return { error: deleteError }
  }
  return { error: null }
}
