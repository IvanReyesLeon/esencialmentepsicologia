const { query } = require('../config/db');

// Crear mensaje de contacto
const createContactMessage = async (name, email, phone, subject, message) => {
    const result = await query(`
    INSERT INTO contact_messages (name, email, phone, subject, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name, email, phone, subject, message]);

    return result.rows[0];
};

// Obtener todos los mensajes (para panel admin)
const getAllMessages = async (limit = 100, offset = 0) => {
    const result = await query(`
    SELECT * FROM contact_messages
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

    return result.rows;
};

// Obtener mensajes no leídos
const getUnreadMessages = async () => {
    const result = await query(`
    SELECT * FROM contact_messages
    WHERE is_read = false
    ORDER BY created_at DESC
  `);

    return result.rows;
};

// Obtener mensaje por ID
const getMessageById = async (id) => {
    const result = await query(
        'SELECT * FROM contact_messages WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

// Marcar mensaje como leído
const markAsRead = async (id) => {
    const result = await query(
        'UPDATE contact_messages SET is_read = true WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Marcar mensaje como no leído
const markAsUnread = async (id) => {
    const result = await query(
        'UPDATE contact_messages SET is_read = false WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Eliminar mensaje
const deleteMessage = async (id) => {
    const result = await query(
        'DELETE FROM contact_messages WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Obtener estadísticas
const getMessageStats = async () => {
    const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_read = false) as unread,
      COUNT(*) FILTER (WHERE is_read = true) as read
    FROM contact_messages
  `);

    return result.rows[0];
};

module.exports = {
    createContactMessage,
    getAllMessages,
    getUnreadMessages,
    getMessageById,
    markAsRead,
    markAsUnread,
    deleteMessage,
    getMessageStats
};
