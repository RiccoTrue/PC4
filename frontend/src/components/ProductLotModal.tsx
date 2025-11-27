import React from 'react'
import type { Product } from '../services/products'

interface ProductLotModalProps {
  open: boolean
  products: Product[]
  selectedProductIds: number[]
  lotQuantities: Record<number, string>
  lotError: string | null
  lotSuccess: string | null
  lotLoading: boolean
  onChangeLotQuantity: (id: number, value: string) => void
  onClose: () => void
  onConfirm: () => void
}

const ProductLotModal: React.FC<ProductLotModalProps> = ({
  open,
  products,
  selectedProductIds,
  lotQuantities,
  lotError,
  lotSuccess,
  lotLoading,
  onChangeLotQuantity,
  onClose,
  onConfirm,
}) => {
  if (!open || selectedProductIds.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-w-2xl w-full bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-primary/40 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 bg-transparent text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Cerrar"
          disabled={lotLoading}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-xl font-semibold mb-2">Registrar lote para productos seleccionados</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Define la cantidad de unidades que llegan para cada producto. El mínimo por producto es de 20 unidades.
        </p>

        {lotError && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1 mb-3">
            {lotError}
          </p>
        )}
        {lotSuccess && (
          <p className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1 mb-3">
            {lotSuccess}
          </p>
        )}

        <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
          <table className="min-w-full text-xs">
            <thead className="bg-background-light dark:bg-background-dark">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-left font-semibold">ID</th>
                <th className="py-2 px-3 text-left font-semibold">Nombre</th>
                <th className="py-2 px-3 text-left font-semibold">Stock actual</th>
                <th className="py-2 px-3 text-left font-semibold">Cantidad del lote</th>
              </tr>
            </thead>
            <tbody>
              {selectedProductIds.map((id) => {
                const product = products.find((p) => p.id === id)
                if (!product) return null
                const qty = lotQuantities[id] ?? '20'
                const qtyNum = Number(qty)
                const invalid = !Number.isFinite(qtyNum) || qtyNum < 20
                return (
                  <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">{product.id}</td>
                    <td className="py-2 px-3 truncate max-w-[160px]">
                      <span className="font-medium text-gray-900 dark:text-white">{product.nombre}</span>
                    </td>
                    <td className="py-2 px-3">{product.stock}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={20}
                        value={qty}
                        onChange={(e) => onChangeLotQuantity(id, e.target.value)}
                        className={`w-24 rounded-lg border px-2 py-1 text-xs ${
                          invalid
                            ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark'
                        }`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          disabled={lotLoading}
          onClick={onConfirm}
          className="mt-1 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {lotLoading ? 'Registrando lotes...' : 'Confirmar lotes'}
        </button>
      </div>
    </div>
  )
}

export default ProductLotModal
