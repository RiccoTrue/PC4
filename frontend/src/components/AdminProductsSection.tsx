import React from 'react'
import type { Product } from '../services/products'
import type { InventoryMovement } from '../services/admin'

interface AdminProductsSectionProps {
  products: Product[]
  loadingProducts: boolean
  productsError: string | null
  productSearch: string
  selectedProductIds: number[]
  onChangeProductSearch: (value: string) => void
  onOpenProductModal: () => void
  onOpenPromotionModal: () => void
  onToggleProductSelected: (id: number) => void
  onToggleSelectAllProducts: (ids: number[]) => void
  onOpenLotModal: () => void
  onDeleteProduct: (productId: number) => void
  onEditProduct: (product: Product) => void
  inventoryHistory: InventoryMovement[]
  loadingInventoryHistory: boolean
  inventoryHistoryError: string | null
}

const AdminProductsSection: React.FC<AdminProductsSectionProps> = ({
  products,
  loadingProducts,
  productsError,
  productSearch,
  selectedProductIds,
  onChangeProductSearch,
  onOpenProductModal,
  onOpenPromotionModal,
  onToggleProductSelected,
  onToggleSelectAllProducts,
  onOpenLotModal,
  onDeleteProduct,
  onEditProduct,
  inventoryHistory,
  loadingInventoryHistory,
  inventoryHistoryError,
}) => {
  const filteredProducts = products.filter((p) => {
    const term = productSearch.trim().toLowerCase()
    if (!term) return true
    const byName = p.nombre.toLowerCase().includes(term)
    const byId = String(p.id).includes(term)
    return byName || byId
  })

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id))

  const handleToggleSelectAll = () => {
    onToggleSelectAllProducts(filteredProducts.map((p) => p.id))
  }

  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-semibold">Gestión de productos</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenProductModal}
              className="flex items-center gap-2 rounded-lg bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Añadir producto
            </button>
            <button
              type="button"
              onClick={onOpenPromotionModal}
              disabled={selectedProductIds.length === 0}
              className="flex items-center gap-2 rounded-lg bg-accent text-white text-xs font-semibold px-4 py-2 hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">percent</span>
              Crear promoción
            </button>
            <button
              type="button"
              onClick={onOpenLotModal}
              disabled={selectedProductIds.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              Registrar lote
            </button>
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={productSearch}
              onChange={(e) => onChangeProductSearch(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
            />
          </div>
        </div>

        {productsError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {productsError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-2 text-left">
                  <input
                    type="checkbox"
                    onChange={handleToggleSelectAll}
                    checked={allFilteredSelected}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-2 pr-4 text-left font-semibold">ID</th>
                <th className="py-2 pr-4 text-left font-semibold">Nombre</th>
                <th className="py-2 pr-4 text-left font-semibold">SKU</th>
                <th className="py-2 pr-4 text-left font-semibold">Precio</th>
                <th className="py-2 pr-4 text-left font-semibold">Stock</th>
                <th className="py-2 pr-4 text-left font-semibold">Marca</th>
                <th className="py-2 pr-4 text-left font-semibold">Fotos</th>
                <th className="py-2 pr-4 text-left font-semibold">Lotes</th>
                <th className="py-2 pr-4 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron productos con el filtro actual.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => onToggleProductSelected(p.id)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{p.id}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-gray-900 dark:text-white">{p.nombre}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{p.sku}</td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">S/ {p.precio}</td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{p.stock}</td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{p.marca || '—'}</td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">
                      <span className="text-xs">
                        {(p.imagenes_count ?? 0)} / 4
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedProductIds.includes(p.id) ? 'Incluido en el lote' : '-'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historial de inventario reciente</h3>
        </div>

        {inventoryHistoryError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {inventoryHistoryError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-left font-semibold">Fecha</th>
                <th className="py-2 px-3 text-left font-semibold">Producto</th>
                <th className="py-2 px-3 text-left font-semibold">Tipo</th>
                <th className="py-2 px-3 text-left font-semibold">Cantidad</th>
                <th className="py-2 px-3 text-left font-semibold">Registrado por</th>
                <th className="py-2 px-3 text-left font-semibold">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {loadingInventoryHistory ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando historial de inventario...
                  </td>
                </tr>
              ) : inventoryHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay movimientos de inventario recientes.
                  </td>
                </tr>
              ) : (
                inventoryHistory.map((m) => (
                  <tr key={m.id_movimiento} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">{new Date(m.fecha_movimiento).toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-gray-900 dark:text-white">{m.producto_nombre}</span>
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400">ID {m.id_producto}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700">
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td className="py-2 px-3">{m.cantidad}</td>
                    <td className="py-2 px-3">
                      {m.usuario.nombre} {m.usuario.apellido}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-600 dark:text-gray-400">
                      {m.referencia_externa || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminProductsSection
