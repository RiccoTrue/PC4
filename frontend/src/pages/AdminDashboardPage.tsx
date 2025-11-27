import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AuthUser } from '../services/auth'
import AdminSidebar, { type AdminSection } from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import AdminUsersSection from '../components/AdminUsersSection'
import AdminUserDetailsModal from '../components/AdminUserDetailsModal'
import AdminProductsSection from '../components/AdminProductsSection'
import ProductLotModal from '../components/ProductLotModal'
import ProductCreateModal from '../components/ProductCreateModal'
import ProductPromotionModal from '../components/ProductPromotionModal'
import AdminCategoriesSection from '../components/AdminCategoriesSection'
import AdminOrdersSection from '../components/AdminOrdersSection'
import AdminOrderDetailsModal from '../components/AdminOrderDetailsModal'
import AdminReturnsPage from './AdminReturnsPage'
import AdminPromotionsPage from './AdminPromotionsPage'
import AdminProfilePage from './AdminProfilePage'
import {
  getOverviewStats,
  type OverviewStats,
  getAdminUsers,
  type AdminUser,
  type UserRole,
  createAdminUser,
  deleteAdminUser,
  registerProductLot,
  getInventoryHistory,
  type InventoryMovement,
} from '../services/admin'
import {
  getProducts,
  type Product,
  createProduct,
  type CreateProductPayload,
  deleteProduct,
  updateProduct,
  type UpdateProductPayload,
  uploadProductImages,
  type ProductImage,
  getProductImages,
  deleteProductImage,
  setProductMainImage,
} from '../services/products'
import { getCategories, type Category, createCategory, deleteCategory } from '../services/categories'
import { getAllOrders, type OrderSummary } from '../services/order'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getInitials = (user: AuthUser) => {
  const first = (user.nombre || '').trim().charAt(0)
  const last = (user.apellido || '').trim().charAt(0)
  const combined = `${first}${last}`.trim()
  if (combined) return combined.toUpperCase()
  return (user.email || '?').charAt(0).toUpperCase()
}

interface PieDatum {
  label: string
  value: number
}

const SalesPieChart: React.FC<{ title: string; data: PieDatum[] }> = ({ title, data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const colors = ['#52796F', '#84A98C', '#354F52', '#A1C181', '#6C757D', '#7FB069', '#4D908E', '#43AA8B', '#90BE6D', '#277DA1']

  return (
    <div className="flex flex-col gap-3 bg-background-light dark:bg-background-dark rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-light dark:text-text-dark">{title}</h3>
      {total === 0 || data.length === 0 ? (
        <p className="text-xs text-text-light/60 dark:text-text-dark/60">No hay datos suficientes para mostrar el gráfico.</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {data.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full space-y-1 text-xs">
            {data.map((d, idx) => (
              <li key={d.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  />
                  <span className="truncate max-w-[140px]" title={d.label}>
                    {d.label}
                  </span>
                </div>
                <span className="font-semibold">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined)

  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'Cliente' as UserRole,
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [categoryPage, setCategoryPage] = useState(1)
  const categoriesPerPage = 10
  const [newCategory, setNewCategory] = useState({ nombre: '', descripcion: '', parent_id: '' as string | '' })
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productForm, setProductForm] = useState<CreateProductPayload>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    sku: '',
    marca: '',
    id_categoria: 1,
    activo: true,
  })
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [createProductError, setCreateProductError] = useState<string | null>(null)
  const [createProductSuccess, setCreateProductSuccess] = useState<string | null>(null)
  const [editProductModalOpen, setEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editProductForm, setEditProductForm] = useState<UpdateProductPayload | null>(null)
  const [updatingProduct, setUpdatingProduct] = useState(false)
  const [updateProductError, setUpdateProductError] = useState<string | null>(null)
  const [uploadingProductImages, setUploadingProductImages] = useState(false)
  const [editingProductImages, setEditingProductImages] = useState<ProductImage[]>([])
  const [loadingEditingProductImages, setLoadingEditingProductImages] = useState(false)
  const [lotModalOpen, setLotModalOpen] = useState(false)
  const [lotQuantities, setLotQuantities] = useState<Record<number, string>>({})
  const [lotLoading, setLotLoading] = useState(false)
  const [lotError, setLotError] = useState<string | null>(null)
  const [lotSuccess, setLotSuccess] = useState<string | null>(null)

  const [promotionModalOpen, setPromotionModalOpen] = useState(false)

  const [inventoryHistory, setInventoryHistory] = useState<InventoryMovement[]>([])
  const [loadingInventoryHistory, setLoadingInventoryHistory] = useState(false)
  const [inventoryHistoryError, setInventoryHistoryError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null)

  const isAgent = authUser?.rol === 'Agente'
  const agentAllowedSections: AdminSection[] = ['dashboard', 'orders', 'returns', 'profile']

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
    const params = new URLSearchParams(location.search)
    const section = params.get('section') as AdminSection | null

    const isValidSection = (value: string | null): value is AdminSection => {
      return (
        value === 'users' ||
        value === 'products' ||
        value === 'categories' ||
        value === 'orders' ||
        value === 'returns' ||
        value === 'promotions' ||
        value === 'profile' ||
        value === 'dashboard'
      )
    }

    let nextSection: AdminSection = 'dashboard'
    if (section && isValidSection(section)) {
      nextSection = section
    }

    if (isAgent && !agentAllowedSections.includes(nextSection)) {
      nextSection = 'orders'
    }

    setActiveSection(nextSection)
  }, [location.search, isAgent])

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return
      setLoadingStats(true)
      setStatsError(null)
      try {
        const data = await getOverviewStats(token)
        setStats(data)
      } catch (error) {
        setStatsError((error as Error).message)
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [token])

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true)
      setProductsError(null)
      try {
        const data = await getProducts(token ?? undefined)
        setProducts(data)
      } catch (error) {
        setProductsError((error as Error).message)
      } finally {
        setLoadingProducts(false)
      }
    }

    const loadCategories = async () => {
      setLoadingCategories(true)
      setCategoriesError(null)
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (error) {
        setCategoriesError((error as Error).message)
      } finally {
        setLoadingCategories(false)
      }
    }
    if (activeSection === 'products' || activeSection === 'categories' || activeSection === 'dashboard') {
      void loadProducts()
      void loadCategories()
    }
  }, [activeSection, token])

  useEffect(() => {
    const loadOrders = async () => {
      if (!token || activeSection !== 'orders') return
      setLoadingOrders(true)
      setOrdersError(null)
      try {
        const data = await getAllOrders(token)
        setOrders(data)
      } catch (error) {
        setOrdersError((error as Error).message)
      } finally {
        setLoadingOrders(false)
      }
    }

    void loadOrders()
  }, [token, activeSection])

  useEffect(() => {
    const loadInventoryHistory = async () => {
      if (!token || activeSection !== 'products') return
      setLoadingInventoryHistory(true)
      setInventoryHistoryError(null)
      try {
        const data = await getInventoryHistory(token, 30)
        setInventoryHistory(data)
      } catch (error) {
        setInventoryHistoryError((error as Error).message)
      } finally {
        setLoadingInventoryHistory(false)
      }
    }

    void loadInventoryHistory()
  }, [activeSection, token])

  useEffect(() => {
    const loadUsers = async () => {
      if (!token) return
      setLoadingUsers(true)
      setUsersError(null)
      try {
        const data = await getAdminUsers(token, roleFilter)
        const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
        setUsers(filtered)
      } catch (error) {
        setUsersError((error as Error).message)
      } finally {
        setLoadingUsers(false)
      }
    }

    if (activeSection === 'users') {
      void loadUsers()
    }
  }, [token, roleFilter, activeSection, authUser])

  const totalCategoryPages = Math.max(1, Math.ceil(categories.length / categoriesPerPage))
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages)
  const paginatedCategories = categories.slice(
    (safeCategoryPage - 1) * categoriesPerPage,
    safeCategoryPage * categoriesPerPage,
  )

  const handleLogout = () => {
    localStorage.removeItem('auth')
    navigate('/intranet/login', { replace: true })
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleSectionChange = (section: AdminSection) => {
    let nextSection: AdminSection = section
    if (isAgent && !agentAllowedSections.includes(section)) {
      nextSection = 'orders'
    }

    setActiveSection(nextSection)
    navigate(nextSection === 'dashboard' ? '/admin?section=dashboard' : `/admin?section=${nextSection}`)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.nombre.trim() || !newUser.apellido.trim()) {
      setCreateError('Completa nombre, apellido, email y contraseña')
      return
    }

    setCreatingUser(true)
    setCreateError(null)
    setCreateSuccess(null)
    try {
      await createAdminUser(token, {
        email: newUser.email.trim(),
        password: newUser.password,
        nombre: newUser.nombre.trim(),
        apellido: newUser.apellido.trim(),
        telefono: newUser.telefono.trim() || undefined,
        rol: newUser.rol,
      })

      setCreateSuccess('Usuario creado correctamente')
      setNewUser({ nombre: '', apellido: '', email: '', telefono: '', password: '', rol: 'Cliente' })

      const data = await getAdminUsers(token, roleFilter)
      const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
      setUsers(filtered)
    } catch (error) {
      setCreateError((error as Error).message)
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteProductImage = async (imageId: number) => {
    if (!token || !editingProduct) return
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar esta imagen?')
    if (!confirmDelete) return

    try {
      await deleteProductImage(token, imageId)

      try {
        const images = await getProductImages(token, editingProduct.id)
        setEditingProductImages(images)
      } catch (innerError) {
        console.error('Error recargando imágenes de producto después de eliminar:', innerError)
      }

      try {
        setLoadingProducts(true)
        const data = await getProducts(token)
        setProducts(data)
      } catch (innerError) {
        console.error('Error recargando productos después de eliminar imagen:', innerError)
      } finally {
        setLoadingProducts(false)
      }
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleSetProductMainImage = async (imageId: number) => {
    if (!token || !editingProduct) return

    try {
      await setProductMainImage(token, imageId)

      try {
        const images = await getProductImages(token, editingProduct.id)
        setEditingProductImages(images)
      } catch (innerError) {
        console.error('Error recargando imágenes de producto después de marcar principal:', innerError)
      }

      try {
        setLoadingProducts(true)
        const data = await getProducts(token)
        setProducts(data)
      } catch (innerError) {
        console.error('Error recargando productos después de marcar principal:', innerError)
      } finally {
        setLoadingProducts(false)
      }
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product)
    setEditProductForm({
      nombre: product.nombre,
      descripcion: product.descripcion ?? '',
      precio: Number(product.precio),
      stock: product.stock,
      sku: product.sku,
      marca: product.marca ?? '',
      id_categoria: product.id_categoria,
      activo: product.activo,
    })
    setUpdateProductError(null)
    setEditingProductImages([])
    if (token) {
      setLoadingEditingProductImages(true)
      void getProductImages(token, product.id)
        .then((images) => {
          setEditingProductImages(images)
        })
        .catch((error) => {
          console.error('Error al obtener imágenes del producto:', error)
        })
        .finally(() => {
          setLoadingEditingProductImages(false)
        })
    }
    setEditProductModalOpen(true)
  }

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingProduct || !editProductForm) return

    if (!editProductForm.nombre.trim() || !editProductForm.sku.trim()) {
      setUpdateProductError('Nombre y SKU son obligatorios')
      return
    }

    if (editProductForm.precio <= 0 || editProductForm.stock < 0) {
      setUpdateProductError('Precio y stock deben ser válidos')
      return
    }

    setUpdatingProduct(true)
    setUpdateProductError(null)

    try {
      const updated = await updateProduct(token, editingProduct.id, {
        ...editProductForm,
        nombre: editProductForm.nombre.trim(),
        sku: editProductForm.sku.trim(),
        descripcion: editProductForm.descripcion?.trim() || null,
        marca: editProductForm.marca?.trim() || null,
      })

      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setEditProductModalOpen(false)
      setEditingProduct(null)
      setEditProductForm(null)
    } catch (error) {
      setUpdateProductError((error as Error).message)
    } finally {
      setUpdatingProduct(false)
    }
  }

  const handleUploadImagesForEditingProduct = async (files: FileList) => {
    if (!token || !editingProduct) return
    setUploadingProductImages(true)
    try {
      const response = await uploadProductImages(token, editingProduct.id, files)
      const addedImages = response.images ?? []

      // Actualizar en memoria el conteo de imágenes y, si aplica, la imagen principal
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== editingProduct.id) return p
          const currentCount = p.imagenes_count ?? 0
          const newCount = currentCount + addedImages.length
          const newPrincipalFromUpload = addedImages.find((img) => img.es_principal)?.url_imagen ?? null
          return {
            ...p,
            imagenes_count: newCount,
            imagen_principal: p.imagen_principal ?? newPrincipalFromUpload ?? p.imagen_principal ?? null,
          }
        }),
      )

      // Recargar imágenes del producto para la gestión en el modal
      try {
        const images = await getProductImages(token, editingProduct.id)
        setEditingProductImages(images)
      } catch (innerError) {
        console.error('Error recargando imágenes de producto después de subir:', innerError)
      }
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setUploadingProductImages(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!token) return
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este producto?')
    if (!confirmDelete) return

    try {
      await deleteProduct(token, productId)

      try {
        setLoadingProducts(true)
        const data = await getProducts(token)
        setProducts(data)
      } catch (error) {
        console.error('Error recargando productos después de eliminar producto:', error)
      } finally {
        setLoadingProducts(false)
      }
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!token) return
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este usuario?')
    if (!confirmDelete) return

    try {
      await deleteAdminUser(token, userId)
      const data = await getAdminUsers(token, roleFilter)
      const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
      setUsers(filtered)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const toggleProductSelected = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    )
  }

  const toggleSelectAllProducts = (ids: number[]) => {
    const allSelected = ids.every((id) => selectedProductIds.includes(id))
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  const handleOpenLotModal = () => {
    if (selectedProductIds.length === 0) return
    const initial: Record<number, string> = {}
    selectedProductIds.forEach((id) => {
      initial[id] = lotQuantities[id] ?? '20'
    })
    setLotQuantities(initial)
    setLotError(null)
    setLotSuccess(null)
    setLotModalOpen(true)
  }

  const handleChangeLotQuantity = (id: number, value: string) => {
    setLotQuantities((prev) => ({ ...prev, [id]: value }))
  }

  const handleRegisterLot = async () => {
    if (!token) return
    setLotError(null)
    setLotSuccess(null)

    const invalid = selectedProductIds.find((id) => {
      const qty = Number(lotQuantities[id])
      return !Number.isFinite(qty) || qty < 20
    })
    if (invalid != null) {
      setLotError('Cada producto debe tener una cantidad mínima de 20 unidades')
      return
    }

    try {
      setLotLoading(true)
      for (const id of selectedProductIds) {
        const qty = Number(lotQuantities[id])
        await registerProductLot(token, id, qty)
      }

      // Recargar productos desde el backend para asegurar que el stock mostrado coincida con la base de datos
      try {
        setLoadingProducts(true)
        const data = await getProducts(token)
        setProducts(data)
      } catch (innerError) {
        console.error('Error recargando productos después de registrar lotes:', innerError)
      } finally {
        setLoadingProducts(false)
      }

      setLotSuccess('Lotes registrados correctamente')
      setSelectedProductIds([])
      setLotModalOpen(false)
    } catch (error) {
      setLotError((error as Error).message)
    } finally {
      setLotLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!newCategory.nombre.trim()) {
      setCreateCategoryError('El nombre de la categoría es obligatorio')
      return
    }

    setCreatingCategory(true)
    setCreateCategoryError(null)

    try {
      const parentId = newCategory.parent_id.trim()
      await createCategory(token, {
        nombre: newCategory.nombre.trim(),
        descripcion: newCategory.descripcion.trim() || null,
        parent_id: parentId ? Number(parentId) : null,
      })

      try {
        setLoadingCategories(true)
        const data = await getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error recargando categorías después de crear categoría:', error)
      } finally {
        setLoadingCategories(false)
      }

      setNewCategory({ nombre: '', descripcion: '', parent_id: '' })
    } catch (error) {
      setCreateCategoryError((error as Error).message)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!token) return
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar esta categoría?')
    if (!confirmDelete) return

    try {
      await deleteCategory(token, categoryId)

      try {
        setLoadingCategories(true)
        const data = await getCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error recargando categorías después de eliminar categoría:', error)
      } finally {
        setLoadingCategories(false)
      }
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const resetAndCloseProductModal = () => {
    setProductForm({
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      sku: '',
      marca: '',
      id_categoria: 1,
      activo: true,
    })
    setCreateProductError(null)
    setProductModalOpen(false)
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!productForm.nombre.trim() || !productForm.sku.trim()) {
      setCreateProductError('Nombre y SKU son obligatorios')
      return
    }

    if (productForm.precio <= 0 || productForm.stock < 0) {
      setCreateProductError('Precio y stock deben ser válidos')
      return
    }

    setCreatingProduct(true)
    setCreateProductError(null)

    try {
      await createProduct(token, {
        nombre: productForm.nombre.trim(),
        descripcion: productForm.descripcion?.trim() || null,
        precio: productForm.precio,
        stock: productForm.stock,
        sku: productForm.sku.trim(),
        marca: productForm.marca?.trim() || null,
        id_categoria: productForm.id_categoria,
        activo: productForm.activo,
      })

      try {
        setLoadingProducts(true)
        const data = await getProducts(token)
        setProducts(data)
      } catch (error) {
        console.error('Error recargando productos después de crear producto:', error)
      } finally {
        setLoadingProducts(false)
      }

      resetAndCloseProductModal()
    } catch (error) {
      setCreateProductError((error as Error).message)
    } finally {
      setCreatingProduct(false)
    }
  }

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen">
      <div className="flex min-h-screen w-full">
        <AdminSidebar
          activeSection={activeSection}
          onChangeSection={handleSectionChange}
          onLogout={handleLogout}
          role={authUser?.rol}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-background-light dark:bg-background-dark">
          <AdminHeader
            theme={theme}
            onToggleTheme={toggleTheme}
            authUser={authUser}
            apiUrl={API_URL}
            getInitials={getInitials}
            onOpenProfile={() => handleSectionChange('profile')}
          />

          {activeSection === 'dashboard' && statsError && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {statsError}
            </p>
          )}
          {activeSection === 'dashboard' && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-primary to-accent text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-80">Usuarios Registrados (Hoy)</p>
                      <p className="text-3xl font-bold">
                        {loadingStats ? '...' : stats?.usuarios.hoy ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-white/15 rounded-full">
                      <span className="material-symbols-outlined text-3xl text-white">today</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-accent">Usuarios Registrados (Semana)</p>
                      <p className="text-3xl font-bold">
                        {loadingStats ? '...' : stats?.usuarios.semana ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/20 rounded-full">
                      <span className="material-symbols-outlined text-3xl text-accent">calendar_view_week</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-accent">Usuarios Registrados (Mes)</p>
                      <p className="text-3xl font-bold">
                        {loadingStats ? '...' : stats?.usuarios.mes ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/20 rounded-full">
                      <span className="material-symbols-outlined text-3xl text-accent">calendar_month</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-accent/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-accent">Productos Vendidos (Hoy)</p>
                      <p className="text-3xl font-bold">
                        {loadingStats ? '...' : stats?.productos.vendidosHoy ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/20 rounded-full">
                      <span className="material-symbols-outlined text-3xl text-accent">shopping_cart</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
                  <h2 className="text-xl font-semibold mb-4">Estadísticas de Ventas</h2>
                  <div className="h-80 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SalesPieChart
                      title="Top 10 productos más vendidos"
                      data={
                        stats
                          ? stats.productos.masVendidos
                              .slice(0, 10)
                              .map((item) => ({ label: item.nombre, value: item.total_vendidos }))
                          : []
                      }
                    />

                    <SalesPieChart
                      title="Top 5 subcategorías con más ventas"
                      data={(() => {
                        if (!stats || products.length === 0 || categories.length === 0) return []

                        const subcategoryMap = new Map<number, PieDatum>()

                        for (const item of stats.productos.masVendidos) {
                          const product = products.find((p) => p.id === item.id_producto)
                          if (!product) continue
                          const category = categories.find((c) => c.id === product.id_categoria)
                          if (!category || category.parent_id == null) continue

                          const existing = subcategoryMap.get(category.id)
                          if (existing) {
                            existing.value += item.total_vendidos
                          } else {
                            subcategoryMap.set(category.id, {
                              label: category.nombre,
                              value: item.total_vendidos,
                            })
                          }
                        }

                        return Array.from(subcategoryMap.values())
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 5)
                      })()}
                    />
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-accent/40">
                  <h2 className="text-xl font-semibold mb-4">Productos Más Vendidos</h2>
                  <ul className="space-y-4">
                    {loadingStats && !stats && (
                      <li className="text-sm text-gray-500 dark:text-gray-400">Cargando productos más vendidos...</li>
                    )}
                    {!loadingStats && stats?.productos.masVendidos.length === 0 && (
                      <li className="text-sm text-gray-500 dark:text-gray-400">No hay datos de ventas recientes.</li>
                    )}
                    {stats?.productos.masVendidos.map((item) => (
                      <li key={item.id_producto} className="flex items-center justify-between">
                        <span>{item.nombre}</span>
                        <span className="font-bold">{item.total_vendidos} uds.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/40">
                <h2 className="text-xl font-semibold mb-4 text-primary dark:text-accent">Acciones Rápidas: Aplicar Descuentos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-light dark:focus:ring-offset-card-dark focus:ring-primary text-white text-sm font-bold leading-normal tracking-wide transition-colors">
                    <span>Laptops</span>
                  </button>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-light dark:focus:ring-offset-card-dark focus:ring-accent text-white text-sm font-bold leading-normal tracking-wide transition-colors">
                    <span>Smartphones</span>
                  </button>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/90 hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-light dark:focus:ring-offset-card-dark focus:ring-primary text-white text-sm font-bold leading-normal tracking-wide transition-colors">
                    <span>Periféricos</span>
                  </button>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-accent/90 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-light dark:focus:ring-offset-card-dark focus:ring-accent text-white text-sm font-bold leading-normal tracking-wide transition-colors">
                    <span>Monitores</span>
                  </button>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-light dark:focus:ring-offset-card-dark focus:ring-primary text-white text-sm font-bold leading-normal tracking-wide transition-colors">
                    <span>Componentes</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {activeSection === 'users' && (
            <AdminUsersSection
              users={users}
              loadingUsers={loadingUsers}
              usersError={usersError}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              onSelectUser={setSelectedUser}
              onDeleteUser={handleDeleteUser}
              newUser={newUser}
              onChangeNewUser={setNewUser}
              createError={createError}
              createSuccess={createSuccess}
              onCreateUser={handleCreateUser}
            />
          )}

          {activeSection === 'categories' && (
            <AdminCategoriesSection
              categories={categories}
              loadingCategories={loadingCategories}
              categoriesError={categoriesError}
              newCategory={newCategory}
              creatingCategory={creatingCategory}
              createCategoryError={createCategoryError}
              onDeleteCategory={handleDeleteCategory}
              onChangeNewCategory={setNewCategory}
              onCreateCategory={handleCreateCategory}
            />
          )}

          {activeSection === 'orders' && (
            <AdminOrdersSection
              orders={orders}
              loadingOrders={loadingOrders}
              ordersError={ordersError}
              onSelectOrder={setSelectedOrder}
            />
          )}

          {activeSection === 'returns' && <AdminReturnsPage />}

          {activeSection === 'promotions' && <AdminPromotionsPage />}

          {activeSection === 'profile' && <AdminProfilePage />}

          {activeSection === 'products' && (
            <AdminProductsSection
              products={products}
              loadingProducts={loadingProducts}
              productsError={productsError}
              productSearch={productSearch}
              selectedProductIds={selectedProductIds}
              onChangeProductSearch={setProductSearch}
              onOpenProductModal={() => {
                setCreateProductError(null)
                setCreateProductSuccess(null)
                setProductModalOpen(true)
              }}
              onOpenPromotionModal={() => {
                if (selectedProductIds.length > 0) {
                  setPromotionModalOpen(true)
                }
              }}
              onToggleProductSelected={toggleProductSelected}
              onToggleSelectAllProducts={toggleSelectAllProducts}
              onOpenLotModal={handleOpenLotModal}
              onDeleteProduct={handleDeleteProduct}
              onEditProduct={handleEditProductClick}
              inventoryHistory={inventoryHistory}
              loadingInventoryHistory={loadingInventoryHistory}
              inventoryHistoryError={inventoryHistoryError}
            />
          )}

          <ProductLotModal
            open={lotModalOpen}
            products={products}
            selectedProductIds={selectedProductIds}
            lotQuantities={lotQuantities}
            lotError={lotError}
            lotSuccess={lotSuccess}
            lotLoading={lotLoading}
            onChangeLotQuantity={handleChangeLotQuantity}
            onClose={() => {
              if (!lotLoading) {
                setLotModalOpen(false)
              }
            }}
            onConfirm={handleRegisterLot}
          />

          <ProductCreateModal
            open={productModalOpen}
            productForm={productForm}
            categories={categories}
            loadingCategories={loadingCategories}
            categoriesError={categoriesError}
            createProductError={createProductError}
            creatingProduct={creatingProduct}
            title="Añadir nuevo producto"
            submitLabel={creatingProduct ? 'Creando producto...' : 'Crear producto'}
            onChangeProductForm={setProductForm}
            onClose={() => {
              if (!creatingProduct) {
                resetAndCloseProductModal()
              }
            }}
            onSubmit={handleCreateProduct}
          />

          {editingProduct && editProductForm && (
            <ProductCreateModal
              open={editProductModalOpen}
              productForm={editProductForm}
              categories={categories}
              loadingCategories={loadingCategories}
              categoriesError={categoriesError}
              createProductError={updateProductError}
              creatingProduct={updatingProduct}
              title="Editar producto"
              submitLabel={updatingProduct ? 'Guardando cambios...' : 'Guardar cambios'}
              onUploadImages={handleUploadImagesForEditingProduct}
              uploadingImages={uploadingProductImages}
              existingImages={editingProductImages}
              loadingExistingImages={loadingEditingProductImages}
              onDeleteImage={handleDeleteProductImage}
              onSetPrincipalImage={handleSetProductMainImage}
              apiUrl={API_URL}
              onChangeProductForm={(updater) => {
                setEditProductForm((prev) => (prev ? updater(prev) : prev))
              }}
              onClose={() => {
                if (!updatingProduct) {
                  setEditProductModalOpen(false)
                  setEditingProduct(null)
                  setEditProductForm(null)
                }
              }}
              onSubmit={handleUpdateProductSubmit}
            />
          )}

          <ProductPromotionModal
            open={promotionModalOpen}
            token={token}
            selectedProducts={products.filter((p) => selectedProductIds.includes(p.id))}
            onClose={() => setPromotionModalOpen(false)}
          />

          {selectedOrder && (
            <AdminOrderDetailsModal order={selectedOrder} token={token} onClose={() => setSelectedOrder(null)} />
          )}

          {selectedUser && (
            <AdminUserDetailsModal selectedUser={selectedUser} apiUrl={API_URL} onClose={() => setSelectedUser(null)} />
          )}
</main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
