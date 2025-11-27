import React, { useState } from 'react'
import type { CreatePromotionInput } from '../services/promotions'
import { createPromotionApi } from '../services/promotions'
import type { Product } from '../services/products'

interface ProductPromotionModalProps {
  open: boolean
  token: string | null
  selectedProducts: Product[]
  onClose: () => void
}

const ProductPromotionModal: React.FC<ProductPromotionModalProps> = ({ open, token, selectedProducts, onClose }) => {
  const [form, setForm] = useState<CreatePromotionInput>(() => ({
    codigo: '',
    descripcion: '',
    tipo_descuento: 'Porcentaje',
    valor_descuento: 10,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_fin: new Date().toISOString().slice(0, 10),
    usos_maximos: null,
    activa: true,
    productIds: selectedProducts.map((p) => p.id),
  }))
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!form.codigo.trim()) {
      setError('El código es obligatorio')
      return
    }
    if (form.productIds.length === 0) {
      setError('Selecciona al menos un producto')
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: CreatePromotionInput = {
        ...form,
        codigo: form.codigo.trim(),
        descripcion: form.descripcion?.trim() || null,
        productIds: selectedProducts.map((p) => p.id),
      }
      await createPromotionApi(token, payload)
      setSuccess('Promoción creada correctamente')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl border border-primary/40 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 bg-transparent text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-xl font-semibold mb-4">Crear promoción para productos seleccionados</h2>

        {selectedProducts.length > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Productos seleccionados: {selectedProducts.map((p) => `#${p.id}`).join(', ')}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-2">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium mb-1">Código</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm font-mono"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
              rows={2}
              value={form.descripcion ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de descuento</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={form.tipo_descuento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo_descuento: e.target.value as CreatePromotionInput['tipo_descuento'] }))
                }
              >
                <option value="Porcentaje">Porcentaje</option>
                <option value="Monto_Fijo">Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Valor</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={form.valor_descuento}
                onChange={(e) => setForm((prev) => ({ ...prev, valor_descuento: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Fecha inicio</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={form.fecha_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={form.fecha_fin}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Usos máximos (opcional)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
              value={form.usos_maximos ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, usos_maximos: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="promo-activa"
              type="checkbox"
              checked={form.activa ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, activa: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
            />
            <label htmlFor="promo-activa" className="text-xs font-medium">
              Promoción activa
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-2 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? 'Creando promoción...' : 'Crear promoción'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProductPromotionModal
