import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getProducts, type Product, getProductImages, type ProductImage } from '../services/products'
import { getCategories, type Category } from '../services/categories'
import { addToCart } from '../services/cart'
import { addToWishlist } from '../services/wishlist'
import { getProductReviews, type ProductReviewsResponse } from '../services/reviews'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function ProductsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedParent, setSelectedParent] = useState<number | 'all'>('all')
  const [selectedChild, setSelectedChild] = useState<number | 'all'>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedProductImages, setSelectedProductImages] = useState<ProductImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [wishlistMessage, setWishlistMessage] = useState<string | null>(null)
  const [wishlistError, setWishlistError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ProductReviewsResponse | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ])
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const getNumeric = (value: unknown) => {
    if (value == null) return 0
    if (typeof value === 'number') return value
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parent_id == null),
    [categories],
  )

  const childCategories = useMemo(
    () => categories.filter((c) => c.parent_id != null),
    [categories],
  )

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const nameMatch = p.nombre.toLowerCase().includes(search.toLowerCase().trim())
        let categoryMatch = true

        if (selectedChild !== 'all') {
          categoryMatch = p.id_categoria === selectedChild
        } else if (selectedParent !== 'all') {
          const childIds = childCategories
            .filter((c) => c.parent_id === selectedParent)
            .map((c) => c.id)
          categoryMatch = childIds.includes(p.id_categoria)
        }

        const price = getNumeric(p.precio)
        const minOk = minPrice === '' || price >= Number(minPrice)
        const maxOk = maxPrice === '' || price <= Number(maxPrice)

        return nameMatch && categoryMatch && minOk && maxOk
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return getNumeric(a.precio) - getNumeric(b.precio)
        if (sortBy === 'price-desc') return getNumeric(b.precio) - getNumeric(a.precio)
        return 0
      })
  }, [products, search, selectedParent, selectedChild, minPrice, maxPrice, sortBy, childCategories])

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedProductImages([])
    setSelectedImageIndex(0)
    setWishlistMessage(null)
    setWishlistError(null)
    setReviews(null)
    setReviewsError(null)

    // Cargar imágenes del producto (público)
    void getProductImages(undefined, product.id)
      .then((images) => {
        setSelectedProductImages(images)
      })
      .catch((err) => {
        console.error('Error al cargar imágenes del producto:', err)
      })
  }

  const handleCloseModal = () => {
    setSelectedProduct(null)
  }

  // Cargar reseñas cuando se seleccione un producto
  useEffect(() => {
    const loadReviews = async () => {
      if (!selectedProduct) return
      setReviewsLoading(true)
      setReviewsError(null)
      try {
        const data = await getProductReviews(selectedProduct.id)
        setReviews(data)
      } catch (e) {
        setReviewsError((e as Error).message)
      } finally {
        setReviewsLoading(false)
      }
    }

    void loadReviews()
  }, [selectedProduct])

  const handleQuantityChange = (value: number) => {
    if (!selectedProduct) return
    const max = selectedProduct.stock
    const safe = Math.min(Math.max(1, value), max)
    setQuantity(safe)
  }

  const handleAddToWishlist = async () => {
    if (!selectedProduct) return

    setWishlistMessage(null)
    setWishlistError(null)

    const stored = localStorage.getItem('auth')
    let token: string | null = null

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string }
        token = parsed.token ?? null
      } catch {
        token = null
      }
    }

    if (!token) {
      navigate('/auth', { state: { from: location.pathname } })
      return
    }

    try {
      await addToWishlist(token, selectedProduct.id)
      setWishlistMessage('Producto añadido a tu lista de deseos')
    } catch (e) {
      const msg = (e as Error).message || 'No se pudo añadir a la lista de deseos'
      setWishlistError(msg)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedProduct) return

    const stored = localStorage.getItem('auth')
    let token: string | null = null

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string }
        token = parsed.token ?? null
      } catch {
        token = null
      }
    }

    if (!token) {
      navigate('/auth', { state: { from: location.pathname } })
      return
    }

    try {
      await addToCart(token, selectedProduct.id, quantity)
      navigate('/cart')
    } catch (e) {
      // Opcional: podríamos mostrar un mensaje de error más adelante
      console.error('Error al añadir al carrito:', e)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar filtros */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="flex h-full min-h-[700px] flex-col justify-between bg-background-light dark:bg-background-dark p-6 rounded-xl border border-gray-200/40 dark:border-gray-800">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                  <h3 className="text-gray-900 dark:text-white text-lg font-semibold leading-normal">
                    Categorías
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                    Filtra tu búsqueda
                  </p>
                </div>

                {/* Lista de categorías padre */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParent('all')
                      setSelectedChild('all')
                    }}
                    className={`flex items-center px-3 py-2 rounded-lg border text-sm transition-colors bg-transparent ${
                      selectedParent === 'all'
                        ? 'border-primary/70 text-primary bg-primary/5'
                        : 'border-transparent text-gray-800 dark:text-gray-100 hover:border-gray-500/60 dark:hover:border-gray-400/60'
                    }`}
                  >
                    <span className="font-semibold">Todas las categorías</span>
                  </button>

                  {parentCategories.map((parent) => (
                    <button
                      key={parent.id}
                      type="button"
                      onClick={() => {
                        setSelectedParent(parent.id)
                        setSelectedChild('all')
                      }}
                      className={`flex items-center px-3 py-2 rounded-lg border text-sm transition-colors bg-transparent ${
                        selectedParent === parent.id
                          ? 'border-primary/70 text-primary bg-primary/5'
                          : 'border-transparent text-gray-800 dark:text-gray-100 hover:border-gray-500/60 dark:hover:border-gray-400/60'
                      }`}
                    >
                      <span className="font-medium leading-normal">{parent.nombre}</span>
                    </button>
                  ))}
                </div>

                {/* Subcategorías (hijos) del padre seleccionado */}
                {selectedParent !== 'all' && (
                  <div className="mt-4 flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Subcategorías
                    </p>
                    {childCategories.filter((c) => c.parent_id === selectedParent).map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedChild(child.id)}
                        className={`flex items-center px-3 py-1.5 rounded-lg border text-xs transition-colors bg-transparent ${
                          selectedChild === child.id
                            ? 'border-primary/70 text-primary bg-primary/5'
                            : 'border-transparent text-gray-700 dark:text-gray-200 hover:border-gray-500/60 dark:hover:border-gray-400/60'
                        }`}
                      >
                        <span>{child.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* Rango de precios */}
                <div className="space-y-4">
                  <h4 className="text-gray-900 dark:text-white text-base font-semibold">
                    Rango de precios
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Mínimo</label>
                      <input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="rounded-lg border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-primary focus:ring-primary"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Máximo</label>
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="rounded-lg border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-primary focus:ring-primary"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSearch(search.trim())
                  }}
                  className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors"
                >
                  <span className="truncate">Aplicar filtros</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParent('all')
                    setSelectedChild('all')
                    setMinPrice('')
                    setMaxPrice('')
                    setSearch('')
                    setSortBy('relevance')
                  }}
                  className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold tracking-wide hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="truncate">Limpiar filtros</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Grid de productos */}
          <section className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loading
                    ? 'Cargando productos...'
                    : error
                    ? 'Error al cargar productos'
                    : `Mostrando ${filteredProducts.length} de ${products.length} productos`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0">
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2 text-sm focus:border-primary focus:ring-primary min-w-[180px]"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="sort">
                    Ordenar por:
                  </label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-primary text-sm"
                  >
                    <option value="relevance">Más relevantes</option>
                    <option value="price-asc">Precio más bajo</option>
                    <option value="price-desc">Precio más alto</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {!loading && filteredProducts.length === 0 && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron productos que coincidan con los filtros.
              </p>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 group transition-shadow hover:shadow-xl dark:hover:shadow-primary/10 cursor-pointer"
                  onClick={() => handleOpenProduct(p)}
                >
                  <div className="overflow-hidden">
                    {p.imagen_principal ? (
                      (() => {
                        const resolved = resolveImageUrl(p.imagen_principal)
                        return resolved ? (
                          <img
                            src={resolved}
                            alt={p.nombre}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-900/30 dark:bg-gray-900/60" />
                        )
                      })()
                    ) : (
                      <div className="w-full h-48 bg-gray-900/30 dark:bg-gray-900/60" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                      {p.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {p.descripcion || 'Producto tecnológico de alta calidad.'}
                    </p>
                    <div className="flex-grow" />
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xl font-bold text-primary">
                        S/ {p.precio}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Modal de detalle de producto (formato proporcionado) */}
            {selectedProduct && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
              >
                <div className="relative m-auto flex w-full max-w-4xl max-h-[90vh] flex-col rounded-xl bg-background-light dark:bg-[#1C1F27] shadow-2xl overflow-y-auto">
                  {/* Botón cerrar */}
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row">
                    {/* Columna izquierda: imagen principal + thumbnails */}
                    <div className="flex flex-col gap-4 p-6 md:w-1/2">
                      <div className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                        {(() => {
                          const mainFromList = selectedProductImages[selectedImageIndex]?.url_imagen
                          const fallback = selectedProduct.imagen_principal ?? null
                          const mainUrl = resolveImageUrl(mainFromList || fallback)
                          if (!mainUrl) {
                            return <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
                          }
                          return (
                            <img
                              src={mainUrl}
                              alt={selectedProduct.nombre}
                              className="w-full h-full object-cover"
                            />
                          )
                        })()}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {(selectedProductImages.length > 0
                          ? selectedProductImages
                          : selectedProduct.imagen_principal
                          ? [{ id_imagen: 0, id_producto: selectedProduct.id, url_imagen: selectedProduct.imagen_principal, es_principal: true, orden: 0 } as ProductImage]
                          : []
                        )
                          .slice(0, 4)
                          .map((img, idx) => {
                            const thumbUrl = resolveImageUrl(img.url_imagen)
                            if (!thumbUrl) return null
                            const isActive = idx === selectedImageIndex
                            return (
                              <button
                                key={img.id_imagen ?? idx}
                                type="button"
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`flex flex-col focus:outline-none ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}`}
                              >
                                <div className="w-full aspect-square rounded-lg border border-transparent opacity-80 hover:opacity-100 hover:border-primary transition-all overflow-hidden bg-gray-200/80 dark:bg-gray-700/80">
                                  <img
                                    src={thumbUrl}
                                    alt={selectedProduct.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>

                    {/* Columna derecha: info y acciones */}
                    <div className="flex flex-col gap-6 p-6 md:w-1/2">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-primary uppercase tracking-wide">
                          {selectedParent !== 'all'
                            ? parentCategories.find((c) => c.id === selectedParent)?.nombre || 'Producto'
                            : 'Producto'}
                        </p>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-snug">
                          {selectedProduct.nombre}
                        </h1>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          S/ {selectedProduct.precio}
                        </p>

                        {/* Calificación promedio */}
                        {reviews && (
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600 dark:text-[#9da6b9]">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-400 text-base">★</span>
                              <span className="font-semibold">
                                {reviews.promedio.toFixed(1)} / 5
                              </span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-[#828ba0]">
                              ({reviews.total} reseña{reviews.total === 1 ? '' : 's'})
                            </span>
                          </div>
                        )}
                        {reviewsLoading && !reviews && (
                          <p className="text-xs text-slate-500 dark:text-[#828ba0] mt-1">Cargando reseñas...</p>
                        )}
                      </div>

                      <p className="text-base font-normal leading-relaxed text-slate-600 dark:text-[#9da6b9]">
                        {selectedProduct.descripcion ||
                          'Este producto no tiene una descripción detallada aún, pero cumple con los más altos estándares de calidad y rendimiento.'}
                      </p>

                      <div className="space-y-2 text-sm text-slate-600 dark:text-[#9da6b9]">
                        <p>
                          <span className="font-semibold">SKU:</span>{' '}
                          <span className="font-mono text-slate-800 dark:text-slate-200">{selectedProduct.sku}</span>
                        </p>
                        {selectedProduct.marca && (
                          <p>
                            <span className="font-semibold">Marca:</span>{' '}
                            <span className="text-slate-800 dark:text-slate-200">{selectedProduct.marca}</span>
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Stock disponible:</span>{' '}
                          <span className="text-slate-800 dark:text-slate-200">{selectedProduct.stock}</span>
                        </p>
                      </div>

                      {/* Selector de cantidad */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-[#282e39] p-2">
                          <div className="flex items-center gap-4">
                            <div className="text-slate-800 dark:text-white flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined">numbers</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium leading-normal flex-1 truncate">
                              Cantidad
                            </p>
                          </div>
                          <div className="shrink-0">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                              <button
                                type="button"
                                className="text-xl font-medium leading-normal flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-[#394150] hover:bg-slate-300 dark:hover:bg-slate-500 cursor-pointer transition-colors disabled:opacity-40"
                                onClick={() => handleQuantityChange(quantity - 1)}
                                disabled={quantity <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={quantity}
                                min={1}
                                max={selectedProduct.stock}
                                onChange={(e) => handleQuantityChange(Number(e.target.value) || 1)}
                                className="text-base font-medium leading-normal w-8 p-0 text-center bg-transparent focus:outline-0 focus:ring-0 focus:border-none border-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                className="text-xl font-medium leading-normal flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-[#394150] hover:bg-slate-300 dark:hover:bg-slate-500 cursor-pointer transition-colors disabled:opacity-40"
                                onClick={() => handleQuantityChange(quantity + 1)}
                                disabled={quantity >= selectedProduct.stock}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Añadir al carrito / lista de deseos */}
                      <div className="mt-auto flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={selectedProduct.stock === 0}
                          className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white gap-2 pl-5 text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined">add_shopping_cart</span>
                          <span className="truncate">Añadir al Carrito</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddToWishlist}
                          className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white gap-2 text-sm font-semibold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined">favorite</span>
                          <span className="truncate">Añadir a la lista de deseos</span>
                        </button>

                        {wishlistMessage && (
                          <p className="text-xs text-emerald-500">{wishlistMessage}</p>
                        )}
                        {wishlistError && (
                          <p className="text-xs text-red-500">{wishlistError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default ProductsPage
