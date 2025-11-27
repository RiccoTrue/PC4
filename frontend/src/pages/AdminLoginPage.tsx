import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, type AuthUser } from '../services/auth'

interface AuthResponse {
  token: string
  user: AuthUser
}

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu usuario o email y contraseña')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = (await login(email.trim(), password, { portal: 'admin' })) as AuthResponse

      if (res.user.rol !== 'Admin' && res.user.rol !== 'Agente') {
        setError('No tienes permisos para acceder al panel de administración')
        setLoading(false)
        return
      }

      localStorage.setItem('auth', JSON.stringify({ user: res.user, token: res.token }))
      if (res.user.rol === 'Agente') {
        navigate('/agent', { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-display">
      <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 overflow-x-hidden">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-[#e0dcd1] dark:bg-[#354F52] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-1">
            <img
              src="/img/logo.png"
              alt="TechMate"
              className="h-20 object-contain mb-1"
            />
            <h1 className="text-[#2F3E46] dark:text-[#CAD2C5] text-sm font-medium tracking-wide text-center uppercase">
              Iniciar sesión
            </h1>
          </div>

          {error && (
            <p className="w-full text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="flex flex-col w-full">
              <label htmlFor="admin-email" className="flex flex-col flex-1">
                <p className="text-[#2F3E46] dark:text-[#CAD2C5] text-sm font-medium leading-normal pb-2">
                  Usuario o Email
                </p>
                <input
                  id="admin-email"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#2F3E46] dark:text-white focus:outline-0 border-transparent bg-background-light dark:bg-[#2A3D45] focus:ring-2 focus:ring-primary h-12 placeholder:text-[#84A98C] px-4 text-base font-normal leading-normal"
                  placeholder="Introduce tu usuario o email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </label>
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="admin-password" className="flex flex-col flex-1">
                <p className="text-[#2F3E46] dark:text-[#CAD2C5] text-sm font-medium leading-normal pb-2">Contraseña</p>
                <div className="flex w-full flex-1 items-stretch">
                  <input
                    id="admin-password"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#2F3E46] dark:text-white focus:outline-0 border-transparent bg-background-light dark:bg-[#2A3D45] focus:ring-2 focus:ring-primary h-12 placeholder:text-[#84A98C] px-4 border-r-0 pr-2 text-base font-normal leading-normal"
                    placeholder="Introduce tu contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label="Mostrar u ocultar contraseña"
                    className="text-[#84A98C] flex bg-background-light dark:bg-[#2A3D45] items-center justify-center pr-4 rounded-r-lg border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
            </div>

            <div className="pt-4 flex w-full">
              <button
                type="submit"
                disabled={loading}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#e0dcd1] dark:focus:ring-offset-[#354F52] focus:ring-primary text-white text-base font-bold leading-normal tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="truncate">{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
