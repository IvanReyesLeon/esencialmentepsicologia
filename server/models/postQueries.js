const { query, getClient } = require('../config/db');
const { generateSlug } = require('./therapistQueries'); // Reusing existing helper if available or standardizing

// Helper fallback if not exported from therapistQueries
const makeSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Spaces to -
        .replace(/[^\w\-]+/g, '') // Remove non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
};

const getAllPosts = async (includePublishedOnly = true) => {
    const whereClause = includePublishedOnly ? 'WHERE published = true' : '';
    const result = await query(`
        SELECT * FROM posts 
        ${whereClause} 
        ORDER BY created_at DESC
    `);
    return result.rows;
};

const getPostBySlug = async (slug) => {
    const result = await query('SELECT * FROM posts WHERE slug = $1', [slug]);
    return result.rows[0];
};

const createPost = async (postData) => {
    const { title, content, image_url, excerpt, meta_title, meta_description, published } = postData;
    let slug = postData.slug || makeSlug(title);

    // Ensure unique slug
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
        const existing = await query('SELECT id FROM posts WHERE slug = $1', [uniqueSlug]);
        if (existing.rows.length === 0) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    const result = await query(`
        INSERT INTO posts (
            title, slug, content, image_url, excerpt, 
            meta_title, meta_description, published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [title, uniqueSlug, content, image_url, excerpt, meta_title, meta_description, published || false]);

    return result.rows[0];
};

const updatePost = async (id, updates) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const fields = [];
        const values = [];
        let paramCount = 1;
        const allowedFields = ['title', 'slug', 'content', 'image_url', 'excerpt', 'meta_title', 'meta_description', 'published'];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                fields.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        values.push(id);
        const result = await client.query(
            `UPDATE posts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
            values
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const deletePost = async (id) => {
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = {
    getAllPosts,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
};
