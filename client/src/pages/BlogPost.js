import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { API_ROOT } from '../services/api';
import './BlogPost.css';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`${API_ROOT}/api/posts/${slug}`);

            if (response.status === 404) {
                throw new Error('Artículo no encontrado');
            }

            if (!response.ok) {
                throw new Error('Error recuperando el artículo');
            }

            const data = await response.json();
            setPost(data);
        } catch (err) {
            setError(err.message || 'Error al cargar el artículo. Por favor, inténtalo de nuevo más tarde.');
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="loading">Cargando artículo...</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Vaya, ha habido un problema</h2>
                <p className="error-message">{error}</p>
                <Link to="/blog" className="btn btn-secondary">Volver al Blog</Link>
            </div>
        );
    }

    return (
        <div className="blog-post-page">
            <SEOHead
                title={post.meta_title || `${post.title} | Esencialmente Psicología`}
                description={post.meta_description || post.excerpt}
                image={post.image_url}
                type="article"
            />

            <div className="post-hero">
                <div className="post-hero-image">
                    {post.image_url && <img src={post.image_url} alt={post.title} />}
                </div>
                <div className="post-hero-content">
                    <h1>{post.title}</h1>
                    <div className="post-meta">
                        {new Date(post.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            <div className="post-container">
                <Link to="/blog" className="back-link">← Volver al Blog</Link>

                <article className="post-content" dangerouslySetInnerHTML={{ __html: post.content }}>
                    {/* Content injected here from backend HTML */}
                </article>



                <div className="social-share">
                    <h4>Compartir este artículo:</h4>
                    <div className="share-buttons">
                        <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.href)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-btn whatsapp"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-btn facebook"
                        >
                            Facebook
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-btn twitter"
                        >
                            X (Twitter)
                        </a>
                        <a
                            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-btn linkedin"
                        >
                            LinkedIn
                        </a>
                    </div>
                </div>

                <div className="cta-box">
                    <h3>¿Te ha parecido interesante este artículo?</h3>
                    <p>Si te identificas con lo que has leído y sientes que necesitas apoyo profesional, estamos aquí para escucharte.</p>
                    <Link to="/contacto" className="btn btn-primary">Solicitar Primera Cita</Link>
                </div>
            </div>
        </div >
    );
};

export default BlogPost;
