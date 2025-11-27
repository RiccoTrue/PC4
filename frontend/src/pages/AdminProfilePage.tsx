import React, { useEffect, useState } from 'react'
import type { AuthUser } from '../services/auth'
import type { UserProfile } from '../services/user'
import { getMe, updateMe, uploadAvatar, deleteAvatar } from '../services/user'
import { changePassword } from '../services/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const AdminProfilePage: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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
    const loadProfile = async () => {
      if (!token) return
      setLoadingProfile(true)
      setProfileError(null)
      try {
        const data = await getMe(token)
        setProfile(data)
        setNombre(data.nombre)
        setApellido(data.apellido)
        setTelefono(data.telefono ?? '')
        setAvatarPreview(data.url_img || null)
      } catch (e) {
        setProfileError((e as Error).message)
      } finally {
        setLoadingProfile(false)
      }
    }

    void loadProfile()
  }, [token])

  const syncAuthStorage = (partial: Partial<AuthUser>) => {
    const stored = localStorage.getItem('auth')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as { user?: AuthUser | null; token?: string }
      const updatedUser: AuthUser | null = parsed.user
        ? { ...parsed.user, ...partial }
        : null
      localStorage.setItem('auth', JSON.stringify({ ...parsed, user: updatedUser }))
      setAuthUser(updatedUser)
    } catch {
      // ignore
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !profile) return

    setProfileError(null)
    setProfileSuccess(null)
    setLoadingProfile(true)
    try {
      const updated = await updateMe(token, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
      })
      setProfile(updated)
      setProfileSuccess('Perfil actualizado correctamente')
      syncAuthStorage({ nombre: updated.nombre, apellido: updated.apellido })
      if (updated.token) {
        const stored = localStorage.getItem('auth')
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { user?: AuthUser | null; token?: string }
            const newAuth = { ...parsed, token: updated.token }
            localStorage.setItem('auth', JSON.stringify(newAuth))
            setToken(updated.token)
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      setProfileError((e as Error).message)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setPasswordError(null)
    setPasswordSuccess(null)
    setChangingPassword(true)
    try {
      await changePassword(token, { currentPassword, newPassword, confirmPassword })
      setPasswordSuccess('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setPasswordError((e as Error).message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) return
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)
    setAvatarSuccess(null)
    setUploadingAvatar(true)
    try {
      const { url_img } = await uploadAvatar(token, file)
      setAvatarPreview(url_img)
      syncAuthStorage({ url_img, foto: !!url_img })
      setAvatarSuccess('Imagen de perfil actualizada')
    } catch (e) {
      setAvatarError((e as Error).message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!token) return
    setAvatarError(null)
    setAvatarSuccess(null)
    setUploadingAvatar(true)
    try {
      await deleteAvatar(token)
      setAvatarPreview(null)
      syncAuthStorage({ url_img: null, foto: false })
      setAvatarSuccess('Imagen de perfil eliminada')
    } catch (e) {
      setAvatarError((e as Error).message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="flex w-full justify-center px-4 py-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <header>
          <p className="text-black dark:text-white text-3xl font-bold font-display leading-tight tracking-tight">
            Perfil del administrador
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center text-center">
            <h3 className="text-black dark:text-white text-lg font-bold leading-tight tracking-tight pb-6">
              Foto de perfil
            </h3>

            {avatarError && (
              <p className="mb-3 w-full text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left">
                {avatarError}
              </p>
            )}
            {avatarSuccess && (
              <p className="mb-3 w-full text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-left">
                {avatarSuccess}
              </p>
            )}

            <div className="mb-4 flex flex-col items-center gap-4">
              {avatarPreview ? (
                <img
                  alt="Avatar"
                  className="size-40 rounded-full object-cover border border-primary/40"
                  src={avatarPreview.startsWith('http') ? avatarPreview : `${API_URL}${avatarPreview}`}
                />
              ) : (
                <div className="size-40 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-semibold border border-primary/20">
                  {authUser ? authUser.nombre.charAt(0).toUpperCase() : 'A'}
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <label className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold cursor-pointer hover:bg-primary/90 text-sm">
                  <span>Subir nueva</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    Eliminar imagen
                  </button>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-1">Máx. 2MB, solo imágenes.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10">
              <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">
                Datos de perfil
              </h2>
              {profileError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 border-emerald-200 rounded-lg px-3 py-2">
                  {profileSuccess}
                </p>
              )}

              {loadingProfile && !profile ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Cargando perfil...</p>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nombre</label>
                      <input
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Apellido</label>
                      <input
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium mb-1">Teléfono</label>
                      <input
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loadingProfile}
                      className="flex items-center justify-center px-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingProfile ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10">
              <h3 className="text-black dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">
                Cambiar contraseña
              </h3>
              {passwordError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {passwordSuccess}
                </p>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">Contraseña actual</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center justify-center px-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminProfilePage
