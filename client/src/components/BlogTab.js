import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlogTab = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        image_url: '',
        excerpt: '',
        meta_title: '',
        meta_description: '',
        published: false
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/posts?admin=true`);
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPost(null);
        setSelectedFile(null);
        setImagePreview(null);
        setFormData({
            title: '',
            slug: '',
            content: '',
            image_url: '',
            excerpt: '',
            meta_title: '',
            meta_description: '',
            published: false
        });
        setIsModalOpen(true);
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setSelectedFile(null);
        setImagePreview(post.image_url);
        setFormData({
            title: post.title,
            slug: post.slug,
            content: post.content,
            image_url: post.image_url || '',
            excerpt: post.excerpt || '',
            meta_title: post.meta_title || '',
            meta_description: post.meta_description || '',
            published: post.published
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este post?')) {
            try {
                await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
                fetchPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const [toast, setToast] = useState(null);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingPost
                ? `${API_URL}/posts/${editingPost.id}`
                : `${API_URL}/posts`;

            const method = editingPost ? 'PUT' : 'POST';

            // Use FormData to send file + data
            const data = new FormData();
            data.append('title', formData.title);
            data.append('slug', formData.slug);
            data.append('content', formData.content);
            data.append('excerpt', formData.excerpt);
            data.append('meta_title', formData.meta_title);
            data.append('meta_description', formData.meta_description);
            data.append('published', formData.published);

            // Only append image_url if no new file is selected (to keep existing)
            // If file is selected, it takes precedence
            if (!selectedFile && formData.image_url) {
                data.append('image_url', formData.image_url);
            }

            if (selectedFile) {
                data.append('image', selectedFile);
            }

            const res = await fetch(url, {
                method,
                // Headers are not needed for FormData, browser sets them automatically with boundary
                body: data
            });

            if (!res.ok) throw new Error('Error saving post');

            setIsModalOpen(false);
            fetchPosts();
            showToast(editingPost ? 'Post actualizado correctamente' : 'Post creado correctamente', 'success');
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('Error al guardar el post. Inténtalo de nuevo.', 'error');
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="tab-content relative">
            {toast && (
                <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} style={{ position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', borderRadius: '8px', zIndex: 1000, color: 'white', backgroundColor: toast.type === 'success' ? '#4CAF50' : '#f44336', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {toast.message}
                </div>
            )}
            <div className="tab-header">
                <h2>Gestión del Blog</h2>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Nuevo Post
                </button>
            </div>

            {loading ? (
                <div className="loading">Cargando posts...</div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Título</th>
                                <th>Slug</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id}>
                                    <td>
                                        {post.image_url && (
                                            <img
                                                src={post.image_url}
                                                alt={post.title}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        )}
                                    </td>
                                    <td>{post.title}</td>
                                    <td>{post.slug}</td>
                                    <td>
                                        <span className={`status-badge ${post.published ? 'active' : 'inactive'}`}>
                                            {post.published ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleEdit(post)}>✏️</button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(post.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h3>{editingPost ? 'Editar Post' : 'Nuevo Post'}</h3>
                            <button
                                className="close-modal"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Extracto (Resumen) *</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    required
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Imagen Principal</label>
                                <div className="photo-upload-inline">
                                    <div className="file-upload">
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <span>📁 Elegir imagen del PC</span>
                                        </label>
                                    </div>
                                    {imagePreview && (
                                        <div className="image-preview-inline">
                                            <img src={imagePreview} alt="Vista previa" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Contenido *</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(value) => setFormData({ ...formData, content: value })}
                                    modules={modules}
                                    style={{ height: '300px', marginBottom: '50px' }}
                                />
                            </div>

                            {/* Advanced / SEO Section */}
                            <div className="form-section">
                                <details>
                                    <summary style={{ cursor: 'pointer', color: '#666', fontWeight: 500, padding: '1rem 0' }}>
                                        ⚙️ Opciones Avanzadas (SEO y URL)
                                    </summary>
                                    <div className="form-row" style={{ marginTop: '1rem' }}>
                                        <div className="form-group">
                                            <label>Slug (URL) - Dejar vacío para automático</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                placeholder="ej: mi-nuevo-articulo"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Meta Título (Opcional)</label>
                                            <input
                                                type="text"
                                                value={formData.meta_title}
                                                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                                placeholder="Se usará el título si está vacío"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Meta Descripción (Opcional)</label>
                                            <input
                                                type="text"
                                                value={formData.meta_description}
                                                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                                placeholder="Se usará el resumen si está vacío"
                                            />
                                        </div>
                                    </div>
                                </details>
                            </div>

                            <div className="form-group checkbox-group" style={{ marginTop: '1rem' }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.published}
                                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    />
                                    Publicar inmediatamente
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPost ? 'Guardar Cambios' : 'Crear Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogTab;
