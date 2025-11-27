import React, { useEffect, useState } from 'react'
import type { Promotion, CreatePromotionInput } from '../services/promotions'
import { getAllPromotions, createPromotionApi } from '../services/promotions'
import type { Product } from '../services/products'
import { getProducts } from '../services/products'
import type { AuthUser } from '../services/auth'

const AdminPromotionsPage: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [form, setForm] = useState<CreatePromotionInput>({
    codigo: '',
    descripcion: '',
    tipo_descuento: 'Porcentaje',
    valor_descuento: 10,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_fin: new Date().toISOString().slice(0, 10),
    usos_maximos: null,
    activa: true,
    productIds: [],
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth')
      if (stored) {
        const parsed = JSON.parse(stored) as { user?: AuthUser | null; token?: string }
        setAuthUser(parsed.user ?? null)
        setToken(parsed.token ?? null)
      } else {
        setAuthUser(null)
        setToken(null)
      }
    } catch {
      setAuthUser(null)
      setToken(null)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const [promos, prods] = await Promise.all([
          getAllPromotions(token),
          getProducts(token),
        ])
        setPromotions(promos)
        setProducts(prods)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
        setLoadingProducts(false)
      }
    }

    setLoadingProducts(true)
    void loadData()
  }, [token])

  const toggleProductSelected = (id: number) => {
    setForm((prev) => {
      const already = prev.productIds.includes(id)
      return {
        ...prev,
        productIds: already ? prev.productIds.filter((pid) => pid !== id) : [...prev.productIds, id],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!form.codigo.trim()) {
      setCreateError('El código es obligatorio')
      return
    }
    if (form.productIds.length === 0) {
      setCreateError('Selecciona al menos un producto')
      return
    }

    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)
    try {
      const payload: CreatePromotionInput = {
        ...form,
        codigo: form.codigo.trim(),
        descripcion: form.descripcion?.trim() || null,
      }
      await createPromotionApi(token, payload)

      const promos = await getAllPromotions(token)
      setPromotions(promos)
      setCreateSuccess('Promoción creada correctamente')
      setForm((prev) => ({
        ...prev,
        codigo: '',
        descripcion: '',
        productIds: [],
      }))
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gestión de Descuentos</h2>
        {authUser && <span className="text-xs text-gray-500 dark:text-gray-400">Usuario: {authUser.email}</span>}
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 text-left font-semibold">ID</th>
              <th className="py-2 pr-4 text-left font-semibold">Código</th>
              <th className="py-2 pr-4 text-left font-semibold">Descripción</th>
              <th className="py-2 pr-4 text-left font-semibold">Tipo</th>
              <th className="py-2 pr-4 text-left font-semibold">Valor</th>
              <th className="py-2 pr-4 text-left font-semibold">Fecha inicio</th>
              <th className="py-2 pr-4 text-left font-semibold">Fecha fin</th>
              <th className="py-2 pr-4 text-left font-semibold">Usos</th>
              <th className="py-2 pr-4 text-left font-semibold">Activa</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando promociones...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay promociones registradas.
                </td>
              </tr>
            ) : (
              promotions.map((p) => (
                <tr key={p.id_promocion} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{p.id_promocion}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.codigo}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={p.descripcion ?? ''}>{p.descripcion || '—'}</td>
                  <td className="py-2 pr-4">{p.tipo_descuento === 'Porcentaje' ? 'Porcentaje' : 'Monto fijo'}</td>
                  <td className="py-2 pr-4">{p.tipo_descuento === 'Porcentaje' ? `${p.valor_descuento}%` : `S/ ${p.valor_descuento}`}</td>
                  <td className="py-2 pr-4">{new Date(p.fecha_inicio).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{new Date(p.fecha_fin).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    {p.usos_maximos != null
                      ? `${p.usos_actuales} / ${p.usos_maximos}`
                      : `${p.usos_actuales}`}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.activa
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {p.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow border border-primary/30 flex flex-col gap-3">
          <h3 className="text-lg font-semibold">Crear nueva promoción</h3>
          {createError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
          {createSuccess && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {createSuccess}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo_descuento: e.target.value as CreatePromotionInput['tipo_descuento'] }))}
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

            <div>
              <label className="block text-xs font-medium mb-1">Productos</label>
              {loadingProducts ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Cargando productos...</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1 text-xs">
                  {products.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">No hay productos disponibles.</p>
                  ) : (
                    products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(p.id)}
                          onChange={() => toggleProductSelected(p.id)}
                          className="h-3 w-3 rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                        />
                        <span className="truncate" title={p.nombre}>
                          {p.nombre} (ID {p.id})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
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
    </section>
  )
}

export default AdminPromotionsPage
