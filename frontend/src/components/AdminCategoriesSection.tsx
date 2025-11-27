import React from 'react'
import type { Category } from '../services/categories'

interface NewCategoryState {
  nombre: string
  descripcion: string
  parent_id: string
}

interface AdminCategoriesSectionProps {
  categories: Category[]
  loadingCategories: boolean
  categoriesError: string | null
  newCategory: NewCategoryState
  creatingCategory: boolean
  createCategoryError: string | null
  onDeleteCategory: (categoryId: number) => void
  onChangeNewCategory: (updater: (prev: NewCategoryState) => NewCategoryState) => void
  onCreateCategory: (e: React.FormEvent) => void
}

const AdminCategoriesSection: React.FC<AdminCategoriesSectionProps> = ({
  categories,
  loadingCategories,
  categoriesError,
  newCategory,
  creatingCategory,
  createCategoryError,
  onDeleteCategory,
  onChangeNewCategory,
  onCreateCategory,
}) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold">Categorías disponibles</h2>
        </div>
        <p className="mb-4 text-[11px] text-muted-dark dark:text-muted-light">
          Al eliminar una categoría que tiene subcategorías o productos asociados, se marcará como <span className="font-semibold">Inactiva</span>.
          Solo se eliminará definitivamente cuando no tenga subcategorías ni productos activos.
        </p>

        {categoriesError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {categoriesError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 text-left font-semibold">ID</th>
                <th className="py-2 pr-4 text-left font-semibold">Nombre</th>
                <th className="py-2 pr-4 text-left font-semibold">Descripción</th>
                <th className="py-2 pr-4 text-left font-semibold">Categoría padre</th>
                <th className="py-2 pr-4 text-left font-semibold">Estado</th>
                <th className="py-2 pr-4 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingCategories ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando categorías...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">{c.id}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-gray-900 dark:text-white">{c.nombre}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200 max-w-xs truncate">
                      {c.descripcion || '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">
                      {c.parent_id ? `ID ${c.parent_id}` : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.activo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {c.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Agregar nueva categoría</h2>
        {createCategoryError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {createCategoryError}
          </p>
        )}

        <form onSubmit={onCreateCategory} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
              value={newCategory.nombre}
              onChange={(e) => onChangeNewCategory((prev) => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Descripción (opcional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
              rows={3}
              value={newCategory.descripcion}
              onChange={(e) => onChangeNewCategory((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Categoría padre (opcional)</label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
              value={newCategory.parent_id}
              onChange={(e) => onChangeNewCategory((prev) => ({ ...prev, parent_id: e.target.value }))}
            >
              <option value="">Ninguna (sin categoría padre)</option>
              {categories
                .filter((cat) => cat.parent_id == null)
                .map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.nombre} (ID {cat.id})
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creatingCategory}
            className="mt-2 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creatingCategory ? 'Creando categoría...' : 'Crear categoría'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default AdminCategoriesSection
