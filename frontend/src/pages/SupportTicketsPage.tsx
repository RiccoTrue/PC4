import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface StoredAuth {
  token: string
}

interface SupportTicket {
  id_ticket: number
  id_usuario: number
  id_pedido: number | null
  asunto: string
  descripcion: string
  prioridad: string
  estado: string
  fecha_creacion: string
  fecha_actualizacion: string
}

interface TicketMessage {
  id_mensaje: number
  id_ticket: number
  id_usuario: number
  mensaje: string
  es_agente: boolean
  fecha_envio: string
  nombre: string
  apellido: string
  rol: string
}

interface TicketWithMessages {
  ticket: {
    id_ticket: number
    id_usuario: number
    id_pedido: number | null
  }
  messages: TicketMessage[]
}

function SupportTicketsPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const pedidoFilter = searchParams.get('pedido')

  const [token, setToken] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketThread, setTicketThread] = useState<TicketWithMessages | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as StoredAuth
      if (parsed.token) setToken(parsed.token)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const url = new URL(`${API_URL}/api/support/tickets/mine`)
        if (pedidoFilter) url.searchParams.set('pedido', pedidoFilter)

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'No se pudieron cargar los tickets de soporte')
        }
        const data = (await res.json()) as SupportTicket[]
        setTickets(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token, pedidoFilter])

  const loadThread = async (ticket: SupportTicket) => {
    if (!token) return
    setSelectedTicket(ticket)
    setThreadLoading(true)
    setThreadError(null)
    setTicketThread(null)
    setNewMessage('')

    try {
      const res = await fetch(`${API_URL}/api/support/tickets/${ticket.id_ticket}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'No se pudieron cargar los mensajes del ticket')
      }
      const data = (await res.json()) as TicketWithMessages
      setTicketThread(data)
    } catch (e) {
      setThreadError((e as Error).message)
    } finally {
      setThreadLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!token || !selectedTicket || !newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/api/support/tickets/${selectedTicket.id_ticket}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensaje: newMessage.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'No se pudo enviar el mensaje')
      }
      setNewMessage('')
      await loadThread(selectedTicket)
    } catch (e) {
      setThreadError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="layout-container flex h-full grow flex-col">
      <div className="flex flex-1">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          <h1 className="text-black dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Centro de soporte
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Mis tickets de soporte</h2>
              {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando tickets...</p>}
              {error && !loading && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">{error}</p>
              )}
              {!loading && !error && tickets.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aún no tienes tickets de soporte asociados a tus pedidos.
                </p>
              )}

              <ul className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
                {tickets.map((t) => (
                  <li key={t.id_ticket} className="py-3 cursor-pointer" onClick={() => void loadThread(t)}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.asunto}</p>
                        {t.id_pedido && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{t.id_pedido}</p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Actualizado: {formatDateTime(t.fecha_actualizacion)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {t.estado}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            t.prioridad === 'Alta'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          Prioridad: {t.prioridad}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Conversación con soporte</h2>
              {!selectedTicket && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Selecciona un ticket de la lista para ver y continuar la conversación con nuestro equipo.
                </p>
              )}
              {selectedTicket && (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Ticket #{selectedTicket.id_ticket}{' '}
                    {selectedTicket.id_pedido ? `· Pedido #${selectedTicket.id_pedido}` : ''}
                  </p>
                  {threadError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                      {threadError}
                    </p>
                  )}
                  {threadLoading && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Cargando mensajes...</p>
                  )}

                  <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-3 mb-3 max-h-80">
                    {ticketThread?.messages.length ? (
                      ticketThread.messages.map((m) => (
                        <div key={m.id_mensaje} className="mb-3">
                          <div className="flex justify-between items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {m.nombre} {m.apellido}{' '}
                              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                {m.es_agente ? '(Soporte)' : ''}
                              </span>
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {formatDateTime(m.fecha_envio)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {m.mensaje}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Aún no hay mensajes en este ticket.</p>
                    )}
                  </div>

                  {selectedTicket.estado !== 'Cerrado' && (
                    <div className="mt-auto flex flex-col gap-2">
                      <textarea
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Escribe tu mensaje para soporte"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={sending || !newMessage.trim()}
                          onClick={() => void sendMessage()}
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Enviar mensaje
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTicket.estado === 'Cerrado' && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Este ticket está cerrado y no admite nuevos mensajes.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportTicketsPage
