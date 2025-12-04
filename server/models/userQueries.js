const { query, getClient } = require('../config/db');
const bcrypt = require('bcryptjs');

// Crear usuario
const createUser = async (username, email, password, role = 'admin') => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, hashedPassword, role]
    );
    return result.rows[0];
};

// Buscar usuario por email
const findUserByEmail = async (email) => {
    const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0];
};

// Buscar usuario por ID
const findUserById = async (id) => {
    const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

// Verificar contraseña
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// Actualizar usuario
const updateUser = async (id, updates) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
        if (key === 'password') {
            // Hash password if updating
            values.push(bcrypt.hashSync(updates[key], 10));
        } else {
            values.push(updates[key]);
        }
        fields.push(`${key} = $${paramCount}`);
        paramCount++;
    });

    values.push(id);

    const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
};

// Eliminar usuario (soft delete)
const deactivateUser = async (id) => {
    const result = await query(
        'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    verifyPassword,
    updateUser,
    deactivateUser
};
