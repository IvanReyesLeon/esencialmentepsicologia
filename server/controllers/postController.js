const postQueries = require('../models/postQueries');

exports.getAllPosts = async (req, res) => {
    try {
        // Public API returns only published, Admin API (if needed) might filter differently
        // For now, let's assume public logic on the main GET
        // If query param ?admin=true is passed (and auth checked), return all
        // Check if user is admin is done in middleware usually, here we just check a flag potentially passed by the route handler

        // However, a common pattern: Public endpoint /api/posts returns published.
        // Protected Admin endpoint /api/admin/posts returns all.
        // Let's implement a single endpoint with query param for now, controlled by role in future if strict.

        const isAdmin = req.query.admin === 'true'; // Simplified for this context
        const posts = await postQueries.getAllPosts(!isAdmin);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getPostBySlug = async (req, res) => {
    try {
        const post = await postQueries.getPostBySlug(req.params.slug);
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.createPost = async (req, res) => {
    try {
        const postData = { ...req.body };

        // Handle image upload
        if (req.file) {
            postData.image_url = req.file.path;
        }

        // Auto-SEO logic
        if (!postData.meta_title) {
            postData.meta_title = postData.title;
        }

        if (!postData.meta_description) {
            // Strip HTML tags for description and limit to 160 chars
            const plainContent = postData.excerpt || postData.content.replace(/<[^>]+>/g, '');
            postData.meta_description = plainContent.substring(0, 157) + '...';
        }

        const newPost = await postQueries.createPost(postData);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error al crear el post' });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const postData = { ...req.body };

        // Handle image upload
        if (req.file) {
            postData.image_url = req.file.path;
        }

        // Auto-SEO logic checks (only if fields are present in update but empty)
        if (postData.meta_title === '') {
            postData.meta_title = postData.title;
        }

        if (postData.meta_description === '') {
            const plainContent = postData.excerpt || postData.content.replace(/<[^>]+>/g, '');
            postData.meta_description = plainContent.substring(0, 157) + '...';
        }

        const updatedPost = await postQueries.updatePost(req.params.id, postData);
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Error al actualizar el post' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const deletedPost = await postQueries.deletePost(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json({ message: 'Post eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Error al eliminar el post' });
    }
};
