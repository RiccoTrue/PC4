import React from 'react'
import type { CreateProductPayload, ProductImage } from '../services/products'
import type { Category } from '../services/categories'

interface ProductCreateModalProps {
  open: boolean
  productForm: CreateProductPayload
  categories: Category[]
  loadingCategories: boolean
  categoriesError: string | null
  createProductError: string | null
  creatingProduct: boolean
  title: string
  submitLabel: string
  onUploadImages?: (files: FileList) => void
  uploadingImages?: boolean
  existingImages?: ProductImage[]
  loadingExistingImages?: boolean
  onDeleteImage?: (imageId: number) => void
  onSetPrincipalImage?: (imageId: number) => void
  apiUrl?: string
  onChangeProductForm: (updater: (prev: CreateProductPayload) => CreateProductPayload) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  open,
  productForm,
  categories,
  loadingCategories,
  categoriesError,
  createProductError,
  creatingProduct,
  title,
  submitLabel,
  onUploadImages,
  uploadingImages,
  existingImages,
  loadingExistingImages,
  onDeleteImage,
  onSetPrincipalImage,
  apiUrl,
  onChangeProductForm,
  onClose,
  onSubmit,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-primary/40 p-6 relative overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 bg-transparent text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Cerrar"
          disabled={creatingProduct}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {createProductError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {createProductError}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                value={productForm.nombre}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">SKU</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={productForm.sku}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
              rows={3}
              value={productForm.descripcion ?? ''}
              onChange={(e) => onChangeProductForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Precio</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={productForm.precio}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, precio: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Stock</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={productForm.stock}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Categoría</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                value={productForm.id_categoria}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, id_categoria: Number(e.target.value) }))}
              >
                <option value={1} disabled={categories.length > 0}>
                  {loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {categoriesError && <p className="mt-1 text-[11px] text-red-500">{categoriesError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Marca (opcional)</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={productForm.marca ?? ''}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, marca: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-5 md:mt-7">
              <input
                id="product-activo"
                type="checkbox"
                checked={productForm.activo ?? true}
                onChange={(e) => onChangeProductForm((prev) => ({ ...prev, activo: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
              />
              <label htmlFor="product-activo" className="text-xs font-medium">
                Producto activo
              </label>
            </div>
          </div>

          {onUploadImages && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
              <label className="block text-xs font-medium mb-1">Imágenes del producto</label>
              {existingImages && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                  {existingImages.length} / 4 imágenes cargadas
                </p>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) {
                    const current = existingImages?.length ?? 0
                    const totalSelected = current + files.length
                    if (totalSelected > 4) {
                      alert('Solo puedes tener hasta 4 imágenes por producto (entre existentes y nuevas).')
                    }
                    if (current < 4) {
                      onUploadImages(files)
                    }
                    e.target.value = ''
                  }
                }}
                className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={uploadingImages || (existingImages?.length ?? 0) >= 4}
              />
              {uploadingImages && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Subiendo imágenes...</p>
              )}

              {loadingExistingImages && (
                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Cargando imágenes actuales...</p>
              )}

              {existingImages && existingImages.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Imágenes actuales (selecciona cuál será la principal)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div
                        key={img.id_imagen}
                        className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col"
                      >
                        <div className="aspect-square w-full overflow-hidden">
                          {(() => {
                            const url = img.url_imagen
                            const resolved = url.startsWith('http')
                              ? url
                              : apiUrl
                              ? `${apiUrl}${url}`
                              : url
                            return (
                              <img
                                src={resolved}
                                alt="Imagen del producto"
                                className="w-full h-full object-cover"
                              />
                            )
                          })()}
                        </div>
                        <div className="flex flex-col px-2 py-1 gap-1">
                          <div className="flex items-center justify-start">
                            <label className="flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-200">
                              <input
                                type="radio"
                                name="principal-image"
                                checked={img.es_principal}
                                onChange={() => onSetPrincipalImage && onSetPrincipalImage(img.id_imagen)}
                                className="h-3 w-3 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                              />
                              <span>Principal</span>
                            </label>
                          </div>
                          {onDeleteImage && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => onDeleteImage(img.id_imagen)}
                                className="text-[11px] text-red-500 hover:text-red-600"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={creatingProduct}
            className="mt-4 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProductCreateModal
