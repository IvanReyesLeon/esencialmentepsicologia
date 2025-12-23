import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { API_ROOT } from '../services/api';
import './Blog.css';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_ROOT}/api/posts`);
            if (!response.ok) {
                throw new Error('Error al cargar los posts');
            }
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            setError('Error al cargar los artículos. Por favor, inténtalo de nuevo más tarde.');
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="blog-page">
            <SEOHead
                title="Blog - Esencialmente Psicología"
                description="Artículos sobre psicología, bienestar emocional, ansiedad, burnout y más. Recursos para tu salud mental."
            />

            <div className="blog-hero">
                <div className="container">
                    <h1>Blog de Psicología</h1>
                    <p>Recursos, reflexiones y herramientas para tu bienestar emocional</p>
                </div>
            </div>

            <div className="container">
                {loading && <div className="loading">Cargando artículos...</div>}
                {error && <div className="error-message">{error}</div>}

                {!loading && !error && posts.length === 0 && (
                    <div className="no-posts">
                        <p>No hay artículos publicados todavía.</p>
                    </div>
                )}

                <div className="blog-grid">
                    {posts.map((post) => (
                        <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card-link">
                            <article className="blog-card">
                                <div className="blog-image">
                                    <img
                                        src={post.image_url || '/assets/logo.png'}
                                        alt={post.title}
                                        loading="lazy"
                                        onError={(e) => { e.target.src = '/assets/logo.png'; }}
                                    />
                                </div>
                                <div className="blog-content">
                                    <h3>{post.title}</h3>
                                    <p>{post.excerpt}</p>
                                    <div className="read-more">
                                        Leer artículo <span>→</span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;
