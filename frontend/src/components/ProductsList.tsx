import { useState } from 'react'
import { getProducts, type Product } from '../services/products'
import type { AuthUser } from '../services/auth'

interface ProductsListProps {
  user: AuthUser
  token: string
}

function ProductsList({ user, token }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts(token)
      setProducts(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h2>Usuario autenticado</h2>
      <p>
        {user.nombre} {user.apellido} ({user.email}) - Rol: {user.rol}
      </p>
      <button onClick={handleLoadProducts} disabled={loading}>
        {loading ? 'Cargando...' : 'Cargar productos'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {products.length > 0 && (
        <ul style={{ marginTop: '1rem', textAlign: 'left' }}>
          {products.map((p) => (
            <li key={p.id}>
              {p.nombre} - S/ {p.precio} (stock: {p.stock})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ProductsList
