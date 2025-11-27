import { query } from '../database/connection.js'

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?.id
    const role = req.user?.rol
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { pedido } = req.query
    const params = []
    let where = '1=1'

    // Clientes: solo ven sus propios tickets
    if (role !== 'Admin' && role !== 'Agente') {
      params.push(userId)
      where += ` AND "id_usuario" = $${params.length}`
    }

    // Filtro por pedido (para clientes y staff)
    if (pedido) {
      params.push(Number(pedido))
      where += ` AND "id_pedido" = $${params.length}`
    }

    const result = await query(
      `SELECT "id_ticket", "id_usuario", "id_pedido", "asunto", "descripcion", "prioridad", "estado", "id_agente_asignado", "fecha_creacion", "fecha_actualizacion"
       FROM "TICKETS_SOPORTE"
       WHERE ${where}
       ORDER BY "fecha_creacion" DESC`,
      params,
    )

    return res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener tickets de soporte:', error)
    return res.status(500).json({ message: 'No se pudieron cargar los tickets de soporte' })
  }
}

export const getTicketMessages = async (req, res) => {
  try {
    const userId = req.user?.id
    const role = req.user?.rol
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { id } = req.params
    const ticketId = Number(id)
    if (!ticketId) {
      return res.status(400).json({ message: 'ID de ticket inválido' })
    }

    const ticketResult = await query(
      'SELECT "id_ticket", "id_usuario", "id_pedido" FROM "TICKETS_SOPORTE" WHERE "id_ticket" = $1',
      [ticketId],
    )

    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' })
    }

    const ticket = ticketResult.rows[0]

    const isOwner = ticket.id_usuario === userId
    const isStaff = role === 'Admin' || role === 'Agente'

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'No autorizado para ver este ticket' })
    }

    const messagesResult = await query(
      `SELECT m."id_mensaje", m."id_ticket", m."id_usuario", m."mensaje", m."es_agente", m."fecha_envio",
              u."nombre", u."apellido", u."rol"
       FROM "MENSAJES_TICKET" m
       JOIN "USUARIOS" u ON u."id_usuario" = m."id_usuario"
       WHERE m."id_ticket" = $1
       ORDER BY m."fecha_envio" ASC`,
      [ticketId],
    )

    return res.json({ ticket, messages: messagesResult.rows })
  } catch (error) {
    console.error('Error al obtener mensajes de ticket:', error)
    return res.status(500).json({ message: 'No se pudieron cargar los mensajes del ticket' })
  }
}

export const createTicketMessage = async (req, res) => {
  try {
    const userId = req.user?.id
    const role = req.user?.rol
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { id } = req.params
    const ticketId = Number(id)
    const { mensaje } = req.body

    if (!ticketId) {
      return res.status(400).json({ message: 'ID de ticket inválido' })
    }

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length < 1) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' })
    }

    const ticketResult = await query(
      'SELECT "id_ticket", "id_usuario", "estado" FROM "TICKETS_SOPORTE" WHERE "id_ticket" = $1',
      [ticketId],
    )

    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' })
    }

    const ticket = ticketResult.rows[0]
    const isOwner = ticket.id_usuario === userId
    const isStaff = role === 'Admin' || role === 'Agente'

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'No autorizado para responder este ticket' })
    }

    if (ticket.estado === 'Cerrado') {
      return res.status(400).json({ message: 'El ticket está cerrado y no admite nuevos mensajes' })
    }

    const esAgente = !!isStaff

    await query(
      'INSERT INTO "MENSAJES_TICKET" ("id_ticket", "id_usuario", "mensaje", "es_agente") VALUES ($1, $2, $3, $4)',
      [ticketId, userId, mensaje.trim(), esAgente],
    )

    await query(
      'UPDATE "TICKETS_SOPORTE" SET "fecha_actualizacion" = CURRENT_TIMESTAMP WHERE "id_ticket" = $1',
      [ticketId],
    )

    return res.status(201).json({ message: 'Mensaje enviado correctamente' })
  } catch (error) {
    console.error('Error al crear mensaje de ticket:', error)
    return res.status(500).json({ message: 'No se pudo enviar el mensaje' })
  }
}
